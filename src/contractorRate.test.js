// src/contractorRate.test.js
import { describe, it, expect } from 'vitest';
import { contractorRate } from './contractorRate.js';

describe('contractorRate', () => {
  it('grosses up the take-home for tax before dividing into billable hours', () => {
    const r = contractorRate({
      targetAnnualTakeHome: 600000, taxRatePct: 25, benefitsLoadingPct: 0,
      billableWeeksPerYear: 46, billableHoursPerWeek: 40, utilisationPct: 100
    });
    expect(r.grossRevenueNeeded).toBeCloseTo(600000 / 0.75, 4); // 800,000
    expect(r.billableHoursPerYear).toBeCloseTo(46 * 40, 6);
    expect(r.hourlyRate).toBeCloseTo(800000 / 1840, 4);
  });

  it('low utilisation and fewer billable weeks push the rate up', () => {
    const base = { targetAnnualTakeHome: 500000, taxRatePct: 20 };
    const busy = contractorRate({ ...base, billableWeeksPerYear: 48, utilisationPct: 95 });
    const patchy = contractorRate({ ...base, billableWeeksPerYear: 40, utilisationPct: 60 });
    expect(patchy.hourlyRate).toBeGreaterThan(busy.hourlyRate);
  });

  it('benefits loading adds to the revenue target', () => {
    const noBenefits = contractorRate({ targetAnnualTakeHome: 500000, taxRatePct: 20, benefitsLoadingPct: 0 });
    const withBenefits = contractorRate({ targetAnnualTakeHome: 500000, taxRatePct: 20, benefitsLoadingPct: 15 });
    expect(withBenefits.grossRevenueNeeded).toBeGreaterThan(noBenefits.grossRevenueNeeded);
  });

  it('the billed rate is well above a naive salary/2080 figure', () => {
    const r = contractorRate({ targetAnnualTakeHome: 500000, taxRatePct: 25, benefitsLoadingPct: 10, utilisationPct: 75, billableWeeksPerYear: 44 });
    expect(r.upliftVsNaive).toBeGreaterThan(0.5); // at least +50%
  });

  it('reports a day rate as five to a billable week', () => {
    const r = contractorRate({ targetAnnualTakeHome: 480000, taxRatePct: 0, billableHoursPerWeek: 40, billableWeeksPerYear: 48, utilisationPct: 100 });
    expect(r.dailyRate).toBeCloseTo(r.hourlyRate * 8, 4);
  });
});
