// src/coastFire.test.js
import { describe, it, expect } from 'vitest';
import { computeCoastFire } from './coastFire.js';

describe('computeCoastFire', () => {
  it('flags hasCoasted when the current pot alone grows past the target', () => {
    // 100k at 7% for 30 years is ~761k, well past a 500k target.
    const result = computeCoastFire({ currentPortfolio: 100000, annualReturn: 7, yearsToRetirement: 30, fireNumber: 500000 });
    expect(result.hasCoasted).toBe(true);
    expect(result.surplusAtRetirement).toBeGreaterThan(0);
    expect(result.shortfallToday).toBe(0);
  });

  it('reports a shortfall today when the pot is too small to coast', () => {
    const result = computeCoastFire({ currentPortfolio: 10000, annualReturn: 6, yearsToRetirement: 20, fireNumber: 500000 });
    expect(result.hasCoasted).toBe(false);
    expect(result.shortfallToday).toBeGreaterThan(0);
    // coastNumber is the target discounted back at the same return, compounded monthly
    // to match projectedAtRetirement (which uses compoundFrequency: 12).
    expect(result.coastNumber).toBeCloseTo(500000 / Math.pow(1 + 0.06 / 12, 240), 2);
  });

  it('the discount and the projection use the same (monthly) compounding, so they reconcile', () => {
    // A pot exactly equal to coastNumber should project to ~the target.
    const r = computeCoastFire({ currentPortfolio: 0, annualReturn: 7, yearsToRetirement: 25, fireNumber: 1000000 });
    const atTheNumber = computeCoastFire({ currentPortfolio: r.coastNumber, annualReturn: 7, yearsToRetirement: 25, fireNumber: 1000000 });
    expect(atTheNumber.projectedAtRetirement).toBeCloseTo(1000000, -1); // within ~R10
  });

  it('never renders Infinity: an absurd near-total-loss rate over a long horizon returns Infinity, not NaN, and the UI guards it', () => {
    const result = computeCoastFire({ currentPortfolio: 1, annualReturn: -150, yearsToRetirement: 90, fireNumber: 1000000 });
    expect(Number.isFinite(result.projectedAtRetirement)).toBe(true);
    expect(result.coastNumber === Infinity || Number.isFinite(result.coastNumber)).toBe(true);
    expect(Number.isNaN(result.shortfallToday)).toBe(false);
  });

  it('coastNumber + shortfall reconcile: pot + shortfall == coastNumber when short', () => {
    const result = computeCoastFire({ currentPortfolio: 50000, annualReturn: 5, yearsToRetirement: 25, fireNumber: 800000 });
    expect(50000 + result.shortfallToday).toBeCloseTo(result.coastNumber, 2);
  });

  it('handles 0 years (coast number is just the target) and 0 target', () => {
    expect(computeCoastFire({ currentPortfolio: 1000, annualReturn: 7, yearsToRetirement: 0, fireNumber: 5000 }).coastNumber).toBeCloseTo(5000, 5);
    expect(computeCoastFire({ currentPortfolio: 1000, annualReturn: 7, yearsToRetirement: 10, fireNumber: 0 }).hasCoasted).toBe(false);
  });

  it('clamps a negative portfolio to 0', () => {
    const result = computeCoastFire({ currentPortfolio: -5000, annualReturn: 7, yearsToRetirement: 10, fireNumber: 100000 });
    expect(result.projectedAtRetirement).toBe(0);
  });
});
