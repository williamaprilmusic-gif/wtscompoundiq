// src/pretaxRetirement.js
// The case for a pre-tax retirement contribution: the money goes in before tax, so
// the contribution costs less than its face value out of pocket (you get your marginal
// rate back as a refund), and the full amount compounds instead of just the after-tax
// remainder. This compares that against investing the same *net* out-of-pocket cost in
// an ordinary taxable account. Reuses the app's compounding engine for both pots.
//
// Simplification: it does NOT model tax on the pre-tax pot when it's eventually drawn
// down in retirement -- most systems tax those withdrawals, often at a lower effective
// rate than working-life income. Treat the advantage figure as the deferral-plus-full-
// compounding benefit before that, not a final after-everything number.
import { calculateCompoundInterest } from './engine';

export const pretaxRetirementBoost = ({ monthlyContribution, marginalTaxRate, years, returnRate, taxableReturnTaxRate }) => {
  const gross = Math.max(0, monthlyContribution || 0);
  const mRate = Math.max(0, Math.min(marginalTaxRate || 0, 100)) / 100;
  const netCost = gross * (1 - mRate);       // real out-of-pocket cost per month
  const annualRefund = gross * 12 * mRate;   // tax back for a full year of contributions

  const pretaxPot = calculateCompoundInterest({
    initial: 0, monthly: gross, rate: returnRate || 0, years: years || 0,
    inflation: 0, taxRate: 0, wrapper: true, compoundFrequency: 12
  }).finalBalance;

  const taxablePot = calculateCompoundInterest({
    initial: 0, monthly: netCost, rate: returnRate || 0, years: years || 0,
    inflation: 0, taxRate: taxableReturnTaxRate != null ? taxableReturnTaxRate : (marginalTaxRate || 0),
    wrapper: false, compoundFrequency: 12
  }).finalBalance;

  return { netCost, annualRefund, pretaxPot, taxablePot, advantage: pretaxPot - taxablePot };
};
