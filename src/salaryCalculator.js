// src/salaryCalculator.js
// Pure math backing PowerTools.jsx's Salary / Take-Home Pay Calculator. Reuses
// engine.js's taxOwedAtBrackets for the handful of countries with progressive personal
// brackets (see data/countries.js's taxBrackets) -- every other country falls back to
// its flat country.taxRate, the same split App.jsx's progressiveTax toggle already uses.
import { taxOwedAtBrackets } from './engine';

export const calculateTakeHomePay = ({ grossAnnual, taxRate, taxBrackets, rebate = 0 }) => {
  const safeGross = Math.max(0, grossAnnual || 0);
  // Take-home pay reads a standalone total tax bill (not a difference of two totals),
  // so unlike most other taxOwedAtBrackets() callers this one does need the rebate to
  // show correctly -- see engine.js's note on why most callers can leave it at 0.
  const tax = (taxBrackets && taxBrackets.length)
    ? taxOwedAtBrackets(safeGross, taxBrackets, rebate)
    : safeGross * ((taxRate || 0) / 100);
  const netAnnual = Math.max(0, safeGross - tax);
  return {
    grossAnnual: safeGross,
    grossMonthly: safeGross / 12,
    tax,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveRate: safeGross > 0 ? (tax / safeGross) * 100 : 0
  };
};
