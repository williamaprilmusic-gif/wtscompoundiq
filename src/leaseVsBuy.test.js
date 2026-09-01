// src/leaseVsBuy.test.js
import { describe, it, expect } from 'vitest';
import { leaseVsBuy } from './leaseVsBuy.js';

describe('leaseVsBuy', () => {
  it('buy net cost is value lost to depreciation plus finance interest', () => {
    const result = leaseVsBuy({
      carPrice: 400000, buyDeposit: 400000, annualDepreciationRate: 15, comparePeriodYears: 3,
      leaseUpfront: 0, leaseMonthly: 6000
    });
    const residual = 400000 * Math.pow(0.85, 3);
    expect(result.financeInterest).toBe(0); // cash purchase
    expect(result.buyNetCost).toBeCloseTo(400000 - residual, 2);
  });

  it('lease cost is upfront plus monthly over the period', () => {
    const result = leaseVsBuy({
      carPrice: 400000, buyDeposit: 400000, comparePeriodYears: 3,
      leaseUpfront: 20000, leaseMonthly: 6000
    });
    expect(result.leaseCost).toBeCloseTo(20000 + 6000 * 36, 5);
  });

  it('a cheap lease beats buying a fast-depreciating car', () => {
    const result = leaseVsBuy({
      carPrice: 800000, buyDeposit: 0, financeRate: 12, financeTermYears: 6,
      annualDepreciationRate: 20, comparePeriodYears: 3, leaseUpfront: 10000, leaseMonthly: 7000
    });
    expect(result.buyIsCheaper).toBe(false);
  });

  it('buying and keeping it long beats repeated leasing', () => {
    const result = leaseVsBuy({
      carPrice: 300000, buyDeposit: 300000, annualDepreciationRate: 10,
      comparePeriodYears: 8, leaseUpfront: 15000, leaseMonthly: 5000
    });
    expect(result.buyIsCheaper).toBe(true);
    expect(result.difference).toBeGreaterThan(0);
  });

  it('financing adds interest to the buy side', () => {
    const cash = leaseVsBuy({ carPrice: 400000, buyDeposit: 400000, annualDepreciationRate: 15, comparePeriodYears: 4, leaseMonthly: 5000 });
    const financed = leaseVsBuy({ carPrice: 400000, buyDeposit: 0, financeRate: 11, financeTermYears: 6, annualDepreciationRate: 15, comparePeriodYears: 4, leaseMonthly: 5000 });
    expect(financed.financeInterest).toBeGreaterThan(0);
    expect(financed.buyNetCost).toBeGreaterThan(cash.buyNetCost);
  });
});
