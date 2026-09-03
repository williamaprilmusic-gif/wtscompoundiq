// src/raOptimizer.js
// Retirement-annuity contribution optimiser (South African rules). SA lets you deduct
// retirement-fund contributions up to 27.5% of the greater of taxable income or
// remuneration, capped at R350,000 a year. This works out how much more you could
// contribute to reach that ceiling and the income tax that extra contribution saves --
// i.e. the "free" portion of the contribution the fiscus effectively funds.
//
// Reuses engine.js's bracket maths; where a country has no brackets modelled it falls
// back to the flat rate, same split as the rest of the app. The 27.5% / R350k limits
// are SA-specific and passed in with defaults so other regimes can override them.
import { taxOwedAtBrackets } from './engine';

export const optimiseRaContribution = ({
  taxableIncome,
  currentAnnualContribution = 0,
  taxRate = 0,
  taxBrackets = null,
  deductiblePercent = 27.5,
  annualCap = 350000
}) => {
  const income = Math.max(0, taxableIncome || 0);
  const current = Math.max(0, currentAnnualContribution || 0);
  const pctLimit = income * (Math.max(0, deductiblePercent) / 100);
  const maxDeductible = Math.max(0, Math.min(pctLimit, Math.max(0, annualCap)));

  const roomRemaining = Math.max(0, maxDeductible - current);
  const alreadyOverLimit = current >= maxDeductible;

  // Tax saved by contributing the remaining room: the drop in tax from reducing
  // taxable income by `roomRemaining` (marginal, so it comes off your top slice).
  let taxSavingIfMaxed;
  if (taxBrackets && taxBrackets.length) {
    taxSavingIfMaxed = taxOwedAtBrackets(income - current, taxBrackets)
      - taxOwedAtBrackets(income - current - roomRemaining, taxBrackets);
  } else {
    taxSavingIfMaxed = roomRemaining * (Math.max(0, taxRate) / 100);
  }
  taxSavingIfMaxed = Math.max(0, taxSavingIfMaxed);

  // Effective marginal rate on that slice -- the share of the extra contribution the
  // tax refund covers, so the real out-of-pocket cost is the rest.
  const effectiveReliefPct = roomRemaining > 0 ? (taxSavingIfMaxed / roomRemaining) * 100 : 0;

  return {
    maxDeductible,
    roomRemaining,
    alreadyOverLimit,
    taxSavingIfMaxed,
    effectiveReliefPct,
    netCostIfMaxed: Math.max(0, roomRemaining - taxSavingIfMaxed),
    limitedBy: pctLimit <= annualCap ? 'percent' : 'cap'
  };
};
