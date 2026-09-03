// src/loanComparison.test.js
import { describe, it, expect } from 'vitest';
import { compareLoanOffers } from './loanComparison.js';

describe('compareLoanOffers', () => {
  it('a lower rate at the same term and no fees is cheaper', () => {
    const r = compareLoanOffers({
      amount: 300000,
      offerA: { rate: 12, termYears: 5 },
      offerB: { rate: 15, termYears: 5 }
    });
    expect(r.cheaper).toBe('A');
    expect(r.a.totalInterest).toBeLessThan(r.b.totalInterest);
    expect(r.totalCostSaving).toBeGreaterThan(0);
  });

  it('a big initiation fee can sink an otherwise-lower rate', () => {
    const r = compareLoanOffers({
      amount: 100000,
      offerA: { rate: 11, termYears: 3, upfrontFee: 12000 },
      offerB: { rate: 13, termYears: 3, upfrontFee: 0 }
    });
    expect(r.cheaper).toBe('B');
  });

  it('a longer term lowers the monthly but raises the total cost', () => {
    const r = compareLoanOffers({
      amount: 250000,
      offerA: { rate: 12, termYears: 3 },
      offerB: { rate: 12, termYears: 6 }
    });
    expect(r.b.monthlyPayment).toBeLessThan(r.a.monthlyPayment);
    expect(r.b.totalCost).toBeGreaterThan(r.a.totalCost);
    expect(r.cheaper).toBe('A');
  });

  it('monthly service fees are added to the payment and the total', () => {
    const noFee = compareLoanOffers({ amount: 200000, offerA: { rate: 12, termYears: 4 }, offerB: { rate: 12, termYears: 4 } });
    const withFee = compareLoanOffers({ amount: 200000, offerA: { rate: 12, termYears: 4, monthlyFee: 69 }, offerB: { rate: 12, termYears: 4 } });
    expect(withFee.a.monthlyPayment).toBeCloseTo(noFee.a.monthlyPayment + 69, 4);
    expect(withFee.a.totalCost).toBeGreaterThan(noFee.a.totalCost);
  });

  it('returns nulls for a zero amount', () => {
    const r = compareLoanOffers({ amount: 0, offerA: { rate: 12, termYears: 5 }, offerB: { rate: 10, termYears: 5 } });
    expect(r.a).toBeNull();
    expect(r.cheaper).toBeNull();
  });
});
