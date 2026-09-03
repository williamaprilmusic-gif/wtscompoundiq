// api/_lib/tiers.test.js
import { describe, it, expect } from 'vitest';
import { planCodeFor, tierForPlanCode, isCheckoutConfigured } from './tiers.js';

const FULL_ENV = {
  PAYSTACK_SECRET_KEY: 'sk_test_x',
  ENTITLEMENT_SECRET: 'ent_secret',
  PAYSTACK_PLAN_PRO_MONTHLY: 'PLN_pro_m',
  PAYSTACK_PLAN_PRO_ANNUAL: 'PLN_pro_a',
  PAYSTACK_PLAN_ULTRA_MONTHLY: 'PLN_ultra_m',
  PAYSTACK_PLAN_ULTRA_ANNUAL: 'PLN_ultra_a'
};

describe('planCodeFor', () => {
  it('maps a known tier+period to its configured plan code', () => {
    expect(planCodeFor('Pro', 'monthly', FULL_ENV)).toBe('PLN_pro_m');
    expect(planCodeFor('Ultra', 'annual', FULL_ENV)).toBe('PLN_ultra_a');
  });
  it('returns null for an unknown tier, unknown period, or unset code', () => {
    expect(planCodeFor('Enterprise', 'monthly', FULL_ENV)).toBeNull();
    expect(planCodeFor('Pro', 'weekly', FULL_ENV)).toBeNull();
    expect(planCodeFor('Pro', 'monthly', {})).toBeNull();
  });
});

describe('tierForPlanCode', () => {
  it('reverses a plan code back to its tier + period', () => {
    expect(tierForPlanCode('PLN_ultra_m', FULL_ENV)).toEqual({ tier: 'Ultra', period: 'monthly' });
    expect(tierForPlanCode('PLN_pro_a', FULL_ENV)).toEqual({ tier: 'Pro', period: 'annual' });
  });
  it('returns null for an unrecognised code', () => {
    expect(tierForPlanCode('PLN_nope', FULL_ENV)).toBeNull();
    expect(tierForPlanCode(null, FULL_ENV)).toBeNull();
  });
});

describe('isCheckoutConfigured', () => {
  it('is true only with secrets AND at least one plan code', () => {
    expect(isCheckoutConfigured(FULL_ENV)).toBe(true);
  });
  it('is false without the secrets', () => {
    const { PAYSTACK_SECRET_KEY, ...noSecret } = FULL_ENV;
    expect(isCheckoutConfigured(noSecret)).toBe(false);
  });
  it('is false with secrets but no plan codes', () => {
    expect(isCheckoutConfigured({ PAYSTACK_SECRET_KEY: 'x', ENTITLEMENT_SECRET: 'y' })).toBe(false);
  });
});
