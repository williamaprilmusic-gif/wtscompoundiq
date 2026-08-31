// src/insuranceNeeds.test.js
import { describe, it, expect } from 'vitest';
import { computeCoverGap } from './insuranceNeeds.js';

describe('computeCoverGap', () => {
  it('sums debts, income replacement, and final expenses into the total need', () => {
    const result = computeCoverGap({ outstandingDebts: 500000, annualIncomeToReplace: 200000, yearsOfReplacement: 5, finalExpenses: 50000 });
    expect(result.incomeReplacementNeed).toBe(1000000);
    expect(result.totalNeed).toBe(500000 + 1000000 + 50000);
  });

  it('subtracts existing cover and savings from the gap, floored at 0', () => {
    const result = computeCoverGap({ outstandingDebts: 100000, annualIncomeToReplace: 0, yearsOfReplacement: 0, existingCover: 500000 });
    expect(result.offsets).toBe(500000);
    expect(result.coverGap).toBe(0); // already more than covered, never negative
  });

  it('a real, positive gap when offsets fall short of the need', () => {
    const result = computeCoverGap({ outstandingDebts: 800000, annualIncomeToReplace: 300000, yearsOfReplacement: 10, existingCover: 1000000, existingSavings: 200000 });
    expect(result.totalNeed).toBe(800000 + 3000000);
    expect(result.offsets).toBe(1200000);
    expect(result.coverGap).toBe(800000 + 3000000 - 1200000);
  });

  it('treats every field as optional, defaulting to a zero gap', () => {
    expect(computeCoverGap({})).toEqual({ incomeReplacementNeed: 0, totalNeed: 0, offsets: 0, coverGap: 0 });
  });

  it('ignores negative inputs rather than letting them offset other fields', () => {
    const result = computeCoverGap({ outstandingDebts: -50000, annualIncomeToReplace: 100000, yearsOfReplacement: 1 });
    expect(result.totalNeed).toBe(100000); // the negative debt figure doesn't reduce the need
  });
});
