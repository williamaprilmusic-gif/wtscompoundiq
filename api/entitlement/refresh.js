// api/entitlement/refresh.js
// POST /api/entitlement/refresh  { entitlement }
// The app calls this on load when it holds an entitlement token. The server checks the
// token's signature, then asks Paystack whether that customer's subscription is still
// active, and either re-issues a fresh token (sliding expiry) or tells the client to
// downgrade. This is what makes a cancelled/lapsed subscription actually lose access.
import { rejectMethod, readJsonBody, sendJson } from '../_lib/http.js';
import { isCheckoutConfigured } from '../_lib/tiers.js';
import { paystackApi, subscriptionIsActive } from '../_lib/paystack.js';
import { verifyEntitlement, signEntitlement } from '../_lib/entitlement.js';

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  if (!isCheckoutConfigured(process.env)) {
    // Payments turned off again -- tell the client to fall back to demo/basic rather
    // than trusting a stale token forever.
    return sendJson(res, 200, { status: 'unconfigured' });
  }

  const { entitlement } = await readJsonBody(req);
  const check = verifyEntitlement(entitlement, process.env.ENTITLEMENT_SECRET);

  // Forged or corrupt -> hard reject. Merely expired -> still try to renew from
  // Paystack (the subscription may well still be active).
  if (!check.payload) {
    return sendJson(res, 200, { status: 'invalid' });
  }
  const { email, tier, period } = check.payload;

  let active = false;
  try {
    const api = paystackApi(process.env.PAYSTACK_SECRET_KEY);
    const subs = await api.listSubscriptions({ perPage: 50 });
    const list = Array.isArray(subs) ? subs : (subs && subs.data) || [];
    active = list.some(
      (s) =>
        s &&
        s.customer &&
        String(s.customer.email || '').toLowerCase() === String(email).toLowerCase() &&
        subscriptionIsActive(s)
    );
  } catch (err) {
    // Can't reach Paystack: don't punish a paying user for our outage. If their token
    // is still valid, keep it; if it had expired, grant a short renewal so they get
    // another chance to refresh later.
    if (check.valid) return sendJson(res, 200, { status: 'kept', entitlement, tier, period });
    const grace = signEntitlement({ email, tier, period }, process.env.ENTITLEMENT_SECRET);
    return sendJson(res, 200, { status: 'grace', entitlement: grace, tier, period });
  }

  if (!active) {
    return sendJson(res, 200, { status: 'lapsed' });
  }
  const fresh = signEntitlement({ email, tier, period }, process.env.ENTITLEMENT_SECRET);
  return sendJson(res, 200, { status: 'renewed', entitlement: fresh, tier, period });
}
