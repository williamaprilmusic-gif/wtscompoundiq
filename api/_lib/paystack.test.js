// api/_lib/paystack.test.js
import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyWebhookSignature, subscriptionIsActive, pickBestSubscriptionTier } from './paystack.js';

const KEY = 'sk_test_webhook_key';

describe('verifyWebhookSignature', () => {
  const body = JSON.stringify({ event: 'charge.success', data: { id: 1 } });
  const good = createHmac('sha512', KEY).update(body).digest('hex');

  it('accepts a correct HMAC-SHA512 of the raw body', () => {
    expect(verifyWebhookSignature(body, good, KEY)).toBe(true);
  });
  it('rejects a wrong signature, wrong key, or altered body', () => {
    expect(verifyWebhookSignature(body, good.replace(/.$/, '0'), KEY)).toBe(false);
    expect(verifyWebhookSignature(body, good, 'other_key')).toBe(false);
    expect(verifyWebhookSignature(body + ' ', good, KEY)).toBe(false);
  });
  it('rejects missing inputs without throwing', () => {
    expect(verifyWebhookSignature('', '', '')).toBe(false);
    expect(verifyWebhookSignature(body, undefined, KEY)).toBe(false);
  });
});

describe('subscriptionIsActive', () => {
  const now = Date.parse('2026-06-01T00:00:00Z');
  it('treats active / non-renewing as entitling', () => {
    expect(subscriptionIsActive({ status: 'active' }, now)).toBe(true);
    expect(subscriptionIsActive({ status: 'non-renewing' }, now)).toBe(true);
  });
  it('treats completed / cancelled as not entitling', () => {
    expect(subscriptionIsActive({ status: 'complete' }, now)).toBe(false);
    expect(subscriptionIsActive({ status: 'cancelled' }, now)).toBe(false);
  });
  it('gives an "attention" sub a short grace past next_payment_date', () => {
    expect(subscriptionIsActive({ status: 'attention', next_payment_date: '2026-05-30T00:00:00Z' }, now)).toBe(true);
    expect(subscriptionIsActive({ status: 'attention', next_payment_date: '2026-05-01T00:00:00Z' }, now)).toBe(false);
  });
  it('is false for junk input', () => {
    expect(subscriptionIsActive(null, now)).toBe(false);
    expect(subscriptionIsActive('nope', now)).toBe(false);
  });
});

describe('pickBestSubscriptionTier', () => {
  const now = Date.parse('2026-06-01T00:00:00Z');
  // A tiny stand-in for tierForPlanCode(code, env).
  const resolve = (code) => ({
    PLN_pro_m: { tier: 'Pro', period: 'monthly' },
    PLN_pro_a: { tier: 'Pro', period: 'annual' },
    PLN_ultra_m: { tier: 'Ultra', period: 'monthly' }
  }[code] || null);

  const sub = (email, plan_code, status = 'active') => ({ customer: { email }, plan: { plan_code }, status });

  it('returns the active subscription tier for a matching email', () => {
    expect(pickBestSubscriptionTier([sub('a@b.com', 'PLN_pro_m')], 'a@b.com', resolve, now))
      .toEqual({ tier: 'Pro', period: 'monthly' });
  });
  it('matches email case-insensitively', () => {
    expect(pickBestSubscriptionTier([sub('A@B.com', 'PLN_pro_a')], 'a@b.com', resolve, now))
      .toEqual({ tier: 'Pro', period: 'annual' });
  });
  it('picks the highest-ranked tier when two subs overlap (upgrade mid-cycle)', () => {
    const list = [sub('a@b.com', 'PLN_pro_m'), sub('a@b.com', 'PLN_ultra_m')];
    expect(pickBestSubscriptionTier(list, 'a@b.com', resolve, now)).toEqual({ tier: 'Ultra', period: 'monthly' });
  });
  it('ignores inactive subs, other emails, and unknown plan codes', () => {
    expect(pickBestSubscriptionTier([sub('a@b.com', 'PLN_pro_m', 'cancelled')], 'a@b.com', resolve, now)).toBeNull();
    expect(pickBestSubscriptionTier([sub('other@b.com', 'PLN_ultra_m')], 'a@b.com', resolve, now)).toBeNull();
    expect(pickBestSubscriptionTier([sub('a@b.com', 'PLN_unknown')], 'a@b.com', resolve, now)).toBeNull();
  });
  it('returns null for an empty or missing list', () => {
    expect(pickBestSubscriptionTier([], 'a@b.com', resolve, now)).toBeNull();
    expect(pickBestSubscriptionTier(undefined, 'a@b.com', resolve, now)).toBeNull();
  });
});
