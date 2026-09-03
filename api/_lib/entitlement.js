// api/_lib/entitlement.js
// A signed, self-contained "entitlement" token proving a browser paid for a tier,
// issued server-side after a Paystack transaction/subscription is verified.
//
// Why a token instead of a database row: the app has no accounts and no backend
// datastore (see the Terms' "No Account, Local-First Data" section). The token is the
// entitlement -- the client stores it in localStorage exactly like the old plain
// `wts_compoundiq_tier` string, but it can't be forged (HMAC over a server-only
// secret) and it expires, so a lapsed subscription stops unlocking features on its own
// even if the refresh check (api/entitlement/refresh.js) never runs.
//
// Format:  base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, secret))
// Payload: { email, tier, period, iat, exp }  -- all seconds-since-epoch for iat/exp.

import { createHmac, timingSafeEqual } from 'node:crypto';

// Sliding lifetime granted on each issue/refresh. Comfortably longer than the billing
// cycle so a brief outage of the refresh endpoint never locks a paying user out mid
// month; short enough that a cancelled subscription that also never hits the refresh
// path (e.g. the user never reopens the app) still lapses within roughly a cycle.
export const ENTITLEMENT_TTL_SECONDS = {
  monthly: 35 * 24 * 60 * 60,
  annual: 370 * 24 * 60 * 60
};

const b64urlEncode = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64urlDecode = (str) => {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
};

const sign = (payloadB64, secret) =>
  b64urlEncode(createHmac('sha256', secret).update(payloadB64).digest());

// now: injectable for tests; defaults to real wall-clock seconds.
export const signEntitlement = ({ email, tier, period }, secret, now = Math.floor(Date.now() / 1000)) => {
  if (!secret) throw new Error('signEntitlement: missing secret');
  const ttl = ENTITLEMENT_TTL_SECONDS[period] ?? ENTITLEMENT_TTL_SECONDS.monthly;
  const payload = { email: String(email || '').toLowerCase(), tier, period, iat: now, exp: now + ttl };
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
};

// Returns { valid, expired, reason, payload }. `valid` is true only for an
// untampered, unexpired token. `expired` is reported separately so the caller can
// tell "forged / corrupt" (drop it) from "just needs a refresh" (try to renew).
export const verifyEntitlement = (token, secret, now = Math.floor(Date.now() / 1000)) => {
  if (!secret) throw new Error('verifyEntitlement: missing secret');
  if (typeof token !== 'string' || !token.includes('.')) {
    return { valid: false, expired: false, reason: 'malformed', payload: null };
  }
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return { valid: false, expired: false, reason: 'malformed', payload: null };

  const expected = sign(payloadB64, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, expired: false, reason: 'bad-signature', payload: null };
  }

  let payload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8'));
  } catch {
    return { valid: false, expired: false, reason: 'bad-payload', payload: null };
  }

  if (!payload || typeof payload.exp !== 'number' || typeof payload.tier !== 'string') {
    return { valid: false, expired: false, reason: 'bad-payload', payload: null };
  }
  if (now >= payload.exp) {
    return { valid: false, expired: true, reason: 'expired', payload };
  }
  return { valid: true, expired: false, reason: null, payload };
};
