// src/effectiveRate.js
// Nominal vs effective annual rate. A rate quoted "per year, compounded monthly" earns
// (or costs) more than its face value once the intra-year compounding is counted; this
// converts between the two in both directions.
// Keep the compounding base positive -- a rate at or below -100% has no real n-th root
// and isn't a meaningful quote anyway.
const floorRate = (pct) => Math.max(-99.99, pct || 0);

export const nominalToEffective = ({ nominalRate, periodsPerYear }) => {
  const n = Math.max(1, Math.round(periodsPerYear || 1));
  const r = floorRate(nominalRate) / 100;
  return (Math.pow(1 + r / n, n) - 1) * 100;
};

export const effectiveToNominal = ({ effectiveRate, periodsPerYear }) => {
  const n = Math.max(1, Math.round(periodsPerYear || 1));
  const e = floorRate(effectiveRate) / 100;
  return (Math.pow(1 + e, 1 / n) - 1) * n * 100;
};
