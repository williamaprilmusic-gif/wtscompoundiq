// src/fundFeeComparison.test.js
import { describe, it, expect } from 'vitest';
import { compareFundFees } from './fundFeeComparison.js';

const BASE = { initial: 50000, monthly: 3000, years: 30 };

describe('compareFundFees', () => {
  it('with equal gross return, the lower-TER fund wins', () => {
    const r = compareFundFees({
      ...BASE,
      fundA: { grossReturn: 9, ter: 0.5 },
      fundB: { grossReturn: 9, ter: 1.75 }
    });
    expect(r.winner).toBe('A');
    expect(r.a.finalBalance).toBeGreaterThan(r.b.finalBalance);
    expect(r.endingGap).toBeGreaterThan(0);
  });

  it('a small TER gap compounds into a large ending gap over 30 years', () => {
    const r = compareFundFees({
      ...BASE,
      fundA: { grossReturn: 8, ter: 0.2 },
      fundB: { grossReturn: 8, ter: 1.2 }
    });
    // 1% TER over 30y on this schedule is comfortably a six-figure gap.
    expect(r.endingGap).toBeGreaterThan(200000);
  });

  it('a higher-TER fund can still win if its gross return is enough higher', () => {
    const r = compareFundFees({
      ...BASE,
      fundA: { grossReturn: 7, ter: 0.3 },   // net 6.7
      fundB: { grossReturn: 9.5, ter: 1.5 }  // net 8.0
    });
    expect(r.winner).toBe('B');
  });

  it('reports each fund\'s own fee cost vs a zero-fee version of itself', () => {
    const r = compareFundFees({ ...BASE, fundA: { grossReturn: 9, ter: 1 }, fundB: { grossReturn: 9, ter: 0 } });
    expect(r.a.feeCost).toBeGreaterThan(0);
    expect(r.b.feeCost).toBeCloseTo(0, 0);
  });

  it('identical funds tie', () => {
    const r = compareFundFees({ ...BASE, fundA: { grossReturn: 8, ter: 0.9 }, fundB: { grossReturn: 8, ter: 0.9 } });
    expect(r.winner).toBe('tie');
    expect(r.endingGap).toBeLessThan(1);
  });
});
