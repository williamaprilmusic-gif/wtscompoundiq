// src/subscriptionCost.test.js
import { describe, it, expect } from 'vitest';
import { subscriptionCost } from './subscriptionCost.js';

describe('subscriptionCost', () => {
  it('with no price increases, total paid is monthly x 12 x years', () => {
    const r = subscriptionCost({ monthlyAmount: 200, years: 10, investReturn: 0, annualPriceIncrease: 0 });
    expect(r.annualCostNow).toBe(2400);
    expect(r.totalPaid).toBeCloseTo(200 * 12 * 10, 6);
    expect(r.investedInsteadValue).toBeCloseTo(r.totalPaid, 6); // 0% return
    expect(r.opportunityCost).toBeCloseTo(0, 6);
  });

  it('price increases push total paid above the flat figure', () => {
    const flat = subscriptionCost({ monthlyAmount: 200, years: 10, annualPriceIncrease: 0 });
    const rising = subscriptionCost({ monthlyAmount: 200, years: 10, annualPriceIncrease: 8 });
    expect(rising.totalPaid).toBeGreaterThan(flat.totalPaid);
  });

  it('a positive return makes the invested-instead pot exceed what was paid', () => {
    const r = subscriptionCost({ monthlyAmount: 500, years: 20, investReturn: 9, annualPriceIncrease: 0 });
    expect(r.investedInsteadValue).toBeGreaterThan(r.totalPaid);
    expect(r.opportunityCost).toBeGreaterThan(0);
  });

  it('rounds a fractional horizon and clamps a silly return without throwing', () => {
    const r = subscriptionCost({ monthlyAmount: 100, years: 5.6, investReturn: -250 });
    expect(r.horizonYears).toBe(6);
    expect(Number.isFinite(r.totalPaid)).toBe(true);
    expect(Number.isFinite(r.investedInsteadValue)).toBe(true);
  });
});
