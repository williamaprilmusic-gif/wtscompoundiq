// src/pretaxRetirement.test.js
import { describe, it, expect } from 'vitest';
import { pretaxRetirementBoost } from './pretaxRetirement.js';

describe('pretaxRetirementBoost', () => {
  it('net cost is the contribution less the marginal-rate refund', () => {
    const result = pretaxRetirementBoost({ monthlyContribution: 5000, marginalTaxRate: 40, years: 20, returnRate: 8 });
    expect(result.netCost).toBeCloseTo(3000, 5);        // 5000 * (1 - 0.40)
    expect(result.annualRefund).toBeCloseTo(24000, 5);  // 5000 * 12 * 0.40
  });

  it('the pre-tax pot beats investing the same net cost in a taxable account', () => {
    const result = pretaxRetirementBoost({ monthlyContribution: 5000, marginalTaxRate: 40, years: 25, returnRate: 8 });
    expect(result.pretaxPot).toBeGreaterThan(result.taxablePot);
    expect(result.advantage).toBeGreaterThan(0);
  });

  it('with a 0% marginal rate there is no refund and net cost equals the contribution', () => {
    const result = pretaxRetirementBoost({ monthlyContribution: 4000, marginalTaxRate: 0, years: 10, returnRate: 6 });
    expect(result.netCost).toBeCloseTo(4000, 5);
    expect(result.annualRefund).toBe(0);
  });

  it('honours an explicit taxableReturnTaxRate distinct from the marginal rate', () => {
    const highDrag = pretaxRetirementBoost({ monthlyContribution: 5000, marginalTaxRate: 40, years: 20, returnRate: 8, taxableReturnTaxRate: 40 });
    const lowDrag = pretaxRetirementBoost({ monthlyContribution: 5000, marginalTaxRate: 40, years: 20, returnRate: 8, taxableReturnTaxRate: 10 });
    expect(highDrag.taxablePot).toBeLessThan(lowDrag.taxablePot);
  });

  it('clamps a marginal rate above 100 and negative inputs', () => {
    const result = pretaxRetirementBoost({ monthlyContribution: -100, marginalTaxRate: 250, years: 10, returnRate: 5 });
    expect(result.netCost).toBe(0);
    expect(Number.isFinite(result.pretaxPot)).toBe(true);
  });
});
