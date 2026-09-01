// src/marginalTax.js
// At a given income: the marginal rate on the next rand earned, what the next slice of
// earnings actually keeps, and what a deductible contribution (retirement annuity,
// donation) saves this year. Uses engine.js's taxOwedAtBrackets for countries with
// real progressive brackets; a flat country rate is its own marginal rate.
import { taxOwedAtBrackets } from './engine';

export const marginalTaxAnalysis = ({ income, taxRate, taxBrackets, deltaEarned = 1000, deductionAmount = 0 }) => {
  const gross = Math.max(0, income || 0);
  const useBrackets = !!(taxBrackets && taxBrackets.length);
  const taxAt = (x) => useBrackets
    ? taxOwedAtBrackets(Math.max(0, x), taxBrackets)
    : Math.max(0, x) * ((taxRate || 0) / 100);

  const delta = Math.max(0, deltaEarned || 0);
  const extraTax = taxAt(gross + delta) - taxAt(gross);
  const marginalRate = delta > 0 ? (extraTax / delta) * 100 : (useBrackets ? 0 : (taxRate || 0));
  const keepsFromNext = delta - extraTax;

  const deduction = Math.max(0, Math.min(deductionAmount || 0, gross));
  const deductionTaxSaved = taxAt(gross) - taxAt(gross - deduction);

  return {
    totalTax: taxAt(gross),
    marginalRate,
    keepsFromNext,
    keepRate: delta > 0 ? (keepsFromNext / delta) * 100 : 0,
    deductionTaxSaved,
    deductionNetCost: deduction - deductionTaxSaved
  };
};
