// src/budgetRule.test.js
import { describe, it, expect } from 'vitest';
import { budgetRuleCheck } from './budgetRule.js';

describe('budgetRuleCheck', () => {
  it('computes the 50/30/20 target amounts from take-home income', () => {
    const result = budgetRuleCheck({ takeHomeIncome: 40000, needs: 0, wants: 0, savings: 0 });
    expect(result.targets.needs).toBeCloseTo(20000, 5);
    expect(result.targets.wants).toBeCloseTo(12000, 5);
    expect(result.targets.savings).toBeCloseTo(8000, 5);
  });

  it('flags a textbook split as on track', () => {
    const result = budgetRuleCheck({ takeHomeIncome: 40000, needs: 20000, wants: 12000, savings: 8000 });
    expect(result.onTrack).toBe(true);
    expect(result.unallocated).toBeCloseTo(0, 5);
    expect(result.actualPct.savings).toBeCloseTo(20, 5);
  });

  it('flags overspending on needs / undersaving as off track', () => {
    const result = budgetRuleCheck({ takeHomeIncome: 40000, needs: 28000, wants: 10000, savings: 2000 });
    expect(result.onTrack).toBe(false);
    expect(result.actualPct.needs).toBeCloseTo(70, 5);
  });

  it('flags a blown "wants" budget as off track even if needs and savings are fine', () => {
    // needs 50%, savings 20%, but wants 75% and the plan is over-allocated by 20000.
    const result = budgetRuleCheck({ takeHomeIncome: 40000, needs: 20000, wants: 30000, savings: 8000 });
    expect(result.onTrack).toBe(false);
    expect(result.unallocated).toBeCloseTo(-18000, 5);
  });

  it('reports unallocated income left over', () => {
    const result = budgetRuleCheck({ takeHomeIncome: 40000, needs: 15000, wants: 10000, savings: 5000 });
    expect(result.unallocated).toBeCloseTo(10000, 5);
  });

  it('no divide-by-zero when income is 0', () => {
    const result = budgetRuleCheck({ takeHomeIncome: 0, needs: 1000, wants: 500, savings: 0 });
    expect(result.actualPct.needs).toBe(0);
    expect(result.onTrack).toBe(false);
  });
});
