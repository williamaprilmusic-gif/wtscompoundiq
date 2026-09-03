// api/_lib/paystack.js
// Thin server-side wrapper around the Paystack REST API + webhook signature check.
// Nothing here ever runs in the browser -- PAYSTACK_SECRET_KEY must stay server-only.

import { createHmac, timingSafeEqual } from 'node:crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

const authHeaders = (secretKey) => ({
  Authorization: `Bearer ${secretKey}`,
  'Content-Type': 'application/json'
});

// Resolves to Paystack's parsed JSON body. Throws on a network failure or a non-2xx
// response (message taken from Paystack's own `message` field where present).
const request = async (method, path, { secretKey, body } = {}) => {
  if (!secretKey) throw new Error('paystack: missing secret key');
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: authHeaders(secretKey),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try { json = await res.json(); } catch { /* leave null; handled below */ }
  if (!res.ok || !json || json.status === false) {
    const msg = (json && json.message) || `Paystack ${method} ${path} failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.paystack = json;
    throw err;
  }
  return json;
};

export const paystackApi = (secretKey) => ({
  // Create a transaction. Pass `plan` (a PLN_ code) for a subscription, or `amount`
  // (in kobo/cents) for a one-off. Returns { authorization_url, access_code, reference }.
  initializeTransaction: (payload) =>
    request('POST', '/transaction/initialize', { secretKey, body: payload }).then((j) => j.data),

  // Confirm a transaction after the customer returns from checkout.
  verifyTransaction: (reference) =>
    request('GET', `/transaction/verify/${encodeURIComponent(reference)}`, { secretKey }).then((j) => j.data),

  // List subscriptions, optionally filtered by customer email or code. Used by the
  // refresh endpoint to see whether a subscription is still active.
  listSubscriptions: (query = {}) => {
    const qs = new URLSearchParams(query).toString();
    return request('GET', `/subscription${qs ? `?${qs}` : ''}`, { secretKey }).then((j) => j.data);
  },

  getCustomer: (emailOrCode) =>
    request('GET', `/customer/${encodeURIComponent(emailOrCode)}`, { secretKey }).then((j) => j.data)
});

// Paystack signs each webhook with HMAC-SHA512 of the RAW request body, keyed by your
// secret key, in the `x-paystack-signature` header. Compare in constant time.
export const verifyWebhookSignature = (rawBody, signatureHeader, secretKey) => {
  if (!rawBody || !signatureHeader || !secretKey) return false;
  const expected = createHmac('sha512', secretKey)
    .update(typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody))
    .digest('hex');
  const a = Buffer.from(String(signatureHeader));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

// A subscription record counts as "still entitling" while Paystack reports it active
// and not past its next payment date by more than a short grace. Kept pure/synchronous
// so it's unit-testable; the endpoint feeds it Paystack's own subscription object.
export const subscriptionIsActive = (sub, now = Date.now()) => {
  if (!sub || typeof sub !== 'object') return false;
  if (sub.status && !['active', 'attention', 'non-renewing'].includes(sub.status)) return false;
  if (sub.status === 'active' || sub.status === 'non-renewing') return true;
  // 'attention' = a renewal is failing; allow a short grace past next_payment_date.
  const next = sub.next_payment_date ? Date.parse(sub.next_payment_date) : NaN;
  if (Number.isNaN(next)) return sub.status === 'attention' ? true : false;
  const GRACE_MS = 3 * 24 * 60 * 60 * 1000;
  return now <= next + GRACE_MS;
};
