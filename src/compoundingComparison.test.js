// src/compoundingComparison.test.js
import { describe, it, expect } from 'vitest';
import { compareCompoundingFrequencies, FREQUENCIES } from './compoundingComparison.js';
import { calculateCompoundInterest } from './engine.js';

describe('compareCompoundingFrequencies', () => {
  it('returns one row per frequency, matching the engine directly', () => {
    const rows = compareCompoundingFrequencies({ principal: 100000, annualRate: 8, years: 10 });
    expect(rows).toHaveLength(FREQUENCIES.length);
    const monthly = rows.find(r => r.key === 'monthly');
    const expected = calculateCompoundInterest({ initial: 100000, monthly: 0, rate: 8, years: 10, inflation: 0, taxRate: 0, wrapper: false, compoundFrequency: 12 }).finalBalance;
    expect(monthly.finalBalance).toBeCloseTo(expected, 5);
  });

  it('more frequent compounding yields at least as much as annual', () => {
    const rows = compareCompoundingFrequencies({ principal: 100000, annualRate: 10, years: 20 });
    const annual = rows.find(r => r.key === 'annual');
    const daily = rows.find(r => r.key === 'daily');
    expect(daily.finalBalance).toBeGreaterThan(annual.finalBalance);
    expect(annual.extraVsAnnual).toBeCloseTo(0, 5);
    expect(daily.extraVsAnnual).toBeGreaterThan(0);
  });

  it('the gap is negligible at low rates / short terms', () => {
    const rows = compareCompoundingFrequencies({ principal: 10000, annualRate: 1, years: 1 });
    const daily = rows.find(r => r.key === 'daily');
    expect(daily.extraVsAnnual).toBeLessThan(10); // a few rand on 10k
  });

  it('handles a 0 principal without NaN', () => {
    const rows = compareCompoundingFrequencies({ principal: 0, annualRate: 8, years: 10 });
    expect(rows.every(r => r.finalBalance === 0)).toBe(true);
  });
});
