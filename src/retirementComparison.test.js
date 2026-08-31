// src/retirementComparison.test.js
import { describe, it, expect } from 'vitest';
import { compareRetirementVehicle } from './retirementComparison.js';
import { calculateCompoundInterest } from './engine.js';

describe('compareRetirementVehicle', () => {
  it('grows the balance tax-free during accumulation, same as a wrapper', () => {
    const result = compareRetirementVehicle({ initial: 0, monthly: 1000, rate: 8, years: 10, inflation: 0, compoundFrequency: 12, contributionTaxRate: 0, withdrawalTaxRate: 0 });
    const wrapperEquivalent = calculateCompoundInterest({ initial: 0, monthly: 1000, rate: 8, years: 10, inflation: 0, taxRate: 0, wrapper: true, compoundFrequency: 12 });
    expect(result.finalBalance).toBe(wrapperEquivalent.finalBalance);
  });

  it('computes the contribution tax refund at the given rate', () => {
    const result = compareRetirementVehicle({ initial: 0, monthly: 1000, rate: 0, years: 5, inflation: 0, compoundFrequency: 12, contributionTaxRate: 30, withdrawalTaxRate: 0 });
    expect(result.contributionTaxRefund).toBeCloseTo(result.totalDeposited * 0.3, 2);
    expect(result.netContributionCost).toBeCloseTo(result.totalDeposited * 0.7, 2);
  });

  it('taxes the withdrawal once, on the full final balance', () => {
    const result = compareRetirementVehicle({ initial: 100000, monthly: 0, rate: 0, years: 1, inflation: 0, compoundFrequency: 12, contributionTaxRate: 0, withdrawalTaxRate: 20 });
    expect(result.withdrawalTax).toBeCloseTo(result.finalBalance * 0.2, 2);
    expect(result.netAfterWithdrawalTax).toBeCloseTo(result.finalBalance * 0.8, 2);
  });

  it('with both rates at 0, behaves exactly like a plain tax-free wrapper', () => {
    const result = compareRetirementVehicle({ initial: 50000, monthly: 500, rate: 6, years: 15, inflation: 2, compoundFrequency: 12, contributionTaxRate: 0, withdrawalTaxRate: 0 });
    expect(result.contributionTaxRefund).toBe(0);
    expect(result.netAfterWithdrawalTax).toBe(result.finalBalance);
  });
});
