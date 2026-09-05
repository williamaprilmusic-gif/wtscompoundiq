// src/withdrawalIncomeEstimate.test.js
import { describe, it, expect } from 'vitest';
import { withdrawalIncomeEstimate } from './withdrawalIncomeEstimate.js';

describe('withdrawalIncomeEstimate', () => {
  it('applies the withdrawal rate to the final balance', () => {
    const r = withdrawalIncomeEstimate({ finalBalance: 2000000, withdrawalRate: 4 });
    expect(r.annualIncome).toBeCloseTo(80000, 6);
    expect(r.monthlyIncome).toBeCloseTo(80000 / 12, 6);
  });

  it('defaults to a 4% rate when none is given', () => {
    const r = withdrawalIncomeEstimate({ finalBalance: 1000000 });
    expect(r.annualIncome).toBeCloseTo(40000, 6);
  });

  it('a 0 withdrawal rate falls back to the 4% default (0 is falsy, same as retirementGap.js)', () => {
    const r = withdrawalIncomeEstimate({ finalBalance: 1000000, withdrawalRate: 0 });
    expect(r.annualIncome).toBeCloseTo(40000, 6);
  });

  it('floors a negative rate at 0.01% rather than dividing by ~0', () => {
    const r = withdrawalIncomeEstimate({ finalBalance: 1000000, withdrawalRate: -5 });
    expect(Number.isFinite(r.annualIncome)).toBe(true);
    expect(r.annualIncome).toBeCloseTo(1000000 * 0.0001, 6);
  });

  it('treats a missing/negative balance as zero rather than throwing', () => {
    const r = withdrawalIncomeEstimate({ finalBalance: -500, withdrawalRate: 4 });
    expect(r.annualIncome).toBe(0);
    expect(r.monthlyIncome).toBe(0);
  });

  it('a higher withdrawal rate gives more income from the same pot', () => {
    const low = withdrawalIncomeEstimate({ finalBalance: 1000000, withdrawalRate: 3 });
    const high = withdrawalIncomeEstimate({ finalBalance: 1000000, withdrawalRate: 5 });
    expect(high.annualIncome).toBeGreaterThan(low.annualIncome);
  });
});
