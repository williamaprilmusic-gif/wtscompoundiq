// src/powerToolsEngine.test.js
import { describe, it, expect } from 'vitest';
import { yearsToReachTarget, simulateDebtFirst, simulateInvestFirst, simulateDrawdown, MAX_YEARS_TO_SEARCH } from './powerToolsEngine.js';

describe('yearsToReachTarget', () => {
  it('returns 0 when the starting balance already meets the target', () => {
    expect(yearsToReachTarget({ initial: 100000, monthly: 0, rate: 8, target: 50000 })).toBe(0);
  });

  it('finds a reasonable year count for an achievable target', () => {
    const years = yearsToReachTarget({ initial: 0, monthly: 1000, rate: 8, target: 200000 });
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThanOrEqual(MAX_YEARS_TO_SEARCH);
  });

  it('returns null when the target is not reachable within the search window', () => {
    const years = yearsToReachTarget({ initial: 0, monthly: 1, rate: 1, target: 100000000 });
    expect(years).toBeNull();
  });

  it('a higher contribution reaches the same target sooner', () => {
    const slow = yearsToReachTarget({ initial: 0, monthly: 500, rate: 7, target: 300000 });
    const fast = yearsToReachTarget({ initial: 0, monthly: 2000, rate: 7, target: 300000 });
    expect(fast).toBeLessThan(slow);
  });
});

describe('simulateDebtFirst / simulateInvestFirst', () => {
  it('paying down a high-rate debt first beats investing when the debt rate exceeds the investment return', () => {
    const debtFirst = simulateDebtFirst({ debtAmount: 10000, debtRate: 20, extraMonthly: 500, afterTaxReturn: 8, months: 240 });
    const investFirst = simulateInvestFirst({ debtAmount: 10000, debtRate: 20, extraMonthly: 500, afterTaxReturn: 8, months: 240 });
    const netWorthDebtFirst = debtFirst.investment - debtFirst.debtRemaining;
    const netWorthInvestFirst = investFirst.investment - investFirst.debtRemaining;
    expect(netWorthDebtFirst).toBeGreaterThan(netWorthInvestFirst);
  });

  it('simulateDebtFirst clears the debt and records the month it happened', () => {
    const result = simulateDebtFirst({ debtAmount: 5000, debtRate: 10, extraMonthly: 500, afterTaxReturn: 7, months: 60 });
    expect(result.debtRemaining).toBe(0);
    expect(result.clearedAtMonth).toBeGreaterThan(0);
    expect(result.clearedAtMonth).toBeLessThanOrEqual(60);
  });

  it('simulateInvestFirst leaves the debt to compound completely untouched', () => {
    const result = simulateInvestFirst({ debtAmount: 10000, debtRate: 10, extraMonthly: 0, afterTaxReturn: 7, months: 12 });
    // 10000 compounded at 10%/yr (≈0.833%/mo) for 12 months
    expect(result.debtRemaining).toBeGreaterThan(10000);
    expect(result.investment).toBe(0);
  });
});

describe('simulateDrawdown', () => {
  it('a sustainable withdrawal rate lasts the full retirement horizon', () => {
    const result = simulateDrawdown({ startingBalance: 1000000, annualWithdrawal: 40000, returnRate: 5, inflation: 0, years: 30 });
    expect(result.depleted).toBe(false);
    expect(result.lastedYears).toBe(30);
    expect(result.endingBalance).toBeGreaterThan(0);
  });

  it('too aggressive a withdrawal rate depletes the pot early', () => {
    const result = simulateDrawdown({ startingBalance: 1000000, annualWithdrawal: 150000, returnRate: 5, inflation: 2, years: 30 });
    expect(result.depleted).toBe(true);
    expect(result.lastedYears).toBeLessThan(30);
    expect(result.endingBalance).toBe(0);
  });

  it('inflation-escalated withdrawals deplete a pot faster than flat ones, all else equal', () => {
    const flat = simulateDrawdown({ startingBalance: 800000, annualWithdrawal: 45000, returnRate: 5, inflation: 0, years: 30 });
    const escalating = simulateDrawdown({ startingBalance: 800000, annualWithdrawal: 45000, returnRate: 5, inflation: 4, years: 30 });
    const flatEnd = flat.depleted ? 0 : flat.endingBalance;
    const escalatingEnd = escalating.depleted ? 0 : escalating.endingBalance;
    expect(escalatingEnd).toBeLessThanOrEqual(flatEnd);
  });
});
