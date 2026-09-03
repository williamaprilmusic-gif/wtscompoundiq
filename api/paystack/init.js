// api/paystack/init.js
// POST /api/paystack/init  { email, tier, period }
// Starts a Paystack subscription checkout and returns { authorization_url, reference }.
// The browser then redirects to authorization_url; on completion Paystack appends
// ?reference=<ref>&trxref=<ref> to the callback URL and sends the customer back there,
// where the app picks it up on load and calls /api/paystack/verify.
import { rejectMethod, readJsonBody, sendJson, originFromRequest } from '../_lib/http.js';
import { isCheckoutConfigured, planCodeFor } from '../_lib/tiers.js';
import { paystackApi } from '../_lib/paystack.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  if (!isCheckoutConfigured(process.env)) {
    return sendJson(res, 503, { error: 'payments_not_configured' });
  }

  const { email, tier, period } = await readJsonBody(req);
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return sendJson(res, 400, { error: 'invalid_email' });
  }
  const planCode = planCodeFor(tier, period, process.env);
  if (!planCode) return sendJson(res, 400, { error: 'unknown_plan', tier, period });

  const origin = originFromRequest(req);
  try {
    const data = await paystackApi(process.env.PAYSTACK_SECRET_KEY).initializeTransaction({
      email: email.trim().toLowerCase(),
      plan: planCode,
      // Paystack appends ?reference=&trxref= to this URL itself.
      callback_url: `${origin}/`,
      metadata: { tier, period, source: 'wts-compoundiq' }
    });
    return sendJson(res, 200, {
      authorization_url: data.authorization_url,
      reference: data.reference
    });
  } catch (err) {
    return sendJson(res, 502, { error: 'paystack_init_failed', message: err.message });
  }
}
