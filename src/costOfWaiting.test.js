// src/costOfWaiting.test.js
import { describe, it, expect } from 'vitest';
import { costOfWaiting } from './costOfWaiting.js';
import { calculateCompoundInterest } from './engine.js';

const plan = { initial: 10000, monthly: 2000, rate: 8, inflation: 0, taxRate: 0, wrapper: false, compoundFrequency: 12, contributionIncreaseRate: 0, lumpSums: [] };

describe('costOfWaiting', () => {
  it('starting now beats starting later, and the cost is the gap', () => {
    const r = costOfWaiting({ ...plan, years: 30, delayYears: 5 });
    expect(r.startNowBalance).toBeGreaterThan(r.startLaterBalance);
    expect(r.cost).toBeCloseTo(r.startNowBalance - r.startLaterBalance, 2);
    expect(r.delayYears).toBe(5);
  });

  it('the "start later" figure matches the engine run with fewer years', () => {
    const r = costOfWaiting({ ...plan, years: 25, delayYears: 7 });
    const expected = calculateCompoundInterest({ ...plan, years: 18 }).finalBalance;
    expect(r.startLaterBalance).toBeCloseTo(expected, 2);
  });

  it('threads progressive brackets through so "start now" equals the full engine result', () => {
    const taxBrackets = [{ upTo: 250000, rate: 18 }, { upTo: null, rate: 31 }];
    const args = { ...plan, taxBrackets, otherTaxableIncome: 400000, years: 30, delayYears: 5 };
    const r = costOfWaiting(args);
    const full = calculateCompoundInterest({ ...args }).finalBalance;
    expect(r.startNowBalance).toBeCloseTo(full, 2);
    // and it actually differs from the flat-rate run (proves the brackets took effect)
    const flat = calculateCompoundInterest({ ...plan, years: 30 }).finalBalance;
    expect(r.startNowBalance).not.toBeCloseTo(flat, 0);
  });

  it('a longer delay costs more', () => {
    const short = costOfWaiting({ ...plan, years: 30, delayYears: 3 });
    const long = costOfWaiting({ ...plan, years: 30, delayYears: 10 });
    expect(long.cost).toBeGreaterThan(short.cost);
  });

  it('a 0-year delay costs nothing', () => {
    const r = costOfWaiting({ ...plan, years: 20, delayYears: 0 });
    expect(r.cost).toBeCloseTo(0, 2);
  });

  it('caps the delay at the plan length (never a negative-year run)', () => {
    const r = costOfWaiting({ ...plan, years: 5, delayYears: 40 });
    expect(r.delayYears).toBe(5);
    expect(r.startLaterBalance).toBeCloseTo(calculateCompoundInterest({ ...plan, years: 0 }).finalBalance, 2);
  });
});
