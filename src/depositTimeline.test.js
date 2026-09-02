// src/depositTimeline.test.js
import { describe, it, expect } from 'vitest';
import { depositSavingsTimeline } from './depositTimeline.js';

describe('depositSavingsTimeline', () => {
  it('at 0% interest, months is target divided by the monthly saving', () => {
    // 10% of 2,000,000 = 200,000; at 10,000/mo -> 20 months.
    const result = depositSavingsTimeline({ homePrice: 2000000, depositPercent: 10, monthlySaving: 10000, annualSavingsRate: 0 });
    expect(result.targetAmount).toBeCloseTo(200000, 5);
    expect(result.months).toBe(20);
  });

  it('interest shortens the timeline', () => {
    const noInterest = depositSavingsTimeline({ homePrice: 2000000, depositPercent: 10, monthlySaving: 8000, annualSavingsRate: 0 });
    const withInterest = depositSavingsTimeline({ homePrice: 2000000, depositPercent: 10, monthlySaving: 8000, annualSavingsRate: 7 });
    expect(withInterest.months).toBeLessThanOrEqual(noInterest.months);
    expect(withInterest.interestEarned).toBeGreaterThan(0);
  });

  it('a head start already at target reports 0 months', () => {
    const result = depositSavingsTimeline({ homePrice: 1000000, depositPercent: 10, monthlySaving: 5000, alreadySaved: 120000 });
    expect(result.alreadyThere).toBe(true);
    expect(result.months).toBe(0);
  });

  it('returns months: null when nothing is being saved and no interest', () => {
    const result = depositSavingsTimeline({ homePrice: 1000000, depositPercent: 10, monthlySaving: 0, annualSavingsRate: 0 });
    expect(result.months).toBeNull();
  });

  it('returns months: null when the monthly amount is too small to reach target within the 100-year cap', () => {
    const result = depositSavingsTimeline({ homePrice: 5000000, depositPercent: 20, monthlySaving: 100, annualSavingsRate: 0 });
    // 1,000,000 target at 100/mo, no interest -> 10,000 months, past the 1200 cap.
    expect(result.months).toBeNull();
    expect(result.alreadyThere).toBe(false);
  });

  it('clamps a deposit percent above 100', () => {
    const result = depositSavingsTimeline({ homePrice: 1000000, depositPercent: 250, monthlySaving: 20000, annualSavingsRate: 0 });
    expect(result.targetAmount).toBeCloseTo(1000000, 5); // capped at 100% of price
  });
});
