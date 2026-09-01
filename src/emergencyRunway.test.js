// src/emergencyRunway.test.js
import { describe, it, expect } from 'vitest';
import { emergencyRunway } from './emergencyRunway.js';

describe('emergencyRunway', () => {
  it('at 0% interest, runway is savings divided by monthly expenses', () => {
    const result = emergencyRunway({ savings: 120000, monthlyExpenses: 20000, annualSavingsRate: 0 });
    expect(result.fullMonths).toBe(6);
    expect(result.lastsIndefinitely).toBe(false);
  });

  it('interest stretches the runway a little past the plain division', () => {
    const noInterest = emergencyRunway({ savings: 240000, monthlyExpenses: 20000, annualSavingsRate: 0 });
    const withInterest = emergencyRunway({ savings: 240000, monthlyExpenses: 20000, annualSavingsRate: 8 });
    expect(withInterest.fullMonths).toBeGreaterThanOrEqual(noInterest.fullMonths);
  });

  it('reports lastsIndefinitely when a month of interest alone covers the burn', () => {
    // 5,000,000 at 12%/yr -> ~50,000/mo interest, covering a 30,000/mo burn forever.
    const result = emergencyRunway({ savings: 5000000, monthlyExpenses: 30000, annualSavingsRate: 12 });
    expect(result.lastsIndefinitely).toBe(true);
    expect(result.fullMonths).toBe(Infinity);
  });

  it('zero expenses means the fund lasts indefinitely', () => {
    expect(emergencyRunway({ savings: 10000, monthlyExpenses: 0 }).lastsIndefinitely).toBe(true);
  });

  it('no savings means zero months of runway', () => {
    expect(emergencyRunway({ savings: 0, monthlyExpenses: 15000 }).fullMonths).toBe(0);
  });
});
