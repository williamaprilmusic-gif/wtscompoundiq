// src/effectiveRate.js
// Nominal vs effective annual rate. A rate quoted "per year, compounded monthly" earns
// (or costs) more than its face value once the intra-year compounding is counted; this
// converts between the two in both directions. floorRate keeps the compounding base
// positive -- a rate at or below -100% has no real n-th root anyway.
import { floorRate } from './utils/sanitize';

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
