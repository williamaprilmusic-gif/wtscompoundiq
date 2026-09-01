// src/feeDrag.test.js
import { describe, it, expect } from 'vitest';
import { feeDragAnalysis } from './feeDrag.js';
import { calculateCompoundInterest } from './engine.js';

describe('feeDragAnalysis', () => {
  it('a 0% fee costs nothing', () => {
    const result = feeDragAnalysis({ initial: 100000, monthly: 5000, grossReturn: 9, feePercent: 0, years: 30 });
    expect(result.lifetimeFeeCost).toBeCloseTo(0, 5);
    expect(result.finalNoFee).toBeCloseTo(result.finalWithFee, 5);
  });

  it('the fee-free pot matches the engine at the gross rate', () => {
    const result = feeDragAnalysis({ initial: 0, monthly: 4000, grossReturn: 8, feePercent: 1, years: 25 });
    const expected = calculateCompoundInterest({ initial: 0, monthly: 4000, rate: 8, years: 25, inflation: 0, taxRate: 0, wrapper: true, compoundFrequency: 12 }).finalBalance;
    expect(result.finalNoFee).toBeCloseTo(expected, 5);
  });

  it('a 1% fee over 30 years costs a large, positive share of the pot', () => {
    const result = feeDragAnalysis({ initial: 100000, monthly: 5000, grossReturn: 9, feePercent: 1, years: 30 });
    expect(result.lifetimeFeeCost).toBeGreaterThan(0);
    expect(result.finalWithFee).toBeLessThan(result.finalNoFee);
    // A 1% fee over decades typically eats well over 10% of the ending balance.
    expect(result.costAsPercentOfPot).toBeGreaterThan(10);
  });

  it('a bigger fee costs more, all else equal', () => {
    const small = feeDragAnalysis({ initial: 50000, monthly: 3000, grossReturn: 8, feePercent: 0.5, years: 20 });
    const big = feeDragAnalysis({ initial: 50000, monthly: 3000, grossReturn: 8, feePercent: 2, years: 20 });
    expect(big.lifetimeFeeCost).toBeGreaterThan(small.lifetimeFeeCost);
  });

  it('no NaN when the pot is empty', () => {
    const result = feeDragAnalysis({ initial: 0, monthly: 0, grossReturn: 8, feePercent: 1, years: 10 });
    expect(result.costAsPercentOfPot).toBe(0);
  });
});
