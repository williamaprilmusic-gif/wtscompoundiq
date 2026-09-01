// src/ruleOf72.test.js
import { describe, it, expect } from 'vitest';
import { ruleOf72 } from './ruleOf72.js';

describe('ruleOf72', () => {
  it('gives the 72/rate approximation and a close exact figure', () => {
    const result = ruleOf72({ annualRate: 8, years: 0 });
    expect(result.approxDoublingYears).toBeCloseTo(9, 5); // 72 / 8
    expect(result.exactDoublingYears).toBeCloseTo(Math.log(2) / Math.log(1.08), 5);
    // The approximation is within a year of the exact answer at typical rates.
    expect(Math.abs(result.approxDoublingYears - result.exactDoublingYears)).toBeLessThan(1);
  });

  it('computes the growth multiple over a period', () => {
    const result = ruleOf72({ annualRate: 10, years: 20 });
    expect(result.growthMultiple).toBeCloseTo(Math.pow(1.1, 20), 5);
    expect(result.doublingsOverPeriod).toBeCloseTo(20 / result.exactDoublingYears, 5);
  });

  it('returns null doubling times for a non-positive rate (never doubles)', () => {
    const result = ruleOf72({ annualRate: 0, years: 10 });
    expect(result.approxDoublingYears).toBeNull();
    expect(result.exactDoublingYears).toBeNull();
    expect(result.growthMultiple).toBeCloseTo(1, 5);
  });

  it('clamps negative years to 0', () => {
    expect(ruleOf72({ annualRate: 7, years: -5 }).growthMultiple).toBeCloseTo(1, 5);
  });
});
