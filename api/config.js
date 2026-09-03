// api/config.js
// GET /api/config -- lets the front-end decide, at runtime, whether to show the real
// Paystack checkout or stay in no-charge demo mode. Exposes only non-secret values.
import { rejectMethod, sendJson } from './_lib/http.js';
import { isCheckoutConfigured, planCodeFor, PAID_TIERS, PERIODS } from './_lib/tiers.js';

export default function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return;

  const configured = isCheckoutConfigured(process.env);
  const availablePlans = {};
  if (configured) {
    for (const tier of PAID_TIERS) {
      for (const period of PERIODS) {
        if (planCodeFor(tier, period, process.env)) {
          (availablePlans[tier] ||= []).push(period);
        }
      }
    }
  }

  sendJson(res, 200, {
    paymentsMode: configured ? 'live' : 'demo',
    paystackPublicKey: configured ? (process.env.PAYSTACK_PUBLIC_KEY || null) : null,
    availablePlans
  });
}
