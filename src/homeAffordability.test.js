// src/homeAffordability.test.js
import { describe, it, expect } from 'vitest';
import { maxLoanForPayment, estimateZaTransferDuty } from './homeAffordability.js';
import { calculateLoanAmortization } from './loanAmortization.js';

describe('maxLoanForPayment', () => {
  it('is the true inverse of calculateLoanAmortization\'s monthlyPayment', () => {
    const principal = 1000000;
    const annualRate = 11;
    const termYears = 20;
    const { monthlyPayment } = calculateLoanAmortization({ principal, annualRate, termYears });
    const recovered = maxLoanForPayment({ payment: monthlyPayment, annualRate, termYears });
    expect(recovered).toBeCloseTo(principal, -2); // within rounding of the whole-rand payment
  });

  it('handles a 0% rate as a plain division (no interest)', () => {
    expect(maxLoanForPayment({ payment: 1000, annualRate: 0, termYears: 10 })).toBeCloseTo(120000, 5);
  });

  it('returns 0 for a non-positive payment or term', () => {
    expect(maxLoanForPayment({ payment: 0, annualRate: 10, termYears: 20 })).toBe(0);
    expect(maxLoanForPayment({ payment: 5000, annualRate: 10, termYears: 0 })).toBe(0);
  });

  it('a bigger payment budget affords a bigger loan, all else equal', () => {
    const small = maxLoanForPayment({ payment: 5000, annualRate: 11, termYears: 20 });
    const big = maxLoanForPayment({ payment: 10000, annualRate: 11, termYears: 20 });
    expect(big).toBeGreaterThan(small);
  });
});

describe('estimateZaTransferDuty', () => {
  it('is 0 below the tax-free threshold', () => {
    expect(estimateZaTransferDuty(1000000)).toBe(0);
    expect(estimateZaTransferDuty(0)).toBe(0);
  });

  it('applies the 3% bracket above R1,210,000', () => {
    expect(estimateZaTransferDuty(1400000)).toBeCloseTo((1400000 - 1210000) * 0.03, 5);
  });

  it('stacks cumulative base duty correctly moving up brackets', () => {
    // R2,000,000 falls in the 6% bracket: R13,614 base + 6% of the amount over R1,663,800
    const expected = 13614 + (2000000 - 1663800) * 0.06;
    expect(estimateZaTransferDuty(2000000)).toBeCloseTo(expected, 5);
  });

  it('is monotonically increasing with price', () => {
    const a = estimateZaTransferDuty(3000000);
    const b = estimateZaTransferDuty(15000000);
    expect(b).toBeGreaterThan(a);
  });
});
