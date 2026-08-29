// src/loanAmortization.test.js
import { describe, it, expect } from 'vitest';
import { calculateLoanAmortization } from './loanAmortization.js';

describe('calculateLoanAmortization -- basic amortization', () => {
  it('matches the standard closed-form payment for a textbook example', () => {
    // R100,000 at 12% annual (1%/mo) over 1 year -> known monthly payment ≈ R8,884.88
    const r = calculateLoanAmortization({ principal: 100000, annualRate: 12, termYears: 1 });
    expect(r.monthlyPayment).toBe(8885); // rounded
    expect(r.payoffMonths).toBe(12);
  });

  it('a 0% interest loan just divides principal evenly across the term', () => {
    const r = calculateLoanAmortization({ principal: 12000, annualRate: 0, termYears: 1 });
    expect(r.monthlyPayment).toBe(1000);
    expect(r.totalInterest).toBe(0);
    expect(r.totalRepayment).toBe(12000);
  });

  it('total repayment always exceeds principal when there is any interest', () => {
    const r = calculateLoanAmortization({ principal: 500000, annualRate: 11, termYears: 20 });
    expect(r.totalRepayment).toBeGreaterThan(500000);
    expect(r.totalInterest).toBe(r.totalRepayment - 500000);
  });

  it('a longer term at the same rate costs more total interest (classic mortgage tradeoff)', () => {
    const short = calculateLoanAmortization({ principal: 500000, annualRate: 11, termYears: 15 });
    const long = calculateLoanAmortization({ principal: 500000, annualRate: 11, termYears: 30 });
    expect(long.totalInterest).toBeGreaterThan(short.totalInterest);
    expect(long.monthlyPayment).toBeLessThan(short.monthlyPayment);
  });

  it('the amortization schedule ends near zero balance and covers the full term', () => {
    const r = calculateLoanAmortization({ principal: 200000, annualRate: 9.5, termYears: 5 });
    expect(r.yearlyData).toHaveLength(5);
    expect(r.yearlyData[r.yearlyData.length - 1].balance).toBe(0);
    expect(r.reachable).toBe(true);
  });

  it('returns a zero/empty result for a zero principal or zero term instead of throwing', () => {
    expect(calculateLoanAmortization({ principal: 0, annualRate: 10, termYears: 20 }).monthlyPayment).toBe(0);
    expect(calculateLoanAmortization({ principal: 100000, annualRate: 10, termYears: 0 }).monthlyPayment).toBe(0);
  });
});

describe('calculateLoanAmortization -- overpayment', () => {
  it('an extra monthly payment shortens the term and reduces total interest', () => {
    const r = calculateLoanAmortization({ principal: 1000000, annualRate: 11, termYears: 20, extraMonthly: 2000 });
    expect(r.extra).not.toBeNull();
    expect(r.extra.payoffMonths).toBeLessThan(r.payoffMonths);
    expect(r.extra.totalInterest).toBeLessThan(r.totalInterest);
    expect(r.extra.monthsSaved).toBeGreaterThan(0);
    expect(r.extra.interestSaved).toBeGreaterThan(0);
  });

  it('extra is null when no overpayment is given', () => {
    const r = calculateLoanAmortization({ principal: 500000, annualRate: 11, termYears: 20 });
    expect(r.extra).toBeNull();
  });
});

describe('calculateLoanAmortization -- malformed input hardening', () => {
  it('never throws and always returns finite numbers given garbage input', () => {
    const cases = [
      { principal: NaN, annualRate: 10, termYears: 20 },
      { principal: 500000, annualRate: NaN, termYears: 20 },
      { principal: 500000, annualRate: 10, termYears: NaN },
      { principal: -500000, annualRate: 10, termYears: 20 },
      { principal: 500000, annualRate: -5, termYears: 20 },
      { principal: 500000, annualRate: 10, termYears: 20, extraMonthly: NaN }
    ];
    for (const input of cases) {
      const r = calculateLoanAmortization(input);
      expect(Number.isFinite(r.monthlyPayment)).toBe(true);
      expect(Number.isFinite(r.totalRepayment)).toBe(true);
      expect(Number.isFinite(r.totalInterest)).toBe(true);
    }
  });
});
