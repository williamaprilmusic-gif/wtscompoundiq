// src/savingsRate.test.js
import { describe, it, expect } from 'vitest';
import { yearsToFinancialIndependence, FI_MULTIPLE } from './savingsRate.js';

describe('yearsToFinancialIndependence', () => {
  it('computes the savings rate from income and spending', () => {
    const result = yearsToFinancialIndependence({ takeHomeIncome: 100000, annualSpending: 60000, realReturn: 5 });
    expect(result.savingsRate).toBeCloseTo(40, 5);
    expect(result.annualSaving).toBe(40000);
    expect(result.fiNumber).toBe(60000 * FI_MULTIPLE);
  });

  it('a higher savings rate reaches FI sooner, all else equal', () => {
    const lean = yearsToFinancialIndependence({ takeHomeIncome: 100000, annualSpending: 40000, realReturn: 5 });
    const loose = yearsToFinancialIndependence({ takeHomeIncome: 100000, annualSpending: 75000, realReturn: 5 });
    expect(lean.years).toBeLessThan(loose.years);
  });

  it('roughly matches the well-known ~17 years at a 50% savings rate and 5% real return', () => {
    const result = yearsToFinancialIndependence({ takeHomeIncome: 100000, annualSpending: 50000, realReturn: 5 });
    expect(result.years).toBeGreaterThanOrEqual(16);
    expect(result.years).toBeLessThanOrEqual(18);
  });

  it('returns years: null when nothing is saved', () => {
    const result = yearsToFinancialIndependence({ takeHomeIncome: 50000, annualSpending: 50000, realReturn: 5 });
    expect(result.years).toBeNull();
    expect(result.savingsRate).toBeCloseTo(0, 5);
  });

  it('handles a 0% real return by pure accumulation', () => {
    // Save 20k/yr toward a 25 * 30k = 750k target at 0% growth -> ~38 years.
    const result = yearsToFinancialIndependence({ takeHomeIncome: 50000, annualSpending: 30000, realReturn: 0 });
    expect(result.years).toBe(Math.ceil(750000 / 20000));
  });

  it('clamps negatives and avoids NaN on 0 income', () => {
    const result = yearsToFinancialIndependence({ takeHomeIncome: 0, annualSpending: 0, realReturn: 5 });
    expect(result.savingsRate).toBe(0);
    expect(result.years).toBeNull();
  });
});
