// src/engine.test.js
// Unit tests for engine.js -- the one file every tab in the app depends on, so a
// silent regression here is the highest-leverage bug this app can have. Run with
// `npm test`.
import { describe, it, expect } from 'vitest';
import { calculateCompoundInterest, taxOwedAtBrackets } from './engine.js';

describe('calculateCompoundInterest -- basic compounding', () => {
  it('returns the starting balance untouched at years=0', () => {
    const r = calculateCompoundInterest({ initial: 1000, monthly: 100, rate: 8, years: 0 });
    expect(r.finalBalance).toBe(1000);
    expect(r.yearlyData).toHaveLength(0);
  });

  it('grows a lump sum with no contributions using standard compound interest', () => {
    // 1000 at 12% annual, compounded annually, for 1 year -> exactly 1120.
    const r = calculateCompoundInterest({ initial: 1000, monthly: 0, rate: 12, years: 1, compoundFrequency: 1 });
    expect(r.finalBalance).toBe(1120);
  });

  it('matches manual monthly-compounding math for a simple contribution plan', () => {
    // 0 initial, 100/mo, 6% annual (0.5%/mo), 1 year, monthly compounding.
    let balance = 0;
    for (let m = 0; m < 12; m++) {
      balance += balance * 0.005;
      balance += 100;
    }
    const r = calculateCompoundInterest({ initial: 0, monthly: 100, rate: 6, years: 1, compoundFrequency: 12 });
    expect(r.finalBalance).toBe(Math.round(balance));
  });

  it('tracks total deposited as initial + all monthly contributions, independent of growth', () => {
    const r = calculateCompoundInterest({ initial: 5000, monthly: 200, rate: 7, years: 3 });
    expect(r.totalDeposited).toBe(5000 + 200 * 12 * 3);
  });

  it('higher compounding frequency yields a strictly higher balance for the same nominal rate', () => {
    const annual = calculateCompoundInterest({ initial: 10000, monthly: 0, rate: 10, years: 10, compoundFrequency: 1 });
    const monthly = calculateCompoundInterest({ initial: 10000, monthly: 0, rate: 10, years: 10, compoundFrequency: 12 });
    const daily = calculateCompoundInterest({ initial: 10000, monthly: 0, rate: 10, years: 10, compoundFrequency: 365 });
    expect(monthly.finalBalance).toBeGreaterThan(annual.finalBalance);
    expect(daily.finalBalance).toBeGreaterThan(monthly.finalBalance);
  });
});

describe('calculateCompoundInterest -- flat tax', () => {
  it('applies no tax when wrapper is true and no caps are breached', () => {
    const r = calculateCompoundInterest({ initial: 0, monthly: 500, rate: 8, years: 5, taxRate: 30, wrapper: true });
    expect(r.yearlyData.every(y => y.taxPaid === 0)).toBe(true);
    expect(r.yearlyData.every(y => y.sheltered)).toBe(true);
  });

  it('taxes every year when wrapper is false', () => {
    const r = calculateCompoundInterest({ initial: 0, monthly: 500, rate: 8, years: 5, taxRate: 30, wrapper: false });
    expect(r.yearlyData.every(y => y.taxPaid > 0)).toBe(true);
    expect(r.wrapperCapExceeded).toBe(false);
  });

  it('a wrapped taxable account ends with a lower balance than a sheltered one, all else equal', () => {
    const base = { initial: 0, monthly: 500, rate: 8, years: 15, taxRate: 25 };
    const taxable = calculateCompoundInterest({ ...base, wrapper: false });
    const sheltered = calculateCompoundInterest({ ...base, wrapper: true });
    expect(sheltered.finalBalance).toBeGreaterThan(taxable.finalBalance);
  });
});

