// src/dividendIncome.test.js
import { describe, it, expect } from 'vitest';
import { dividendIncome } from './dividendIncome.js';

describe('dividendIncome', () => {
  it('sizes the capital needed for a target monthly income at a given yield', () => {
    // 10,000/mo = 120,000/yr; at 4% yield that needs 3,000,000.
    const result = dividendIncome({ targetMonthlyIncome: 10000, currentPortfolio: 0, annualYield: 4 });
    expect(result.capitalNeeded).toBeCloseTo(3000000, 2);
    expect(result.shortfallCapital).toBeCloseTo(3000000, 2);
  });

  it('reports the income a current portfolio already produces', () => {
    const result = dividendIncome({ targetMonthlyIncome: 0, currentPortfolio: 1000000, annualYield: 5 });
    expect(result.annualFromPortfolio).toBeCloseTo(50000, 5);
    expect(result.monthlyFromPortfolio).toBeCloseTo(50000 / 12, 5);
  });

  it('nets the shortfall against what the portfolio already covers', () => {
    const result = dividendIncome({ targetMonthlyIncome: 10000, currentPortfolio: 1000000, annualYield: 4 });
    expect(result.shortfallCapital).toBeCloseTo(3000000 - 1000000, 2);
  });

  it('returns null capital (not Infinity) for a 0% yield', () => {
    const result = dividendIncome({ targetMonthlyIncome: 5000, currentPortfolio: 0, annualYield: 0 });
    expect(result.capitalNeeded).toBeNull();
    expect(result.shortfallCapital).toBeNull();
  });

  it('clamps negative inputs', () => {
    const result = dividendIncome({ targetMonthlyIncome: -100, currentPortfolio: -100, annualYield: -1 });
    expect(result.capitalNeeded).toBeNull();
    expect(result.annualFromPortfolio).toBe(0);
  });
});
