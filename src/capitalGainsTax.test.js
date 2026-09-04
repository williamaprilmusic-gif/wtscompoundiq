// src/capitalGainsTax.test.js
import { describe, it, expect } from 'vitest';
import { estimateCapitalGainsTax, estimateLossHarvestingSaving, CGT_ANNUAL_EXCLUSION, CGT_INCLUSION_RATE_INDIVIDUAL } from './capitalGainsTax.js';

const BRACKETS = [
  { upTo: 240000, rate: 18 },
  { upTo: 370000, rate: 26 },
  { upTo: 510000, rate: 31 },
  { upTo: 740000, rate: 36 },
  { upTo: null, rate: 39 }
];

describe('estimateCapitalGainsTax', () => {
  it('applies the annual exclusion before the inclusion rate', () => {
    const r = estimateCapitalGainsTax({ proceeds: 500000, baseCost: 300000, taxRate: 39 });
    expect(r.grossGain).toBe(200000);
    expect(r.gainAfterExclusion).toBe(200000 - CGT_ANNUAL_EXCLUSION);
    expect(r.taxableCapitalGain).toBeCloseTo((200000 - CGT_ANNUAL_EXCLUSION) * (CGT_INCLUSION_RATE_INDIVIDUAL / 100), 6);
  });

  it('a gain fully inside the annual exclusion owes no tax', () => {
    const r = estimateCapitalGainsTax({ proceeds: 335000, baseCost: 300000, taxRate: 39 });
    expect(r.grossGain).toBe(35000);
    expect(r.gainAfterExclusion).toBe(0);
    expect(r.taxOnGain).toBe(0);
  });

  it('flat rate: tax is the taxable capital gain times the marginal rate', () => {
    const r = estimateCapitalGainsTax({ proceeds: 1000000, baseCost: 600000, taxRate: 45 });
    const expectedTaxable = (400000 - CGT_ANNUAL_EXCLUSION) * 0.4;
    expect(r.taxOnGain).toBeCloseTo(expectedTaxable * 0.45, 4);
    expect(r.marginalRatePct).toBe(45);
  });

  it('progressive brackets: the taxable gain stacks on other income', () => {
    const r = estimateCapitalGainsTax({ proceeds: 900000, baseCost: 500000, otherTaxableIncome: 500000, taxBrackets: BRACKETS });
    // taxable gain = (400000 - 40000) * 0.4 = 144000, stacked on 500000 of other income
    expect(r.taxableCapitalGain).toBeCloseTo(144000, 6);
    expect(r.marginalRatePct).toBeGreaterThanOrEqual(36);
  });

  it('a loss (proceeds below base cost) has no gain and no tax', () => {
    const r = estimateCapitalGainsTax({ proceeds: 200000, baseCost: 300000, taxRate: 39 });
    expect(r.grossGain).toBe(0);
    expect(r.taxOnGain).toBe(0);
    expect(r.netProceeds).toBe(200000);
  });

  it('effectiveRateOnGainPct is well below the marginal rate thanks to the exclusion + inclusion rate', () => {
    const r = estimateCapitalGainsTax({ proceeds: 500000, baseCost: 400000, taxRate: 45 });
    expect(r.effectiveRateOnGainPct).toBeLessThan(45);
    expect(r.effectiveRateOnGainPct).toBeGreaterThan(0);
  });
});

describe('estimateLossHarvestingSaving', () => {
  it('applies the inclusion rate then the marginal rate to a realised loss', () => {
    const r = estimateLossHarvestingSaving({ lossAmount: 100000, marginalRatePct: 45 });
    expect(r.taxableGainOffset).toBeCloseTo(100000 * (CGT_INCLUSION_RATE_INDIVIDUAL / 100), 6);
    expect(r.taxSaved).toBeCloseTo(r.taxableGainOffset * 0.45, 6);
  });

  it('does NOT apply the annual exclusion (that would double-count against the offset gain)', () => {
    const small = estimateLossHarvestingSaving({ lossAmount: 10000, marginalRatePct: 45 });
    expect(small.taxSaved).toBeGreaterThan(0);
    expect(small.taxableGainOffset).toBeCloseTo(10000 * (CGT_INCLUSION_RATE_INDIVIDUAL / 100), 6);
  });

  it('a zero loss saves nothing', () => {
    expect(estimateLossHarvestingSaving({ lossAmount: 0, marginalRatePct: 45 }).taxSaved).toBe(0);
  });

  it('clamps a negative loss or an out-of-range rate rather than producing nonsense', () => {
    const r = estimateLossHarvestingSaving({ lossAmount: -5000, marginalRatePct: 150 });
    expect(r.taxableGainOffset).toBeGreaterThanOrEqual(0);
    expect(r.taxSaved).toBeGreaterThanOrEqual(0);
  });
});
