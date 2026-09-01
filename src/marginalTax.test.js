// src/marginalTax.test.js
import { describe, it, expect } from 'vitest';
import { marginalTaxAnalysis } from './marginalTax.js';

const BRACKETS = [
  { upTo: 250000, rate: 18 },
  { upTo: 500000, rate: 26 },
  { upTo: 750000, rate: 31 },
  { upTo: null, rate: 36 }
];

describe('marginalTaxAnalysis', () => {
  it('with a flat rate, the marginal rate is that rate', () => {
    const result = marginalTaxAnalysis({ income: 400000, taxRate: 30, taxBrackets: null, deltaEarned: 1000 });
    expect(result.marginalRate).toBeCloseTo(30, 5);
    expect(result.keepsFromNext).toBeCloseTo(700, 5);
    expect(result.totalTax).toBeCloseTo(120000, 5);
  });

  it('with brackets, the marginal rate is the top bracket the income reaches', () => {
    const result = marginalTaxAnalysis({ income: 600000, taxBrackets: BRACKETS, deltaEarned: 1000 });
    expect(result.marginalRate).toBeCloseTo(31, 5); // 600k sits in the 31% band
    expect(result.keepRate).toBeCloseTo(69, 5);
  });

  it('a deductible contribution saves tax at the marginal rate near the top of income', () => {
    const result = marginalTaxAnalysis({ income: 600000, taxBrackets: BRACKETS, deductionAmount: 50000 });
    // The 50k comes off the top, all within the 31% band.
    expect(result.deductionTaxSaved).toBeCloseTo(50000 * 0.31, 2);
    expect(result.deductionNetCost).toBeCloseTo(50000 * 0.69, 2);
  });

  it('a deduction that straddles a bracket boundary saves a blended amount', () => {
    // Income 520k, deduct 40k -> 20k saved at 31% (520->500) + 20k at 26% (500->480).
    const result = marginalTaxAnalysis({ income: 520000, taxBrackets: BRACKETS, deductionAmount: 40000 });
    expect(result.deductionTaxSaved).toBeCloseTo(20000 * 0.31 + 20000 * 0.26, 2);
  });

  it('no NaN at zero income', () => {
    const result = marginalTaxAnalysis({ income: 0, taxBrackets: BRACKETS, deltaEarned: 1000, deductionAmount: 1000 });
    expect(result.totalTax).toBe(0);
    expect(Number.isFinite(result.marginalRate)).toBe(true);
  });
});
