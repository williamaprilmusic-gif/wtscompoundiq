// src/projectionMilestones.test.js
import { describe, it, expect } from 'vitest';
import { projectionMilestones } from './projectionMilestones.js';

// balance roughly doubling every ~9 years from 60k
const YEARLY = [
  { year: 1, balance: 70000 },
  { year: 5, balance: 130000 },
  { year: 10, balance: 300000 },
  { year: 15, balance: 620000 },
  { year: 20, balance: 1200000 },
  { year: 25, balance: 2800000 }
];

describe('projectionMilestones', () => {
  it('reports the first year each ZAR threshold is crossed (za currency)', () => {
    const m = projectionMilestones(YEARLY, 'za', 10);
    const byAmount = Object.fromEntries(m.map(x => [x.thresholdZar, x.year]));
    expect(byAmount[100000]).toBe(5);
    expect(byAmount[250000]).toBe(10);
    expect(byAmount[500000]).toBe(15);
    expect(byAmount[1000000]).toBe(20);
    expect(byAmount[2500000]).toBe(25);
  });

  it('skips thresholds the projection never reaches', () => {
    const m = projectionMilestones(YEARLY, 'za', 10);
    expect(m.some(x => x.thresholdZar === 5000000)).toBe(false);
  });

  it('keeps only the largest few when many are crossed', () => {
    const m = projectionMilestones(YEARLY, 'za', 2);
    expect(m).toHaveLength(2);
    expect(m[0].thresholdZar).toBe(1000000);
    expect(m[1].thresholdZar).toBe(2500000);
  });

  it('returns [] for empty or missing data', () => {
    expect(projectionMilestones([], 'za')).toEqual([]);
    expect(projectionMilestones(null, 'za')).toEqual([]);
  });
});
