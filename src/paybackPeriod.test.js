// src/paybackPeriod.test.js
import { describe, it, expect } from 'vitest';
import { analysePayback } from './paybackPeriod.js';

describe('analysePayback', () => {
  it('finds the simple break-even month from cost / net monthly saving', () => {
    const r = analysePayback({ upfrontCost: 120000, monthlySaving: 2000, lifespanYears: 20 });
    expect(r.breakEvenMonths).toBe(60); // 120000 / 2000
    expect(r.breakEvenYears).toBeCloseTo(5, 6);
  });

  it('nets out maintenance from the saving', () => {
    const r = analysePayback({ upfrontCost: 60000, monthlySaving: 1200, maintenanceMonthly: 200, lifespanYears: 15 });
    expect(r.breakEvenMonths).toBe(60); // 60000 / (1200 - 200)
    expect(r.firstYearSaving).toBeCloseTo(12000, 6);
  });

  it('flags a purchase that can never pay for itself', () => {
    const r = analysePayback({ upfrontCost: 50000, monthlySaving: 100, maintenanceMonthly: 300, lifespanYears: 10 });
    expect(r.neverBreaksEven).toBe(true);
    expect(r.breakEvenMonths).toBeNull();
  });

  it('lifetimeNet is total net saving over the life minus the cost', () => {
    const r = analysePayback({ upfrontCost: 100000, monthlySaving: 1500, lifespanYears: 10, savingGrowthPct: 0 });
    expect(r.lifetimeNet).toBeCloseTo(1500 * 120 - 100000, 4);
  });

  it('with a high invest return the upfront cash left invested can beat buying', () => {
    const cheapReturn = analysePayback({ upfrontCost: 150000, monthlySaving: 1500, lifespanYears: 12, investReturnPct: 3 });
    const richReturn = analysePayback({ upfrontCost: 150000, monthlySaving: 1500, lifespanYears: 12, investReturnPct: 20 });
    expect(cheapReturn.beatsInvesting).toBe(true);
    expect(richReturn.beatsInvesting).toBe(false);
  });
});
