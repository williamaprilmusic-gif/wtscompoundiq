// src/growthRate.test.js
import { describe, it, expect } from 'vitest';
import { annualisedGrowth, yearsBetweenDates } from './growthRate.js';

describe('annualisedGrowth', () => {
  it('computes the CAGR that turns start into end over the period', () => {
    const result = annualisedGrowth({ startValue: 100000, endValue: 200000, years: 5 });
    expect(result.cagr).toBeCloseTo((Math.pow(2, 1 / 5) - 1) * 100, 6);
    expect(result.totalChange).toBe(100000);
    expect(result.totalChangePercent).toBeCloseTo(100, 6);
  });

  it('a flat value has ~0% CAGR', () => {
    expect(annualisedGrowth({ startValue: 50000, endValue: 50000, years: 3 }).cagr).toBeCloseTo(0, 6);
  });

  it('a decline gives a negative CAGR', () => {
    expect(annualisedGrowth({ startValue: 100000, endValue: 80000, years: 2 }).cagr).toBeLessThan(0);
  });

  it('returns cagr: null but a total change when starting from zero or below', () => {
    const fromZero = annualisedGrowth({ startValue: 0, endValue: 40000, years: 2 });
    expect(fromZero.cagr).toBeNull();
    expect(fromZero.totalChange).toBe(40000);
    expect(fromZero.totalChangePercent).toBeNull();

    const fromNegative = annualisedGrowth({ startValue: -10000, endValue: 5000, years: 1 });
    expect(fromNegative.cagr).toBeNull();
    expect(fromNegative.totalChange).toBe(15000);
  });

  it('returns cagr: null when the end value has gone negative (no real root)', () => {
    expect(annualisedGrowth({ startValue: 20000, endValue: -5000, years: 2 }).cagr).toBeNull();
  });

  it('returns cagr: null when no time has elapsed', () => {
    expect(annualisedGrowth({ startValue: 10000, endValue: 12000, years: 0 }).cagr).toBeNull();
  });
});

describe('yearsBetweenDates', () => {
  it('returns the fractional-year gap between two ISO dates', () => {
    expect(yearsBetweenDates('2024-01-01T00:00:00Z', '2025-01-01T00:00:00Z')).toBeCloseTo(1, 2);
    expect(yearsBetweenDates('2024-01-01T00:00:00Z', '2025-07-02T00:00:00Z')).toBeCloseTo(1.5, 1);
  });

  it('returns 0 for a reversed, equal, or unparseable pair', () => {
    expect(yearsBetweenDates('2025-01-01', '2024-01-01')).toBe(0);
    expect(yearsBetweenDates('2024-01-01', '2024-01-01')).toBe(0);
    expect(yearsBetweenDates('not a date', '2025-01-01')).toBe(0);
  });
});
