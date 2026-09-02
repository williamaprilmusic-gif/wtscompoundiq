// src/realReturn.test.js
import { describe, it, expect } from 'vitest';
import { realReturn } from './realReturn.js';

describe('realReturn', () => {
  it('applies tax to the nominal return first', () => {
    const r = realReturn({ nominalRate: 10, inflationRate: 0, taxRate: 30 });
    expect(r.afterTaxNominal).toBeCloseTo(7, 5);
    expect(r.realRate).toBeCloseTo(7, 5); // no inflation
  });

  it('uses the exact (1+n)/(1+i)-1 identity, not the rough subtraction', () => {
    const r = realReturn({ nominalRate: 8, inflationRate: 5, taxRate: 0 });
    expect(r.realRate).toBeCloseTo((1.08 / 1.05 - 1) * 100, 6);
    expect(r.roughApprox).toBeCloseTo(3, 6); // 8 - 5
    expect(r.realRate).toBeLessThan(r.roughApprox); // exact is always a touch lower
  });

  it('flags a real loss when after-tax return trails inflation', () => {
    const r = realReturn({ nominalRate: 5, inflationRate: 6, taxRate: 20 });
    expect(r.afterTaxNominal).toBeCloseTo(4, 5);
    expect(r.realRate).toBeLessThan(0);
    expect(r.losesToInflation).toBe(true);
  });

  it('clamps a tax rate above 100', () => {
    const r = realReturn({ nominalRate: 10, inflationRate: 0, taxRate: 250 });
    expect(r.afterTaxNominal).toBe(0);
  });

  it('does not blow up on a -100% inflation edge', () => {
    const r = realReturn({ nominalRate: 8, inflationRate: -100, taxRate: 0 });
    expect(Number.isFinite(r.realRate)).toBe(true);
  });
});
