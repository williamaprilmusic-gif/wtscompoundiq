// src/realReturn.js
// Strips the illusion out of a headline return: take tax off the gains, then divide out
// inflation, to get the return that actually grows purchasing power. Uses the exact
// (1 + after-tax) / (1 + inflation) - 1 identity, and also reports the rough
// "just subtract" approximation so the gap between them is visible.
import { clampPct } from './utils/sanitize';

export const realReturn = ({ nominalRate, inflationRate, taxRate = 0 }) => {
  const n = (nominalRate || 0) / 100;
  const i = (inflationRate || 0) / 100;
  const t = clampPct(taxRate) / 100;

  const afterTax = n * (1 - t);
  const denom = 1 + i;
  const real = denom > 0 ? ((1 + afterTax) / denom - 1) * 100 : ((afterTax - i) * 100);
  const roughApprox = (afterTax - i) * 100;

  return {
    afterTaxNominal: afterTax * 100,
    realRate: real,
    roughApprox,
    losesToInflation: real < 0
  };
};
