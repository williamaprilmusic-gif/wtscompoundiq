// api/entitlement/restore.js
// POST /api/entitlement/restore  { email }
//
// The safeguard for "I paid, then cleared my browser data / switched device". There is
// no account system, so the entitlement token in localStorage is the only proof of
// purchase a browser holds -- clearing site data wipes it. The subscription itself,
// though, still lives on Paystack keyed by the payer's email. This endpoint takes that
// email, asks Paystack whether it has an active subscription, and if so re-issues a
// fresh signed entitlement token so the browser unlocks its tier again.
//
// It reveals nothing an attacker couldn't already attempt via checkout: a wrong email
// simply gets { status: 'none' }, and a correct one only ever restores the tier that
// email is genuinely paying for. The token is still HMAC-signed and still expires.
import { rejectMethod, readJsonBody, sendJson } from '../_lib/http.js';
import { isCheckoutConfigured, tierForPlanCode } from '../_lib/tiers.js';
import { paystackApi, pickBestSubscriptionTier } from '../_lib/paystack.js';
import { signEntitlement } from '../_lib/entitlement.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  if (!isCheckoutConfigured(process.env)) {
    // Demo mode: no real purchases exist, so there is nothing to restore.
    return sendJson(res, 200, { status: 'unconfigured' });
  }

  const { email } = await readJsonBody(req);
  const clean = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) {
    return sendJson(res, 400, { status: 'bad_email' });
  }

  let list = [];
  try {
    const api = paystackApi(process.env.PAYSTACK_SECRET_KEY);
    const subs = await api.listSubscriptions({ perPage: 100 });
    list = Array.isArray(subs) ? subs : (subs && subs.data) || [];
  } catch (err) {
    return sendJson(res, 502, { status: 'error', message: err.message });
  }

  const best = pickBestSubscriptionTier(list, clean, (code) => tierForPlanCode(code, process.env));
  if (!best) {
    return sendJson(res, 200, { status: 'none' });
  }

  const entitlement = signEntitlement(
    { email: clean, tier: best.tier, period: best.period },
    process.env.ENTITLEMENT_SECRET
  );
  return sendJson(res, 200, { status: 'restored', entitlement, tier: best.tier, period: best.period });
}
