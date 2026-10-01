// api/payfast/verify.js
// POST /api/payfast/verify  { paymentId }
// Called when the buyer returns from PayFast. If the ITN webhook has already activated
// that payment, issues the same signed entitlement token /api/paystack/verify does.
// Returns { status: 'pending' } while the webhook hasn't landed yet (the client retries).
import { rejectMethod, readJsonBody, sendJson } from '../_lib/http.js';
import { isPayfastConfigured, db, UUID_RE } from '../_lib/payfast.js';
import { signEntitlement } from '../_lib/entitlement.js';

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  if (!isPayfastConfigured(process.env)) return sendJson(res, 503, { error: 'payments_not_configured' });

  const { paymentId } = await readJsonBody(req);
  if (typeof paymentId !== 'string' || !UUID_RE.test(paymentId)) {
    return sendJson(res, 400, { error: 'bad_payment_id' });
  }

  let row;
  try {
    [row] = (await db(`subscriptions?payment_id=eq.${paymentId}&select=email,tier,period,status`)) || [];
  } catch (err) {
    console.error('payfast verify error', err.message);
    return sendJson(res, 502, { error: 'lookup_failed' });
  }
  if (!row) return sendJson(res, 404, { error: 'unknown_payment' });
  if (row.status === 'pending') return sendJson(res, 200, { status: 'pending' });
  if (row.status !== 'active') return sendJson(res, 402, { error: 'payment_not_successful', status: row.status });

  const entitlement = signEntitlement(
    { email: row.email, tier: row.tier, period: row.period },
    process.env.ENTITLEMENT_SECRET
  );
  return sendJson(res, 200, { status: 'active', entitlement, tier: row.tier, period: row.period, email: row.email });
}
