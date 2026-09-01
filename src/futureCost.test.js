// src/futureCost.test.js
import { describe, it, expect } from 'vitest';
import { projectFutureCost, projectPurchasingPower } from './futureCost.js';

describe('projectFutureCost', () => {
  it('compounds a today\'s-cost figure forward at the inflation rate', () => {
    const result = projectFutureCost({ currentCost: 1000, years: 10, inflationRate: 6 });
    expect(result.futureCost).toBeCloseTo(1000 * Math.pow(1.06, 10), 5);
    expect(result.totalIncrease).toBeCloseTo(result.futureCost - 1000, 5);
  });

  it('is a no-op at 0 years or 0% inflation', () => {
    expect(projectFutureCost({ currentCost: 500, years: 0, inflationRate: 6 }).futureCost).toBeCloseTo(500, 5);
    expect(projectFutureCost({ currentCost: 500, years: 20, inflationRate: 0 }).futureCost).toBeCloseTo(500, 5);
  });

  it('clamps a negative cost or years to 0 rather than an invalid result', () => {
    expect(projectFutureCost({ currentCost: -100, years: 5, inflationRate: 5 }).currentCost).toBe(0);
    expect(projectFutureCost({ currentCost: 100, years: -5, inflationRate: 5 }).futureCost).toBeCloseTo(100, 5);
  });

  it('percentIncrease is 0 (not NaN) when currentCost is 0', () => {
    expect(projectFutureCost({ currentCost: 0, years: 10, inflationRate: 6 }).percentIncrease).toBe(0);
  });
});

describe('projectPurchasingPower', () => {
  it('is the exact inverse of projectFutureCost at the same rate', () => {
    const inflated = projectFutureCost({ currentCost: 1000, years: 10, inflationRate: 6 }).futureCost;
    const eroded = projectPurchasingPower({ currentAmount: inflated, years: 10, inflationRate: 6 }).realValue;
    expect(eroded).toBeCloseTo(1000, 5);
  });

  it('real value shrinks as years or inflation increase', () => {
    const short = projectPurchasingPower({ currentAmount: 10000, years: 5, inflationRate: 6 }).realValue;
    const long = projectPurchasingPower({ currentAmount: 10000, years: 20, inflationRate: 6 }).realValue;
    expect(long).toBeLessThan(short);
  });

  it('percentLost is 0 (not NaN) when currentAmount is 0', () => {
    expect(projectPurchasingPower({ currentAmount: 0, years: 10, inflationRate: 6 }).percentLost).toBe(0);
  });
});