describe('calculateCompoundInterest -- wrapper contribution caps', () => {
  it('breaches the annual cap when monthly contributions alone exceed it', () => {
    const r = calculateCompoundInterest({
      initial: 0, monthly: 5000, rate: 8, years: 3, taxRate: 30, wrapper: true, annualWrapperLimit: 46000
    });
    // monthly*12 = 60000 > 46000 every year
    expect(r.wrapperCapExceeded).toBe(true);
    expect(r.yearlyData.every(y => !y.sheltered)).toBe(true);
  });

  it('stays sheltered when contributions are safely under both caps', () => {
    const r = calculateCompoundInterest({
      initial: 0, monthly: 1000, rate: 8, years: 3, taxRate: 30, wrapper: true,
      annualWrapperLimit: 46000, lifetimeWrapperLimit: 500000
    });
    expect(r.wrapperCapExceeded).toBe(false);
    expect(r.yearlyData.every(y => y.sheltered)).toBe(true);
  });

  it('counts a large initial lump sum toward year 1\'s annual cap, not just ongoing monthly contributions', () => {
    const r = calculateCompoundInterest({
      initial: 100000, monthly: 0, rate: 8, years: 3, taxRate: 30, wrapper: true, annualWrapperLimit: 46000
    });
    expect(r.wrapperCapExceeded).toBe(true);
    expect(r.yearlyData[0].sheltered).toBe(false);
  });

  it('breaches the lifetime cap once cumulative contributions cross it, and it stays breached', () => {
    const r = calculateCompoundInterest({
      initial: 0, monthly: 4000, rate: 8, years: 12, taxRate: 30, wrapper: true, lifetimeWrapperLimit: 200000
    });
    const firstBreachIdx = r.yearlyData.findIndex(y => !y.sheltered);
    expect(firstBreachIdx).toBeGreaterThan(-1);
    // Once breached, every subsequent year stays breached (contributions only accumulate).
    expect(r.yearlyData.slice(firstBreachIdx).every(y => !y.sheltered)).toBe(true);
  });
});

describe('calculateCompoundInterest -- contribution escalation', () => {
  it('with 0% escalation, every year deposits the same amount (matches no-escalation behavior)', () => {
    const withZero = calculateCompoundInterest({ initial: 0, monthly: 500, rate: 7, years: 10, contributionIncreaseRate: 0 });
    const omitted = calculateCompoundInterest({ initial: 0, monthly: 500, rate: 7, years: 10 });
    expect(withZero.finalBalance).toBe(omitted.finalBalance);
  });

  it('a positive escalation rate increases total deposited and final balance vs. flat contributions', () => {
    const flat = calculateCompoundInterest({ initial: 0, monthly: 500, rate: 7, years: 10 });
    const escalating = calculateCompoundInterest({ initial: 0, monthly: 500, rate: 7, years: 10, contributionIncreaseRate: 5 });
    expect(escalating.totalDeposited).toBeGreaterThan(flat.totalDeposited);
    expect(escalating.finalBalance).toBeGreaterThan(flat.finalBalance);
    // Year 1 should be identical (escalation only kicks in from year 2 onward).
    expect(escalating.yearlyData[0].deposited).toBe(flat.yearlyData[0].deposited);
  });
});

describe('calculateCompoundInterest -- lump sums', () => {
  it('adds a one-off lump sum to the correct year\'s deposited total', () => {
    const r = calculateCompoundInterest({ initial: 0, monthly: 100, rate: 6, years: 5, lumpSums: [{ year: 3, amount: 5000 }] });
    expect(r.yearlyData[1].deposited).toBe(2400); // year 2, unaffected
    expect(r.yearlyData[2].deposited).toBe(2400 + 1200 + 5000); // year 3, lump sum lands here
  });

  it('a lump sum large enough to breach the annual cap only affects its own year', () => {
    const r = calculateCompoundInterest({
      initial: 0, monthly: 100, rate: 6, years: 5, wrapper: true, annualWrapperLimit: 46000, taxRate: 30,
      lumpSums: [{ year: 3, amount: 60000 }]
    });
    expect(r.yearlyData[2].sheltered).toBe(false); // year 3
    expect(r.yearlyData[0].sheltered).toBe(true);  // year 1
    expect(r.yearlyData[3].sheltered).toBe(true);  // year 4 -- annual cap re-opens
  });
});

describe('taxOwedAtBrackets -- progressive tax', () => {
  const brackets = [
    { upTo: 10000, rate: 10 },
    { upTo: 40000, rate: 20 },
    { upTo: null, rate: 30 }
  ];

  it('taxes income within the bottom bracket at the bottom rate only', () => {
    expect(taxOwedAtBrackets(5000, brackets)).toBe(500);
  });

  it('taxes each slice of income at its own bracket rate, not the top rate on everything', () => {
    // 10000 @ 10% + 5000 @ 20% = 1000 + 1000 = 2000
    expect(taxOwedAtBrackets(15000, brackets)).toBe(2000);
  });

  it('handles the unbounded top bracket', () => {
    // 10000@10% + 30000@20% + 10000@30% = 1000 + 6000 + 3000 = 10000
    expect(taxOwedAtBrackets(50000, brackets)).toBe(10000);
  });

  it('returns 0 for zero or negative income', () => {
    expect(taxOwedAtBrackets(0, brackets)).toBe(0);
    expect(taxOwedAtBrackets(-500, brackets)).toBe(0);
  });

  it('places a gain on top of other income at the correct marginal rate', () => {
    // A gain landing entirely within the top bracket should be taxed at exactly 30%.
    const marginalTax = taxOwedAtBrackets(500000 + 5000, brackets) - taxOwedAtBrackets(500000, brackets);
    expect(marginalTax).toBe(1500); // 5000 * 30%
  });
});

