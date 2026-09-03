// src/sequenceRisk.test.js
import { describe, it, expect } from 'vitest';
import { analyseSequenceRisk } from './sequenceRisk.js';

const BASE = {
  startingPot: 5000000,
  annualWithdrawal: 300000,
  retirementYears: 30,
  averageReturn: 7,
  badReturn: -8,
  badYears: 5,
  inflationPct: 5
};

describe('analyseSequenceRisk', () => {
  it('solves the good-year return so the arithmetic mean equals the target average', () => {
    const r = analyseSequenceRisk(BASE);
    const mean = (r.badYearReturn * BASE.badYears + r.goodYearReturn * (BASE.retirementYears - BASE.badYears)) / BASE.retirementYears;
    expect(mean).toBeCloseTo(BASE.averageReturn, 6);
  });

  it('bad years first depletes the pot no later than bad years last', () => {
    const r = analyseSequenceRisk(BASE);
    expect(r.earlyLosses.yearsLasted).toBeLessThanOrEqual(r.lateLosses.yearsLasted);
    expect(r.yearsGap).toBeGreaterThanOrEqual(0);
  });

  it('a punishing early sequence actually runs the pot dry within the horizon', () => {
    const r = analyseSequenceRisk({ ...BASE, startingPot: 3500000, annualWithdrawal: 320000, badReturn: -15, badYears: 6 });
    expect(r.earlyLosses.depleted).toBe(true);
    expect(r.earlyLosses.yearsLasted).toBeLessThan(BASE.retirementYears);
  });

  it('a comfortably funded pot survives both orderings', () => {
    const r = analyseSequenceRisk({ ...BASE, startingPot: 20000000, annualWithdrawal: 200000 });
    expect(r.bothSurvive).toBe(true);
    expect(r.earlyLosses.endingBalance).toBeGreaterThan(0);
  });

  it('clamps a silly horizon and bad-year count instead of looping forever', () => {
    const r = analyseSequenceRisk({ ...BASE, retirementYears: 999, badYears: 50 });
    expect(r.horizonYears).toBeLessThanOrEqual(100);
  });
});
