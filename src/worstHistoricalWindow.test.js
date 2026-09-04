// src/worstHistoricalWindow.test.js
import { describe, it, expect } from 'vitest';
import { worstHistoricalWindow, projectThroughSequence } from './worstHistoricalWindow.js';

describe('worstHistoricalWindow', () => {
  const series = [10, -30, -20, 25, 8, 12, -10, 15, 5, 20]; // years 1..3 are the bad stretch

  it('finds the contiguous window with the lowest compounded multiple', () => {
    const w = worstHistoricalWindow(series, 3);
    expect(w.startIndex).toBe(0); // [10, -30, -20]
    const expected = 1.1 * 0.7 * 0.8;
    expect(w.growthMultiple).toBeCloseTo(expected, 6);
    expect(w.windowYears).toBe(3);
  });

  it('annualises the window return', () => {
    const w = worstHistoricalWindow(series, 3);
    expect(w.annualisedReturnPct).toBeCloseTo((Math.pow(w.growthMultiple, 1 / 3) - 1) * 100, 6);
    expect(w.annualisedReturnPct).toBeLessThan(0);
  });

  it('returns null when the window is longer than the data', () => {
    expect(worstHistoricalWindow(series, 20)).toBeNull();
    expect(worstHistoricalWindow([], 3)).toBeNull();
  });

  it('a single-year window is just the worst single year', () => {
    expect(worstHistoricalWindow(series, 1).growthMultiple).toBeCloseTo(0.7, 6); // the -30 year
  });
});

describe('projectThroughSequence', () => {
  it('applies contributions then growth for each year in order', () => {
    const r = projectThroughSequence({ initial: 100000, monthly: 1000, returnsPct: [10, -10] });
    // y1: (100000 + 12000) * 1.1 = 123200 ; y2: (123200 + 12000) * 0.9 = 121680
    expect(r.finalBalance).toBeCloseTo(121680, 4);
    expect(r.totalContributed).toBeCloseTo(124000, 6);
  });

  it('handles an empty return sequence', () => {
    const r = projectThroughSequence({ initial: 5000, monthly: 0, returnsPct: [] });
    expect(r.finalBalance).toBe(5000);
  });
});
