// src/retirementComparison.js
// Models a generic "retirement fund" wrapper -- distinct from the TFSA-style wrapper
// TaxOptimizer.jsx already compares (tax-free growth, but contributions are made from
// already-taxed income). A retirement fund (SA's RA/pension/provident funds, a
// traditional 401k/pension elsewhere) instead gives an upfront tax deduction on
// contributions, compounds tax-free during accumulation, and is taxed once on
// withdrawal. Real retirement contribution-deduction limits and withdrawal tax tables
// vary enormously by country and aren't modeled here (same "illustrative, not tax
// advice" spirit as the rest of this app's simplified country tax data) -- this uses
// the country's own flat taxRate for both legs by default, each independently editable.
import { calculateCompoundInterest } from './engine';

export const compareRetirementVehicle = ({
  initial, monthly, rate, years, inflation, compoundFrequency, contributionIncreaseRate, lumpSums,
  contributionTaxRate = 0, withdrawalTaxRate = 0
}) => {
  // Grows tax-free during accumulation, same as any tax-free wrapper elsewhere in the app.
  const grown = calculateCompoundInterest({
    initial, monthly, rate, years, inflation, taxRate: 0, wrapper: true, compoundFrequency,
    contributionIncreaseRate, lumpSums
  });

  // The refund arrives progressively, year by year, as each contribution is made --
  // shown as an informational total rather than compounded back into the balance
  // above, since this tool doesn't model reinvesting it (a real refund could be spent,
  // saved elsewhere, or reinvested -- any of which would need its own assumption).
  const contributionTaxRefund = grown.totalDeposited * (contributionTaxRate / 100);
  const netContributionCost = grown.totalDeposited - contributionTaxRefund;

  const withdrawalTax = grown.finalBalance * (withdrawalTaxRate / 100);
  const netAfterWithdrawalTax = grown.finalBalance - withdrawalTax;

  return {
    ...grown,
    contributionTaxRefund,
    netContributionCost,
    withdrawalTax,
    netAfterWithdrawalTax
  };
};
