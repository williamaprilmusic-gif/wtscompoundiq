// src/debtConsolidation.test.js
import { describe, it, expect } from 'vitest';
import { compareDebtConsolidation } from './debtConsolidation.js';

const DEBTS = [
  { balance: 40000, rate: 22, minPayment: 1500 }, // credit card
  { balance: 25000, rate: 18, minPayment: 900 },  // store card
  { balance: 60000, rate: 14, minPayment: 1600 }  // personal loan
];

describe('compareDebtConsolidation', () => {
  it('sums balances and current payments', () => {
    const r = compareDebtConsolidation({ debts: DEBTS, newRate: 15, newTermYears: 4 });
    expect(r.totalBalance).toBe(125000);
    expect(r.currentMonthly).toBe(4000);
  });

  it('a lower consolidated rate cuts total interest vs the status quo', () => {
    const r = compareDebtConsolidation({ debts: DEBTS, newRate: 12, newTermYears: 5 });
    expect(r.consolidatedInterest).toBeLessThan(r.currentInterest);
    expect(r.interestSaved).toBeGreaterThan(0);
  });

  it('flags a debt whose payment never clears its interest', () => {
    const r = compareDebtConsolidation({
      debts: [{ balance: 50000, rate: 24, minPayment: 500 }],
      newRate: 15, newTermYears: 5
    });
    expect(r.anyNeverPaysOff).toBe(true);
    expect(r.currentMonths).toBeNull();
    expect(r.interestSaved).toBeNull(); // can't compare against an infinite baseline
  });

  it('reports the monthly cash-flow change from consolidating', () => {
    const r = compareDebtConsolidation({ debts: DEBTS, newRate: 15, newTermYears: 6 });
    // A longer term should drop the monthly below the current R4,000 total.
    expect(r.consolidatedMonthly).toBeLessThan(4000);
    expect(r.monthlyDifference).toBeGreaterThan(0);
  });

  it('handles an empty debt list without throwing', () => {
    const r = compareDebtConsolidation({ debts: [], newRate: 15, newTermYears: 5 });
    expect(r.totalBalance).toBe(0);
    expect(r.consolidatedInterest).toBeNull();
  });
});
