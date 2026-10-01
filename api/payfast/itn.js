// api/payfast/itn.js
// POST /api/payfast/itn -- PayFast's Instant Transaction Notification webhook. Activates
// / cancels a subscription only after all four PayFast-mandated checks pass:
//   1. signature  2. source IP is PayFast  3. amount matches our price  4. PayFast confirms.
import dns from 'node:dns/promises';
import { sendJson } from '../_lib/http.js';
import { getConfig, PRICES, sign, db, UUID_RE } from '../_lib/payfast.js';
import { supersedeOtherSubscriptions } from '../_lib/payfastCancel.js';

const PAYFAST_HOSTS = ['www.payfast.co.za', 'sandbox.payfast.co.za', 'w1w.payfast.co.za', 'w2w.payfast.co.za'];

async function fromPayFast(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (!ip) return false;
  const lists = await Promise.all(PAYFAST_HOSTS.map((h) => dns.resolve4(h).catch(() => [])));
  return lists.flat().includes(ip);
}

// Every rejection is logged with its reason (never credentials or signatures) so a failed
// notification can be diagnosed from the Vercel logs.
const reject = (res, reason, extra = '') => {
  console.error(`payfast itn rejected: ${reason} ${extra}`.trim());
  return sendJson(res, 400, { error: reason });
};

// Keep PayFast's field order -- the signature is computed over it.
const readEntries = (req) => {
  const raw = req.body;
  if (typeof raw === 'string') return [...new URLSearchParams(raw)];
  if (Buffer.isBuffer(raw)) return [...new URLSearchParams(raw.toString('utf8'))];
  return Object.entries(raw || {});
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }
  const cfg = getConfig(process.env);
  const entries = readEntries(req);
  const data = Object.fromEntries(entries);

  try {
    // ITN signatures keep blank fields (custom_str1=...), unlike checkout signatures.
    if (sign(entries, cfg.passphrase, true) !== data.signature) {
      return reject(res, 'bad_signature', `fields=${entries.map(([k]) => k).join(',')}`);
    }
    if (!(await fromPayFast(req))) {
      return reject(res, 'bad_source', `ip=${String(req.headers['x-forwarded-for'] || '')}`);
    }

    const pid = data.m_payment_id;
    if (!UUID_RE.test(pid || '')) return reject(res, 'bad_id');
    const [row] = (await db(`subscriptions?payment_id=eq.${pid}&select=*`)) || [];
    if (!row) return reject(res, 'unknown_payment');

    const expected = PRICES[row.tier]?.[row.period];
    if (!expected || Math.abs(parseFloat(data.amount_gross) - expected) > 0.01) {
      return reject(res, 'amount_mismatch', `got=${data.amount_gross} expected=${expected}`);
    }

    const validate = await fetch(`https://${cfg.host}/eng/query/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(entries).toString()
    });
    const verdict = (await validate.text()).trim();
    if (verdict !== 'VALID') return reject(res, 'not_validated', `payfast said: ${verdict.slice(0, 80)}`);

    const status = { COMPLETE: 'active', CANCELLED: 'cancelled', FAILED: 'failed' }[data.payment_status];
    if (status) {
      // A SUPERSEDED row is one we retired on purpose when the buyer started a newer plan;
      // late/renewal notifications for it must not bring it back to life.
      if (row.status === 'superseded') return sendJson(res, 200, { received: true });
      await db(`subscriptions?payment_id=eq.${pid}`, {
        method: 'PATCH',
        body: {
          status,
          payfast_token: data.token || row.payfast_token,
          last_pf_payment_id: data.pf_payment_id || row.last_pf_payment_id,
          updated_at: new Date().toISOString()
        }
      });
      // First payment of a NEW subscription (pending -> active), not a renewal: retire the
      // buyer's other active plans so an upgrade/downgrade never bills twice.
      if (status === 'active' && row.status === 'pending') {
        await supersedeOtherSubscriptions(row.email, pid);
      }
    }
    return sendJson(res, 200, { received: true });
  } catch (err) {
    // 500 makes PayFast retry the notification later.
    console.error('payfast itn error', err.message);
    return sendJson(res, 500, { error: 'server_error' });
  }
}
