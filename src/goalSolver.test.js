// src/goalSolver.test.js
import { describe, it, expect } from 'vitest';
import { solveMonthlyForGoal } from './goalSolver.js';
import { calculateCompoundInterest } from './engine.js';

describe('solveMonthlyForGoal', () => {
  it('finds a monthly contribution that actually reaches (or slightly exceeds) the goal', () => {
    const monthly = solveMonthlyForGoal({ startingAmount: 0, rate: 8, years: 10, inflation: 0, taxRate: 0, wrapper: false, goalAmount: 200000, compoundFrequency: 12 });
    const result = calculateCompoundInterest({ initial: 0, monthly, rate: 8, years: 10, inflation: 0, taxRate: 0, wrapper: false, compoundFrequency: 12 });
    expect(result.finalBalance).toBeGreaterThanOrEqual(200000 * 0.999); // binary search converges from above
    expect(result.finalBalance).toBeLessThan(200000 * 1.01); // and doesn't wildly overshoot
  });

  it('converges to ~0/month when the starting amount already meets the goal', () => {
    // Binary search over 60 iterations converges toward, but not exactly to, 0 --
    // vanishingly small (starting range / 2^60), not a literal zero.
    const monthly = solveMonthlyForGoal({ startingAmount: 500000, rate: 8, years: 10, inflation: 0, taxRate: 0, wrapper: false, goalAmount: 200000, compoundFrequency: 12 });
    expect(monthly).toBeLessThan(0.01);
  });

  it('respects a wrapper\'s annual contribution cap when the goal is reachable within it', () => {
    const monthly = solveMonthlyForGoal({
      startingAmount: 0, rate: 8, years: 20, inflation: 0, taxRate: 30, wrapper: true, goalAmount: 300000,
      compoundFrequency: 12, annualWrapperLimit: 46000
    });
    expect(monthly).toBeLessThanOrEqual(46000 / 12 + 1);
  });

  it('a shorter timeframe requires a higher monthly contribution for the same goal', () => {
    const short = solveMonthlyForGoal({ startingAmount: 0, rate: 8, years: 3, inflation: 0, taxRate: 0, wrapper: false, goalAmount: 100000, compoundFrequency: 12 });
    const long = solveMonthlyForGoal({ startingAmount: 0, rate: 8, years: 15, inflation: 0, taxRate: 0, wrapper: false, goalAmount: 100000, compoundFrequency: 12 });
    expect(short).toBeGreaterThan(long);
  });
});
