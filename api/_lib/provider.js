// api/_lib/provider.js
// Which payment provider is live. PayFast wins if fully configured, then Paystack, else
// null (demo mode -- the app's existing no-charge simulation).
import { isPayfastConfigured } from './payfast.js';
import { isCheckoutConfigured } from './tiers.js';

export const paymentProvider = (env = process.env) =>
  isPayfastConfigured(env) ? 'payfast' : isCheckoutConfigured(env) ? 'paystack' : null;
