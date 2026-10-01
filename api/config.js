// api/config.js
// GET /api/config -- lets the front-end decide, at runtime, whether to show the real
// Paystack checkout or stay in no-charge demo mode. Exposes only non-secret values.
import { rejectMethod, sendJson } from './_lib/http.js';
import { planCodeFor, PAID_TIERS, PERIODS } from './_lib/tiers.js';
import { paymentProvider } from './_lib/provider.js';

export default function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return;

  const provider = paymentProvider(process.env);
  const configured = Boolean(provider);
  const availablePlans = {};
  if (configured) {
    for (const tier of PAID_TIERS) {
      for (const period of PERIODS) {
        // PayFast needs no per-plan codes (plans are built per checkout); Paystack does.
        if (provider === 'payfast' || planCodeFor(tier, period, process.env)) {
          (availablePlans[tier] ||= []).push(period);
        }
      }
    }
  }

  sendJson(res, 200, {
    paymentsMode: configured ? 'live' : 'demo',
    provider: provider || null, // 'payfast' | 'paystack' | null (demo)
    paystackPublicKey: provider === 'paystack' ? (process.env.PAYSTACK_PUBLIC_KEY || null) : null,
    availablePlans
  });
}
