// src/creditCardTrap.test.js
import { describe, it, expect } from 'vitest';
import { analyzeCreditCard } from './creditCardTrap.js';

describe('analyzeCreditCard', () => {
  it('minimum-only payoff drags on for years and costs heavy interest', () => {
    const { minimumOnly } = analyzeCreditCard({ balance: 30000, apr: 22, minPercent: 2.5, minFloor: 200 });
    expect(minimumOnly.months).toBeGreaterThan(120); // 10+ years on a mid-size balance
    expect(minimumOnly.totalInterest).toBeGreaterThan(15000);
    expect(minimumOnly.neverPaysOff).toBe(false);
  });

  it('a fixed payment clears the card far faster and cheaper than the minimum', () => {
    const { minimumOnly, fixed } = analyzeCreditCard({ balance: 30000, apr: 22, minPercent: 2.5, minFloor: 200, fixedPayment: 1500 });
    expect(fixed.months).toBeLessThan(minimumOnly.months);
    expect(fixed.totalInterest).toBeLessThan(minimumOnly.totalInterest);
  });

  it('flags a payment that never even covers the interest', () => {
    // 50000 at 24% -> ~1000/mo interest; a fixed 500 payment never dents it.
    const { fixed } = analyzeCreditCard({ balance: 50000, apr: 24, fixedPayment: 500 });
    expect(fixed.neverPaysOff).toBe(true);
    expect(fixed.months).toBeNull();
    expect(fixed.totalInterest).toBe(Infinity);
  });

  it('returns null branches for a zero balance', () => {
    const result = analyzeCreditCard({ balance: 0, apr: 20 });
    expect(result.minimumOnly).toBeNull();
    expect(result.fixed).toBeNull();
  });

  it('does not compute a fixed scenario when no fixed payment is given', () => {
    const { fixed } = analyzeCreditCard({ balance: 10000, apr: 18 });
    expect(fixed).toBeNull();
  });

  it('a 0% APR card just divides the balance by the payment', () => {
    const { fixed } = analyzeCreditCard({ balance: 12000, apr: 0, fixedPayment: 1000 });
    expect(fixed.months).toBe(12);
    expect(fixed.totalInterest).toBeCloseTo(0, 5);
  });
});
