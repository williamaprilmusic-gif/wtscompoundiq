// src/retirementGap.test.js
import { describe, it, expect } from 'vitest';
import { retirementIncomeGap, monthsToCloseGap } from './retirementGap.js';

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

  it('guards a 0 withdrawal rate (falls back to the 4% default)', () => {
    const result = retirementIncomeGap({ projectedPot: 1000000, targetAnnualIncome: 300000, withdrawalRate: 0 });
    expect(result.incomeFromPot).toBeCloseTo(40000, 5); // 1,000,000 * 4%
  });

  it('floors a negative or tiny withdrawal rate at 0.01% rather than dividing by ~0', () => {
    const result = retirementIncomeGap({ projectedPot: 1000000, targetAnnualIncome: 300000, withdrawalRate: -5 });
    expect(Number.isFinite(result.capitalGap)).toBe(true);
    expect(result.incomeFromPot).toBeCloseTo(1000000 * 0.0001, 5);
  });
});

describe('monthsToCloseGap', () => {
  it('needs 0 months when there is no gap to close', () => {
    expect(monthsToCloseGap({ capitalGap: 0, extraMonthly: 1000, rate: 8 })).toEqual({ months: 0, reachable: true });
    expect(monthsToCloseGap({ capitalGap: -50000, extraMonthly: 1000, rate: 8 })).toEqual({ months: 0, reachable: true });
  });

  it('is unreachable with no extra monthly saving', () => {
    const r = monthsToCloseGap({ capitalGap: 500000, extraMonthly: 0, rate: 8 });
    expect(r.reachable).toBe(false);
    expect(r.months).toBeNull();
  });

  it('finds a plausible number of months with a real contribution and rate', () => {
    // R6,000/month at 8%/yr should close a R1,000,000 gap in well under 12 years,
    // comfortably faster than the R0%-growth equivalent (1,000,000 / 6,000 ≈ 167 months).
    const r = monthsToCloseGap({ capitalGap: 1000000, extraMonthly: 6000, rate: 8 });
    expect(r.reachable).toBe(true);
    expect(r.months).toBeGreaterThan(0);
    expect(r.months).toBeLessThan(167);
  });

  it('a higher rate closes the same gap in fewer (or equal) months', () => {
    const slow = monthsToCloseGap({ capitalGap: 1000000, extraMonthly: 6000, rate: 2 });
    const fast = monthsToCloseGap({ capitalGap: 1000000, extraMonthly: 6000, rate: 12 });
    expect(fast.months).toBeLessThanOrEqual(slow.months);
  });

  it('matches simple no-growth division when rate is 0', () => {
    const r = monthsToCloseGap({ capitalGap: 120000, extraMonthly: 10000, rate: 0 });
    expect(r.months).toBe(12);
  });

  it('reports unreachable rather than looping forever when the gap is absurdly large', () => {
    const r = monthsToCloseGap({ capitalGap: 1e15, extraMonthly: 100, rate: 1 });
    expect(r.reachable).toBe(false);
    expect(r.months).toBeNull();
  });
});
