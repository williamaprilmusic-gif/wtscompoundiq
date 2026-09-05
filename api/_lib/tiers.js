// api/_lib/tiers.js
// Maps between the app's tier names and the Paystack Plan codes that represent them.
// Plan codes are per-account and per-environment, so they live in env vars, never in
// the repo. Set these in the Vercel project (see docs/PAYMENTS.md):
//
//   PAYSTACK_PLAN_PRO_MONTHLY, PAYSTACK_PLAN_PRO_ANNUAL,
//   PAYSTACK_PLAN_ULTRA_MONTHLY, PAYSTACK_PLAN_ULTRA_ANNUAL
//
// Pro and Ultra are the only paid, self-service tiers. (There was briefly an
// "Enterprise" tier; it was removed and its keepable features folded into Ultra --
// nothing here ever referenced it as a Paystack plan.)

export const PAID_TIERS = ['Pro', 'Ultra'];
export const PERIODS = ['monthly', 'annual'];

const ENV_KEY = (tier, period) => `PAYSTACK_PLAN_${tier.toUpperCase()}_${period.toUpperCase()}`;

// planCodeFor('Pro', 'monthly', process.env) -> 'PLN_xxx' or null if unset/unknown.
export const planCodeFor = (tier, period, env) => {
  if (!PAID_TIERS.includes(tier) || !PERIODS.includes(period)) return null;
  const code = env[ENV_KEY(tier, period)];
  return code && String(code).trim() ? String(code).trim() : null;
};

// Reverse lookup for verify/refresh: given the plan code Paystack reports back, which
// tier + period is it? Returns { tier, period } or null.
export const tierForPlanCode = (planCode, env) => {
  if (!planCode) return null;
  for (const tier of PAID_TIERS) {
    for (const period of PERIODS) {
      if (env[ENV_KEY(tier, period)] && String(env[ENV_KEY(tier, period)]).trim() === String(planCode).trim()) {
        return { tier, period };
      }
    }
  }
  return null;
};

// True once at least one paid plan code is configured -- gates the whole live-payment
// path. When false, the app stays in the existing no-charge demo mode.
export const isCheckoutConfigured = (env) =>
  Boolean(env.PAYSTACK_SECRET_KEY && env.ENTITLEMENT_SECRET) &&
  PAID_TIERS.some((tier) => PERIODS.some((period) => planCodeFor(tier, period, env)));
