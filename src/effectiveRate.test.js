// src/effectiveRate.test.js
import { describe, it, expect } from 'vitest';
import { nominalToEffective, effectiveToNominal } from './effectiveRate.js';

describe('nominalToEffective', () => {
  it('12% nominal compounded monthly is ~12.68% effective', () => {
    expect(nominalToEffective({ nominalRate: 12, periodsPerYear: 12 })).toBeCloseTo(12.6825, 3);
  });

  it('annual compounding leaves the rate unchanged', () => {
    expect(nominalToEffective({ nominalRate: 9, periodsPerYear: 1 })).toBeCloseTo(9, 6);
  });

  it('more frequent compounding gives a higher effective rate', () => {
    const monthly = nominalToEffective({ nominalRate: 10, periodsPerYear: 12 });
    const daily = nominalToEffective({ nominalRate: 10, periodsPerYear: 365 });
    expect(daily).toBeGreaterThan(monthly);
  });
});

describe('effectiveToNominal', () => {
  it('is the inverse of nominalToEffective', () => {
    const eff = nominalToEffective({ nominalRate: 15, periodsPerYear: 12 });
    expect(effectiveToNominal({ effectiveRate: eff, periodsPerYear: 12 })).toBeCloseTo(15, 6);
  });

  it('clamps periodsPerYear to at least 1', () => {
    expect(effectiveToNominal({ effectiveRate: 10, periodsPerYear: 0 })).toBeCloseTo(10, 6);
  });
});
