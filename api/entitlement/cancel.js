// api/entitlement/cancel.js
// POST /api/entitlement/cancel  { entitlement }
// The in-app "Downgrade to Basic" button for a paying PayFast subscriber. It really cancels
// the subscription at PayFast (otherwise the card keeps being charged while the screen says
// Basic), and the buyer keeps their plan until the period they already paid for ends.
//
// Authenticated by the signed entitlement token -- the same proof of purchase the app already
// holds -- so only the browser that paid (or restored) can cancel; the email inside the token
// decides which subscriptions are affected. An expired token still counts: letting someone
// cancel is never the risky direction.
import { rejectMethod, readJsonBody, sendJson } from '../_lib/http.js';
import { paymentProvider } from '../_lib/provider.js';
import { verifyEntitlement } from '../_lib/entitlement.js';
import { cancelActiveForEmail } from '../_lib/payfastCancel.js';

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  const provider = paymentProvider(process.env);
  if (provider !== 'payfast') {
    // Demo mode or Paystack: nothing for this endpoint to cancel; the client falls back.
    return sendJson(res, 200, { status: 'unconfigured' });
  }

  const { entitlement } = await readJsonBody(req);
  const check = verifyEntitlement(entitlement, process.env.ENTITLEMENT_SECRET);
  if (!check.payload || !check.payload.email) return sendJson(res, 200, { status: 'invalid' });

  try {
    const result = await cancelActiveForEmail(check.payload.email, process.env);
    return sendJson(res, 200, result);
  } catch (err) {
    console.error('entitlement cancel error', err.message);
    return sendJson(res, 200, { status: 'error' });
  }
}