describe('calculateCompoundInterest -- progressive brackets integration', () => {
  const brackets = [
    { upTo: 48475, rate: 12 },
    { upTo: 103350, rate: 22 },
    { upTo: null, rate: 35 }
  ];

  it('a low earner ends up better off under progressive brackets than the flat-rate default', () => {
    const flat = calculateCompoundInterest({ initial: 0, monthly: 1000, rate: 7, years: 15, taxRate: 22 });
    const progressive = calculateCompoundInterest({ initial: 0, monthly: 1000, rate: 7, years: 15, taxBrackets: brackets, otherTaxableIncome: 20000 });
    expect(progressive.finalBalance).toBeGreaterThan(flat.finalBalance);
  });

  it('a high earner ends up worse off under progressive brackets than the flat-rate default', () => {
    const flat = calculateCompoundInterest({ initial: 0, monthly: 1000, rate: 7, years: 15, taxRate: 22 });
    const progressive = calculateCompoundInterest({ initial: 0, monthly: 1000, rate: 7, years: 15, taxBrackets: brackets, otherTaxableIncome: 500000 });
    expect(progressive.finalBalance).toBeLessThan(flat.finalBalance);
  });
});

describe('calculateCompoundInterest -- malformed input hardening', () => {
  it('never returns a non-finite finalBalance, even given NaN/garbage input', () => {
    const cases = [
      { initial: 1000, monthly: 100, rate: NaN, years: 10 },
      { initial: 1000, monthly: 100, rate: 8, years: NaN },
      { initial: 1000, monthly: 100, rate: 8, years: 5, compoundFrequency: 0 },
      { initial: 1000, monthly: 100, rate: 8, years: 5, compoundFrequency: NaN },
      { initial: 1000, monthly: 100, rate: 8, years: 5, lumpSums: 'not-an-array' },
      { initial: undefined, monthly: undefined, rate: undefined, years: 5 }
    ];
    for (const input of cases) {
      const r = calculateCompoundInterest(input);
      expect(Number.isFinite(r.finalBalance)).toBe(true);
      expect(Number.isFinite(r.totalDeposited)).toBe(true);
      expect(Number.isFinite(r.totalInterest)).toBe(true);
    }
  });

  it('does not change behavior for already-valid input', () => {
    const r = calculateCompoundInterest({ initial: 1000, monthly: 500, rate: 7, years: 10 });
    expect(r.finalBalance).toBe(88552);
  });

  it('clamps a negative years value to 0 instead of throwing or looping backward', () => {
    const r = calculateCompoundInterest({ initial: 1000, monthly: 100, rate: 8, years: -5 });
    expect(r.finalBalance).toBe(1000);
    expect(r.yearlyData).toHaveLength(0);
  });

  it('a down year generates no negative "tax" that would beat a sheltered account', () => {
    const base = { initial: 100000, monthly: 0, rate: -8, years: 5, taxRate: 30 };
    const taxable = calculateCompoundInterest({ ...base, wrapper: false });
    const sheltered = calculateCompoundInterest({ ...base, wrapper: true });
    // No gain -> no tax either way, so a sustained loss can't leave the taxable
    // account ahead of the sheltered one via a phantom loss refund.
    expect(taxable.yearlyData.every(y => y.taxPaid === 0)).toBe(true);
    expect(taxable.finalBalance).toBe(sheltered.finalBalance);
    expect(taxable.finalBalance).toBeLessThan(100000);
  });

  it('an inflation input at or below -100% still yields a finite real value', () => {
    const r = calculateCompoundInterest({ initial: 1000, monthly: 100, rate: 6, years: 10, inflation: -150 });
    expect(r.yearlyData.every(y => Number.isFinite(y.realValue))).toBe(true);
    expect(r.yearlyData.every(y => y.realValue >= 0)).toBe(true);
  });
});
