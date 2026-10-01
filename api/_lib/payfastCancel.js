// api/_lib/payfastCancel.js
// Stops an old PayFast subscription from billing once the same email has started a newer
// one (upgrade, downgrade, or a repeat purchase) -- otherwise the buyer is charged twice.
//
// Order of operations is deliberate: the NEW plan is activated first and an old row is
// marked 'superseded' BEFORE the PayFast API call, so access always follows the newest
// payment even if PayFast's API is down. A 'superseded' row is retried later
// (retrySuperseded) until PayFast confirms the cancel, then becomes 'cancelled'.
import crypto from 'node:crypto';
import { getConfig, db } from './payfast.js';

// Same PHP-style encoding the checkout/ITN signatures use.
const enc = (v) =>
  encodeURIComponent(String(v).trim())
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, '+');

// PayFast REST API signature: every header + the passphrase, keys sorted alphabetically.
export const apiSignature = (params, passphrase) => {
  const all = passphrase ? { ...params, passphrase } : params;
  const str = Object.keys(all).sort().map((k) => `${k}=${enc(all[k])}`).join('&');
  return crypto.createHash('md5').update(str).digest('hex');
};

// PUT /subscriptions/:token/cancel. Returns { ok, alreadyCancelled?, status, detail }.
export async function cancelSubscriptionAtPayFast(token, env = process.env, now = new Date()) {
  const cfg = getConfig(env);
  const headers = {
    'merchant-id': cfg.merchantId,
    version: 'v1',
    timestamp: now.toISOString().slice(0, 19)
  };
  const signature = apiSignature(headers, cfg.passphrase);
  // Sandbox calls must be flagged ?testing=true or PayFast looks for the token in live.
  const url = `https://api.payfast.co.za/subscriptions/${encodeURIComponent(token)}/cancel${cfg.live ? '' : '?testing=true'}`;
  const res = await fetch(url, { method: 'PUT', headers: { ...headers, signature } });
  const text = await res.text();
  let body = {};
  try { body = JSON.parse(text); } catch { /* non-JSON error page */ }
  // PayFast answers HTTP 200 even for failures -- the real outcome is in the body:
  //   success: {"code":200,"status":"success","data":{"response":true,"message":"Success"}}
  //   already: {"code":400,"status":"failed","data":{"response":false,"message":"Failure - The subscription status is cancelled"}}
  //   bad sig: HTTP 401 {"code":401,...,"data":{"response":"Merchant authorization failed."}}
  const d = body.data || {};
  const detail = String(d.message || (typeof d.response === 'string' ? d.response : '') || text || '').slice(0, 120);
  const ok = res.ok && (body.status === 'success' || body.code === 200);
  // Cancelling something already cancelled is the outcome we want, not a failure.
  const alreadyCancelled = !ok && /status is cancell?ed/i.test(detail);
  return { ok: ok || alreadyCancelled, alreadyCancelled, status: res.status, detail };
}

const patch = (paymentId, status, env, extra = {}) =>
  db(`subscriptions?payment_id=eq.${paymentId}`, {
    method: 'PATCH',
    body: { status, ...extra, updated_at: new Date().toISOString() }
  }, env);

// Try to cancel one row at PayFast; on success mark it 'cancelled'. Never throws.
async function cancelRow(row, env) {
  if (!row.payfast_token) {
    console.error(`payfast cancel: row ${row.payment_id} has no token; cancel it manually in PayFast`);
    return false;
  }
  try {
    const r = await cancelSubscriptionAtPayFast(row.payfast_token, env);
    if (!r.ok) {
      console.error(`payfast cancel FAILED for ${row.payment_id}: http ${r.status} ${r.detail} -- will retry; cancel manually in PayFast if it persists`);
      return false;
    }
    await patch(row.payment_id, 'cancelled', env);
    return true;
  } catch (err) {
    console.error(`payfast cancel error for ${row.payment_id}: ${err.message} -- will retry`);
    return false;
  }
}

// Called when `keepPaymentId` has just become active: retire every OTHER active
// subscription for the same email. Never throws (the new plan must stand regardless).
export async function supersedeOtherSubscriptions(email, keepPaymentId, env = process.env) {
  try {
    const rows = await db(
      `subscriptions?email=eq.${encodeURIComponent(String(email).toLowerCase())}&status=eq.active&payment_id=neq.${keepPaymentId}&select=payment_id,payfast_token`,
      {}, env
    );
    for (const row of rows || []) {
      // Access follows the newest payment immediately: clearing paid_through stops this retired
      // plan counting as "cancelled but paid for", which would let it outrank the plan chosen.
      await patch(row.payment_id, 'superseded', env, { paid_through: null });
      await cancelRow(row, env);
    }
    return (rows || []).length;
  } catch (err) {
    console.error(`payfast supersede error for ${email}: ${err.message}`);
    return 0;
  }
}

// Retry any 'superseded' rows for this email whose PayFast cancel hasn't gone through.
// Cheap when there are none (one small query). Never throws.
export async function retrySuperseded(email, env = process.env) {
  try {
    const rows = await db(
      `subscriptions?email=eq.${encodeURIComponent(String(email).toLowerCase())}&status=eq.superseded&select=payment_id,payfast_token`,
      {}, env
    );
    for (const row of rows || []) await cancelRow(row, env);
  } catch (err) {
    console.error(`payfast retry-cancel error for ${email}: ${err.message}`);
  }
}

// The buyer chose to cancel (in-app "Downgrade to Basic"). Cancel their active plan(s) at
// PayFast. The status becomes 'cancelled' but paid_through is KEPT, so they retain what they
// already paid for until it ends (the Refund Policy's promise). Returns:
//   { status: 'cancelled', accessUntil }   cancelled now
//   { status: 'already_cancelled', accessUntil }  nothing active, but a paid period remains
//   { status: 'none' }                     no subscription at all for this email
//   { status: 'error' }                    PayFast refused; the buyer can retry or cancel in PayFast
export async function cancelActiveForEmail(email, env = process.env, now = new Date()) {
  const enc = encodeURIComponent(String(email).toLowerCase());
  const active = (await db(`subscriptions?email=eq.${enc}&status=eq.active&select=payment_id,payfast_token`, {}, env)) || [];
  let failed = 0;
  for (const row of active) if (!(await cancelRow(row, env))) failed += 1;
  if (failed) return { status: 'error' };

  const paid = (await db(
    `subscriptions?email=eq.${enc}&status=eq.cancelled&paid_through=gt.${encodeURIComponent(now.toISOString())}&select=paid_through&order=paid_through.desc&limit=1`,
    {}, env
  )) || [];
  const accessUntil = paid[0]?.paid_through || null;
  if (active.length) return { status: 'cancelled', accessUntil };
  return accessUntil ? { status: 'already_cancelled', accessUntil } : { status: 'none' };
}
