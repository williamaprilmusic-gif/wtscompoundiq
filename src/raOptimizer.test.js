// src/raOptimizer.test.js
import { describe, it, expect } from 'vitest';
import { optimiseRaContribution } from './raOptimizer.js';

const BRACKETS = [
  { upTo: 240000, rate: 18 },
  { upTo: 370000, rate: 26 },
  { upTo: 510000, rate: 31 },
  { upTo: 740000, rate: 36 },
  { upTo: null, rate: 39 }
];

describe('optimiseRaContribution', () => {
  it('caps the deduction at 27.5% of income below the rand cap', () => {
    const r = optimiseRaContribution({ taxableIncome: 600000, currentAnnualContribution: 0, taxRate: 31 });
    expect(r.maxDeductible).toBeCloseTo(165000, 6); // 27.5% of 600k
    expect(r.roomRemaining).toBeCloseTo(165000, 6);
    expect(r.limitedBy).toBe('percent');
  });

  it('caps the deduction at R350,000 for very high earners', () => {
    const r = optimiseRaContribution({ taxableIncome: 2000000, taxRate: 39 });
    expect(r.maxDeductible).toBe(350000); // 27.5% of 2m = 550k, capped
    expect(r.limitedBy).toBe('cap');
  });

  it('flat rate: tax saved is the room times the rate', () => {
    const r = optimiseRaContribution({ taxableIncome: 400000, currentAnnualContribution: 10000, taxRate: 31 });
    expect(r.roomRemaining).toBeCloseTo(400000 * 0.275 - 10000, 6);
    expect(r.taxSavingIfMaxed).toBeCloseTo(r.roomRemaining * 0.31, 6);
    expect(r.effectiveReliefPct).toBeCloseTo(31, 6);
    expect(r.netCostIfMaxed).toBeCloseTo(r.roomRemaining * 0.69, 4);
  });

  it('progressive: relief follows the marginal band(s) the contribution unwinds', () => {
    const r = optimiseRaContribution({ taxableIncome: 500000, currentAnnualContribution: 0, taxBrackets: BRACKETS });
    // room = 137,500; comes off income between 362,500 and 500,000 -> mostly 31%, a sliver 26%
    expect(r.roomRemaining).toBeCloseTo(137500, 6);
    expect(r.effectiveReliefPct).toBeGreaterThan(26);
    expect(r.effectiveReliefPct).toBeLessThan(31);
  });

  it('reports no room when already contributing above the limit', () => {
    const r = optimiseRaContribution({ taxableIncome: 400000, currentAnnualContribution: 200000, taxRate: 31 });
    expect(r.alreadyOverLimit).toBe(true);
    expect(r.roomRemaining).toBe(0);
    expect(r.taxSavingIfMaxed).toBe(0);
  });
});
