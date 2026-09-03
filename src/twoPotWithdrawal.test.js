// src/twoPotWithdrawal.test.js
import { describe, it, expect } from 'vitest';
import { analyseTwoPotWithdrawal } from './twoPotWithdrawal.js';

const BRACKETS = [
  { upTo: 240000, rate: 18 },
  { upTo: 370000, rate: 26 },
  { upTo: 510000, rate: 31 },
  { upTo: 740000, rate: 36 },
  { upTo: null, rate: 39 }
];

describe('analyseTwoPotWithdrawal', () => {
  it('flat rate: taxes the withdrawal at the marginal rate and nets the rest', () => {
    const r = analyseTwoPotWithdrawal({ withdrawalAmount: 30000, annualIncome: 400000, taxRate: 31, yearsToRetirement: 0 });
    expect(r.taxOnWithdrawal).toBeCloseTo(9300, 6);
    expect(r.netCashNow).toBeCloseTo(20700, 6);
    expect(r.marginalRatePct).toBeCloseTo(31, 6);
  });

  it('progressive: a withdrawal stacks on top of income at the marginal band(s)', () => {
    const r = analyseTwoPotWithdrawal({ withdrawalAmount: 40000, annualIncome: 350000, taxBrackets: BRACKETS });
    const expected = (20000 * 0.26) + (20000 * 0.31); // 350k->370k then 370k->390k
    expect(r.taxOnWithdrawal).toBeCloseTo(expected, 6);
  });

  it('quantifies the retirement growth given up', () => {
    const r = analyseTwoPotWithdrawal({ withdrawalAmount: 50000, annualIncome: 300000, taxRate: 26, yearsToRetirement: 20, growthRate: 9 });
    // ~50k compounding at 9% for 20y is well over 250k
    expect(r.futureValueForgone).toBeGreaterThan(250000);
    expect(r.costPerRandTaken).toBeGreaterThan(5); // every net rand costs >R5 of retirement money
  });

  it('with no time to retirement, nothing compounds -- forgone value is just the gross', () => {
    const r = analyseTwoPotWithdrawal({ withdrawalAmount: 10000, annualIncome: 200000, taxRate: 18, yearsToRetirement: 0 });
    expect(r.futureValueForgone).toBe(10000);
  });

  it('a zero withdrawal is a clean zero', () => {
    const r = analyseTwoPotWithdrawal({ withdrawalAmount: 0, annualIncome: 400000, taxRate: 31 });
    expect(r.netCashNow).toBe(0);
    expect(r.costPerRandTaken).toBe(0);
  });
});
