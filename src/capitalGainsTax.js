// src/capitalGainsTax.js
// South African Capital Gains Tax, individual taxpayer: the gain on disposal (proceeds
// minus base cost) less the annual exclusion, times the inclusion rate, becomes
// "taxable capital gain" that's added to your other taxable income for the year and
// taxed at your marginal rate -- not a separate flat CGT rate the way some countries
// have. Reuses engine.js's bracket maths so the marginal slice is correct.
import { taxOwedAtBrackets } from './engine';

// 2026/27 individual figures (indicative, same "drifts out of date" caveat as the rest
// of the app's SA tax data).
export const CGT_ANNUAL_EXCLUSION = 40000;
export const CGT_INCLUSION_RATE_INDIVIDUAL = 40; // %

export const estimateCapitalGainsTax = ({
  proceeds, baseCost, otherTaxableIncome = 0, taxRate = 0, taxBrackets = null,
  annualExclusion = CGT_ANNUAL_EXCLUSION, inclusionRatePct = CGT_INCLUSION_RATE_INDIVIDUAL
}) => {
  const grossGain = Math.max(0, (proceeds || 0) - (baseCost || 0));
  const exclusion = Math.max(0, annualExclusion || 0);
  const gainAfterExclusion = Math.max(0, grossGain - exclusion);
  const inclusionRate = Math.max(0, Math.min(100, inclusionRatePct || 0)) / 100;
  const taxableCapitalGain = gainAfterExclusion * inclusionRate;

  const income = Math.max(0, otherTaxableIncome || 0);
  let taxOnGain;
  let marginalRatePct;
  if (taxBrackets && taxBrackets.length) {
    taxOnGain = taxOwedAtBrackets(income + taxableCapitalGain, taxBrackets) - taxOwedAtBrackets(income, taxBrackets);
    const step = 100;
    marginalRatePct = taxableCapitalGain > 0
      ? ((taxOwedAtBrackets(income + taxableCapitalGain + step, taxBrackets) - taxOwedAtBrackets(income + taxableCapitalGain, taxBrackets)) / step) * 100
      : 0;
  } else {
    marginalRatePct = Math.max(0, taxRate);
    taxOnGain = taxableCapitalGain * (marginalRatePct / 100);
  }
  taxOnGain = Math.max(0, taxOnGain);

  return {
    grossGain,
    gainAfterExclusion,
    taxableCapitalGain,
    taxOnGain,
    netProceeds: Math.max(0, (proceeds || 0) - taxOnGain),
    // The tax expressed as a % of the raw gain -- the figure people actually reason
    // about ("I lost X% of my profit to CGT"), distinct from the marginal income-tax rate.
    effectiveRateOnGainPct: grossGain > 0 ? (taxOnGain / grossGain) * 100 : 0,
    marginalRatePct
  };
};
