// src/salaryCalculator.test.js
import { describe, it, expect } from 'vitest';
import { calculateTakeHomePay } from './salaryCalculator.js';
import { taxOwedAtBrackets } from './engine.js';

describe('calculateTakeHomePay', () => {
  it('applies a flat tax rate when no brackets are given', () => {
    const result = calculateTakeHomePay({ grossAnnual: 600000, taxRate: 25, taxBrackets: null });
    expect(result.tax).toBeCloseTo(150000, 5);
    expect(result.netAnnual).toBeCloseTo(450000, 5);
    expect(result.netMonthly).toBeCloseTo(37500, 5);
    expect(result.effectiveRate).toBeCloseTo(25, 5);
  });

  it('uses progressive brackets when provided, matching taxOwedAtBrackets directly', () => {
    const taxBrackets = [
      { upTo: 250000, rate: 18 },
      { upTo: 500000, rate: 26 },
      { upTo: null, rate: 31 }
    ];
    const result = calculateTakeHomePay({ grossAnnual: 700000, taxRate: 45, taxBrackets });
    expect(result.tax).toBeCloseTo(taxOwedAtBrackets(700000, taxBrackets), 5);
    // Brackets should win over the flat rate, not the other way around.
    expect(result.tax).not.toBeCloseTo(700000 * 0.45, 0);
  });

  it('never goes negative for a 0 or missing income', () => {
    expect(calculateTakeHomePay({ grossAnnual: 0, taxRate: 30 }).netAnnual).toBe(0);
    expect(calculateTakeHomePay({ grossAnnual: undefined, taxRate: 30 }).netAnnual).toBe(0);
  });

  it('clamps a negative grossAnnual to 0 rather than producing a negative take-home', () => {
    const result = calculateTakeHomePay({ grossAnnual: -50000, taxRate: 20 });
    expect(result.grossAnnual).toBe(0);
    expect(result.netAnnual).toBe(0);
  });

  it('effectiveRate is 0 when gross is 0 (no divide-by-zero NaN)', () => {
    expect(calculateTakeHomePay({ grossAnnual: 0, taxRate: 30 }).effectiveRate).toBe(0);
  });

  it('subtracts a rebate (e.g. SARS primary rebate) from the bracket tax, lowering it and effectiveRate', () => {
    const taxBrackets = [
      { upTo: 250000, rate: 18 },
      { upTo: 500000, rate: 26 },
      { upTo: null, rate: 31 }
    ];
    const withoutRebate = calculateTakeHomePay({ grossAnnual: 300000, taxRate: 45, taxBrackets });
    const withRebate = calculateTakeHomePay({ grossAnnual: 300000, taxRate: 45, taxBrackets, rebate: 17235 });
    expect(withRebate.tax).toBeCloseTo(withoutRebate.tax - 17235, 5);
    expect(withRebate.netAnnual).toBeCloseTo(withoutRebate.netAnnual + 17235, 5);
    expect(withRebate.effectiveRate).toBeLessThan(withoutRebate.effectiveRate);
  });

  it('a rebate larger than the bracket tax floors take-home tax at 0, not negative', () => {
    const taxBrackets = [{ upTo: null, rate: 18 }];
    const result = calculateTakeHomePay({ grossAnnual: 50000, taxRate: 18, taxBrackets, rebate: 50000 });
    expect(result.tax).toBe(0);
    expect(result.netAnnual).toBe(50000);
  });

  it('omitting rebate defaults to 0, matching the pre-rebate result exactly', () => {
    const taxBrackets = [{ upTo: null, rate: 25 }];
    const withDefault = calculateTakeHomePay({ grossAnnual: 400000, taxRate: 25, taxBrackets });
    const withExplicitZero = calculateTakeHomePay({ grossAnnual: 400000, taxRate: 25, taxBrackets, rebate: 0 });
    expect(withDefault.tax).toBe(withExplicitZero.tax);
  });
});
