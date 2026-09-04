// src/buyCashVsFinance.test.js
import { describe, it, expect } from 'vitest';
import { compareBuyCashVsFinance } from './buyCashVsFinance.js';

describe('compareBuyCashVsFinance', () => {
  it('when the invest return equals the finance rate, the two paths roughly tie', () => {
    const r = compareBuyCashVsFinance({ price: 400000, financeRate: 11, financeTermYears: 5, investReturnPct: 11 });
    expect(r.gap / r.cashPathWealth).toBeLessThan(0.02); // within ~2%
  });

  it('a low invest return favours paying cash', () => {
    const r = compareBuyCashVsFinance({ price: 400000, financeRate: 12, financeTermYears: 5, investReturnPct: 4 });
    expect(r.cheaper).toBe('cash');
    expect(r.cashPathWealth).toBeGreaterThan(r.financePathWealth);
  });

  it('a high invest return favours financing and keeping the cash invested', () => {
    const r = compareBuyCashVsFinance({ price: 400000, financeRate: 9, financeTermYears: 6, investReturnPct: 18 });
    expect(r.cheaper).toBe('finance');
    expect(r.financePathWealth).toBeGreaterThan(r.cashPathWealth);
  });

  it('reports the monthly payment and total finance interest', () => {
    const r = compareBuyCashVsFinance({ price: 300000, deposit: 60000, financeRate: 10, financeTermYears: 5, investReturnPct: 8 });
    expect(r.monthlyPayment).toBeGreaterThan(0);
    expect(r.financeInterest).toBeGreaterThan(0);
    expect(r.breakEvenReturnApprox).toBe(10);
  });

  it('returns nulls for a zero price or term', () => {
    expect(compareBuyCashVsFinance({ price: 0, financeRate: 10, financeTermYears: 5 }).cheaper).toBeNull();
    expect(compareBuyCashVsFinance({ price: 100000, financeRate: 10, financeTermYears: 0 }).cheaper).toBeNull();
  });
});
