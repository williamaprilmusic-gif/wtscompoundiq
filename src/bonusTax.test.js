// src/bonusTax.test.js
import { describe, it, expect } from 'vitest';
import { bonusTakeHome } from './bonusTax.js';

// Simple ascending brackets for the progressive path.
const BRACKETS = [
  { upTo: 240000, rate: 18 },
  { upTo: 370000, rate: 26 },
  { upTo: 510000, rate: 31 },
  { upTo: null, rate: 36 }
];

describe('bonusTakeHome', () => {
  it('flat rate: keeps (100 - rate)% of the bonus', () => {
    const r = bonusTakeHome({ annualSalary: 500000, bonusAmount: 50000, taxRate: 30 });
    expect(r.taxOnBonus).toBeCloseTo(15000, 6);
    expect(r.netBonus).toBeCloseTo(35000, 6);
    expect(r.keepPct).toBeCloseTo(70, 6);
    expect(r.marginalRatePct).toBe(30);
  });

  it('progressive: a bonus is taxed at the marginal rate on top of salary', () => {
    // Salary 350k is in the 26% band; a 40k bonus pushes partly into the 31% band.
    const r = bonusTakeHome({ annualSalary: 350000, bonusAmount: 40000, taxBrackets: BRACKETS });
    const expected =
      (20000 * 0.26) + // 350k -> 370k
      (20000 * 0.31);  // 370k -> 390k
    expect(r.taxOnBonus).toBeCloseTo(expected, 6);
    expect(r.netBonus).toBeCloseTo(40000 - expected, 6);
    expect(r.marginalRatePct).toBeCloseTo(31, 4);
  });

  it('a high earner keeps only (100 - top rate)% ', () => {
    const r = bonusTakeHome({ annualSalary: 800000, bonusAmount: 100000, taxBrackets: BRACKETS });
    expect(r.averageRateOnBonusPct).toBeCloseTo(36, 4);
    expect(r.keepPct).toBeCloseTo(64, 4);
  });

  it('a zero bonus is a clean zero, not NaN', () => {
    const r = bonusTakeHome({ annualSalary: 400000, bonusAmount: 0, taxBrackets: BRACKETS });
    expect(r.netBonus).toBe(0);
    expect(r.keepPct).toBe(100);
  });

  it('never reports negative tax or keeping more than the bonus', () => {
    const r = bonusTakeHome({ annualSalary: 0, bonusAmount: 20000, taxRate: -5 });
    expect(r.taxOnBonus).toBeGreaterThanOrEqual(0);
    expect(r.netBonus).toBeLessThanOrEqual(20000);
  });
});
