// src/rateSensitivity.test.js
import { describe, it, expect } from 'vitest';
import { rateSensitivity, DEFAULT_SHIFTS } from './rateSensitivity.js';
import { calculateLoanAmortization } from './loanAmortization.js';

describe('rateSensitivity', () => {
  it('the 0-shift row matches loanAmortization at the current rate', () => {
    const rows = rateSensitivity({ balance: 1000000, currentRate: 11, yearsRemaining: 18 });
    const zero = rows.find(r => r.shift === 0);
    const { monthlyPayment } = calculateLoanAmortization({ principal: 1000000, annualRate: 11, termYears: 18 });
    expect(zero.payment).toBeCloseTo(monthlyPayment, 0);
    expect(zero.deltaVsNow).toBeCloseTo(0, 5);
  });

  it('returns one row per shift and payments rise with the rate', () => {
    const rows = rateSensitivity({ balance: 800000, currentRate: 10, yearsRemaining: 20 });
    expect(rows).toHaveLength(DEFAULT_SHIFTS.length);
    const up = rows.find(r => r.shift === 2);
    const down = rows.find(r => r.shift === -2);
    expect(up.payment).toBeGreaterThan(down.payment);
    expect(up.deltaVsNow).toBeGreaterThan(0);
    expect(down.deltaVsNow).toBeLessThan(0);
  });

  it('clamps a downward shift that would push the rate below 0', () => {
    const rows = rateSensitivity({ balance: 500000, currentRate: 2, yearsRemaining: 15, shifts: [-5, 0] });
    const clamped = rows.find(r => r.shift === -5);
    expect(clamped.rate).toBe(0);
    expect(clamped.payment).toBeCloseTo(500000 / (15 * 12), 5); // 0% -> straight division
  });

  it('returns 0 payments for a zero balance', () => {
    const rows = rateSensitivity({ balance: 0, currentRate: 10, yearsRemaining: 20 });
    expect(rows.every(r => r.payment === 0)).toBe(true);
  });
});
