// src/baristaFire.test.js
import { describe, it, expect } from 'vitest';
import { baristaFireNumber } from './baristaFire.js';

describe('baristaFireNumber', () => {
  it('with no part-time income, the barista number equals the full FIRE number', () => {
    const result = baristaFireNumber({ annualExpenses: 400000, partTimeIncome: 0, withdrawalRate: 4 });
    expect(result.baristaFireNumber).toBeCloseTo(result.fullFireNumber, 5);
    expect(result.baristaFireNumber).toBeCloseTo(10000000, 2); // 400k / 0.04
  });

  it('part-time income covering half the expenses roughly halves the pot needed', () => {
    const result = baristaFireNumber({ annualExpenses: 400000, partTimeIncome: 200000, withdrawalRate: 4 });
    expect(result.baristaFireNumber).toBeCloseTo(5000000, 2);
    expect(result.reduction).toBeCloseTo(5000000, 2);
  });

  it('part-time income covering the whole cost of living means no pot is needed', () => {
    const result = baristaFireNumber({ annualExpenses: 300000, partTimeIncome: 320000, withdrawalRate: 4 });
    expect(result.coversItself).toBe(true);
    expect(result.baristaFireNumber).toBe(0);
    expect(result.gap).toBe(0);
  });

  it('a lower withdrawal rate raises both numbers', () => {
    const four = baristaFireNumber({ annualExpenses: 400000, partTimeIncome: 100000, withdrawalRate: 4 });
    const three = baristaFireNumber({ annualExpenses: 400000, partTimeIncome: 100000, withdrawalRate: 3 });
    expect(three.baristaFireNumber).toBeGreaterThan(four.baristaFireNumber);
  });

  it('guards a 0 withdrawal rate against divide-by-zero', () => {
    const result = baristaFireNumber({ annualExpenses: 400000, partTimeIncome: 100000, withdrawalRate: 0 });
    expect(Number.isFinite(result.baristaFireNumber)).toBe(true);
  });
});
