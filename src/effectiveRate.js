// src/effectiveRate.js
// Nominal vs effective annual rate. A rate quoted "per year, compounded monthly" earns
// (or costs) more than its face value once the intra-year compounding is counted; this
// converts between the two in both directions.
export const nominalToEffective = ({ nominalRate, periodsPerYear }) => {
  const n = Math.max(1, Math.round(periodsPerYear || 1));
  const r = (nominalRate || 0) / 100;
  return (Math.pow(1 + r / n, n) - 1) * 100;
};

export const effectiveToNominal = ({ effectiveRate, periodsPerYear }) => {
  const n = Math.max(1, Math.round(periodsPerYear || 1));
  const e = (effectiveRate || 0) / 100;
  return (Math.pow(1 + e, 1 / n) - 1) * n * 100;
};
