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
});
