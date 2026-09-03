// api/paystack/webhook.js
// POST /api/paystack/webhook -- Paystack server-to-server events.
// Signature is HMAC-SHA512 of the RAW body keyed by the secret key, in
// x-paystack-signature. We must read the raw body, so Vercel's body parser is disabled
// for this route (config below).
//
// Current limitation: with no datastore there's no per-browser state to push an event
// to, so this endpoint verifies + acknowledges events and logs the ones that matter
// (subscription.disable, invoice.payment_failed, charge.success). Enforcement of a
// cancelled subscription happens on the client's next load via /api/entitlement/refresh
// -- so even if the platform's body parser interferes with the raw-body read below and
// this check fails closed (401), entitlement correctness is unaffected; only instant
// propagation is. When a KV/DB is added, record the (email -> status) change here.
import { verifyWebhookSignature } from '../_lib/paystack.js';
import { readRawBody, sendJson } from '../_lib/http.js';

export const config = { api: { bodyParser: false } };

const NOTABLE = new Set([
  'charge.success',
  'invoice.create',
  'invoice.payment_failed',
  'subscription.create',
  'subscription.disable',
  'subscription.not_renew'
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return sendJson(res, 503, { error: 'payments_not_configured' });

  const raw = await readRawBody(req);
  const signature = req.headers['x-paystack-signature'];
  if (!verifyWebhookSignature(raw, signature, secretKey)) {
    return sendJson(res, 401, { error: 'bad_signature' });
  }

  let event = null;
  try { event = JSON.parse(raw); } catch { /* handled below */ }
  if (!event || !event.event) return sendJson(res, 400, { error: 'bad_payload' });

  if (NOTABLE.has(event.event)) {
    const email =
      (event.data && event.data.customer && event.data.customer.email) ||
      (event.data && event.data.subscription && event.data.subscription.customer &&
        event.data.subscription.customer.email) ||
      'unknown';
    // Structured log line; Vercel captures stdout. Swap for a KV write when available.
    console.log(`[paystack.webhook] ${event.event} email=${email}`);
  }

  // Always 200 quickly so Paystack doesn't retry a handled event.
  return sendJson(res, 200, { received: true });
}
