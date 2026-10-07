// api/paystack/verify.js
// POST /api/paystack/verify  { reference }
// Called when the customer returns from Paystack checkout. Confirms the transaction
// with Paystack and, on success, issues a signed entitlement token the browser stores
// to unlock its tier. Returns { entitlement, tier, period, email } or an error.
import { rejectMethod, readJsonBody, sendJson } from '../_lib/http.js';
import { isCheckoutConfigured, tierForPlanCode } from '../_lib/tiers.js';
import { paystackApi } from '../_lib/paystack.js';
import { signEntitlement } from '../_lib/entitlement.js';

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  if (!isCheckoutConfigured(process.env)) {
    return sendJson(res, 503, { error: 'payments_not_configured' });
  }

  const { reference } = await readJsonBody(req);
  if (typeof reference !== 'string' || !reference.trim()) {
    return sendJson(res, 400, { error: 'missing_reference' });
  }

  let txn;
  try {
    txn = await paystackApi(process.env.PAYSTACK_SECRET_KEY).verifyTransaction(reference.trim());
  } catch (err) {
    return sendJson(res, 502, { error: 'paystack_verify_failed' });
  }

  if (!txn || txn.status !== 'success') {
    return sendJson(res, 402, { error: 'payment_not_successful', status: txn && txn.status });
  }

  // A subscription transaction reports the plan it was for. Never fall back to
  // txn.metadata: the client controls it on a self-made Paystack transaction, so it can
  // not be trusted to say which tier was paid for.
  const planCode =
    (txn.plan && (txn.plan.plan_code || txn.plan)) ||
    (txn.plan_object && txn.plan_object.plan_code) ||
    null;
  let mapped = tierForPlanCode(planCode, process.env);
  if (!mapped) {
    return sendJson(res, 422, { error: 'unrecognised_plan' });
  }

  const email = (txn.customer && txn.customer.email) || '';
  const entitlement = signEntitlement(
    { email, tier: mapped.tier, period: mapped.period },
    process.env.ENTITLEMENT_SECRET
  );

  return sendJson(res, 200, { entitlement, tier: mapped.tier, period: mapped.period, email });
}
