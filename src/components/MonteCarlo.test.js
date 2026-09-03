// src/components/MonteCarlo.test.js
// Covers runSimulation, the pure engine behind the Monte Carlo tab and its
// contribution solver. The component itself isn't exercised here -- only the maths.
import { describe, it, expect } from 'vitest';
import { runSimulation } from './MonteCarlo.jsx';

const base = {
  initial: 10000, monthly: 1000, rate: 8, years: 10, volatility: 15, goal: 200000
};

describe('runSimulation', () => {
  it('returns finite percentiles and a 0-100 probability', () => {
    const r = runSimulation(base);
    for (const k of ['p10', 'p25', 'p50', 'p75', 'p90', 'min', 'max']) {
      expect(Number.isFinite(r[k])).toBe(true);
    }
    expect(r.probabilityOfGoal).toBeGreaterThanOrEqual(0);
    expect(r.probabilityOfGoal).toBeLessThanOrEqual(100);
    expect(r.p90).toBeGreaterThanOrEqual(r.p10);
  });

  it('builds one percentile row per year plus year 0', () => {
    expect(runSimulation({ ...base, years: 10 }).yearlyPercentiles).toHaveLength(11);
  });

  it('floors a fractional years (e.g. from a ?y=20.5 share link) instead of throwing', () => {
    expect(() => runSimulation({ ...base, years: 20.5 })).not.toThrow();
    const r = runSimulation({ ...base, years: 20.5 });
    expect(r.yearlyPercentiles).toHaveLength(21); // floor(20.5) + 1
    expect(Number.isFinite(r.p50)).toBe(true);
  });

  it('treats a missing/zero years as a single starting-balance row', () => {
    const r = runSimulation({ ...base, years: 0 });
    expect(r.yearlyPercentiles).toHaveLength(1);
    expect(r.p50).toBe(base.initial);
  });

  it('a higher goal never yields a higher probability of reaching it', () => {
    const low = runSimulation({ ...base, goal: 50000, volatility: 0 }).probabilityOfGoal;
    const high = runSimulation({ ...base, goal: 5000000, volatility: 0 }).probabilityOfGoal;
    expect(high).toBeLessThanOrEqual(low);
  });
});
