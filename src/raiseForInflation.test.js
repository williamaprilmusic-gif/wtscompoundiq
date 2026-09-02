// src/raiseForInflation.test.js
import { describe, it, expect } from 'vitest';
import { raiseForInflation } from './raiseForInflation.js';

describe('raiseForInflation', () => {
  it('break-even raise equals the inflation rate', () => {
    const result = raiseForInflation({ currentSalary: 600000, inflationRate: 6 });
    expect(result.breakEvenRaisePercent).toBe(6);
    expect(result.breakEvenRaiseAmount).toBeCloseTo(36000, 5);
  });

  it('a raise above inflation is a real gain, below inflation a real cut', () => {
    const above = raiseForInflation({ currentSalary: 600000, inflationRate: 6, offeredRaisePercent: 9 });
    const below = raiseForInflation({ currentSalary: 600000, inflationRate: 6, offeredRaisePercent: 4 });
    expect(above.beatsInflation).toBe(true);
    expect(above.realChangePercent).toBeGreaterThan(0);
    expect(below.beatsInflation).toBe(false);
    expect(below.realChangePercent).toBeLessThan(0);
  });

  it('a raise exactly matching inflation is roughly flat in real terms and flagged matchesInflation', () => {
    const result = raiseForInflation({ currentSalary: 500000, inflationRate: 5, offeredRaisePercent: 5 });
    expect(result.realChangePercent).toBeCloseTo(0, 6);
    expect(result.matchesInflation).toBe(true);
    expect(result.beatsInflation).toBe(false);
  });

  it('real salary after the offer discounts the new nominal by inflation', () => {
    const result = raiseForInflation({ currentSalary: 500000, inflationRate: 5, offeredRaisePercent: 10 });
    expect(result.realSalaryAfterOffer).toBeCloseTo((500000 * 1.10) / 1.05, 2);
  });

  it('no divide-by-zero at zero salary', () => {
    const result = raiseForInflation({ currentSalary: 0, inflationRate: 6, offeredRaisePercent: 5 });
    expect(result.realChangePercent).toBe(0);
  });
});
