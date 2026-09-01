// src/sinkingFund.test.js
import { describe, it, expect } from 'vitest';
import { sinkingFundPlan } from './sinkingFund.js';

describe('sinkingFundPlan', () => {
  it('at 0% return, monthly is just the remaining gap divided by months', () => {
    const result = sinkingFundPlan({ targetAmount: 120000, alreadySaved: 0, months: 24, annualSavingsRate: 0 });
    expect(result.monthlyAmount).toBeCloseTo(5000, 5);
    expect(result.totalContributions).toBeCloseTo(120000, 5);
    expect(result.interestEarned).toBeCloseTo(0, 5);
  });

  it('a head start reduces the monthly amount', () => {
    const none = sinkingFundPlan({ targetAmount: 120000, alreadySaved: 0, months: 24 });
    const some = sinkingFundPlan({ targetAmount: 120000, alreadySaved: 40000, months: 24 });
    expect(some.monthlyAmount).toBeLessThan(none.monthlyAmount);
  });

  it('interest lowers the monthly amount and shows up as interestEarned', () => {
    const noInterest = sinkingFundPlan({ targetAmount: 120000, alreadySaved: 0, months: 24, annualSavingsRate: 0 });
    const withInterest = sinkingFundPlan({ targetAmount: 120000, alreadySaved: 0, months: 24, annualSavingsRate: 6 });
    expect(withInterest.monthlyAmount).toBeLessThan(noInterest.monthlyAmount);
    expect(withInterest.interestEarned).toBeGreaterThan(0);
    // contributions + interest ~= the amount still needed
    expect(withInterest.totalContributions + withInterest.interestEarned).toBeCloseTo(120000, 0);
  });

  it('needs the whole gap now when months is 0', () => {
    const result = sinkingFundPlan({ targetAmount: 50000, alreadySaved: 10000, months: 0 });
    expect(result.monthlyAmount).toBeCloseTo(40000, 5);
  });

  it('never asks for a negative monthly amount when already over target', () => {
    const result = sinkingFundPlan({ targetAmount: 50000, alreadySaved: 80000, months: 12 });
    expect(result.monthlyAmount).toBeGreaterThanOrEqual(0);
    expect(result.remaining).toBe(0);
  });
});
