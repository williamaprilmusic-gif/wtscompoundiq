// src/salaryCalculator.js
// Pure math backing PowerTools.jsx's Salary / Take-Home Pay Calculator. Reuses
// engine.js's taxOwedAtBrackets for the handful of countries with progressive personal
// brackets (see data/countries.js's taxBrackets) -- every other country falls back to
// its flat country.taxRate, the same split App.jsx's progressiveTax toggle already uses.
import { taxOwedAtBrackets } from './engine';

export const calculateTakeHomePay = ({ grossAnnual, taxRate, taxBrackets }) => {
  const safeGross = Math.max(0, grossAnnual || 0);
  const tax = (taxBrackets && taxBrackets.length)
    ? taxOwedAtBrackets(safeGross, taxBrackets)
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
