// src/retirementGap.test.js
import { describe, it, expect } from 'vitest';
import { retirementIncomeGap } from './retirementGap.js';

describe('retirementIncomeGap', () => {
  it('income from the pot is pot * withdrawal rate', () => {
    const result = retirementIncomeGap({ projectedPot: 5000000, targetAnnualIncome: 300000, withdrawalRate: 4 });
    expect(result.incomeFromPot).toBeCloseTo(200000, 5);
    expect(result.annualGap).toBeCloseTo(100000, 5);
    expect(result.onTrack).toBe(false);
  });

  it('the capital gap is the annual gap grossed back up by the withdrawal rate', () => {
    const result = retirementIncomeGap({ projectedPot: 5000000, targetAnnualIncome: 300000, withdrawalRate: 4 });
    expect(result.capitalGap).toBeCloseTo(100000 / 0.04, 2); // 2,500,000 more pot needed
  });

  it('flags on track (and a negative gap) when the pot over-delivers', () => {
    const result = retirementIncomeGap({ projectedPot: 10000000, targetAnnualIncome: 300000, withdrawalRate: 4 });
    expect(result.onTrack).toBe(true);
    expect(result.annualGap).toBeLessThan(0);
    expect(result.coverageRatio).toBeGreaterThan(100);
  });

  it('coverageRatio is 100 (not NaN) when there is no target', () => {
    expect(retirementIncomeGap({ projectedPot: 1000000, targetAnnualIncome: 0, withdrawalRate: 4 }).coverageRatio).toBe(100);
  });

  it('guards a 0 withdrawal rate', () => {
    const result = retirementIncomeGap({ projectedPot: 1000000, targetAnnualIncome: 300000, withdrawalRate: 0 });
    expect(Number.isFinite(result.incomeFromPot)).toBe(true);
    expect(Number.isFinite(result.capitalGap)).toBe(true);
  });
});
