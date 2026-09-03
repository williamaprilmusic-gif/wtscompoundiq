// src/twoPotWithdrawal.js
// South Africa's two-pot retirement system (from Sept 2024): new retirement-fund
// contributions split one-third into an accessible "savings pot" and two-thirds into a
// locked "retirement pot". Taking money from the savings pot before retirement has two
// costs this works out: (1) the withdrawal is added to your taxable income for the year
// and taxed at your MARGINAL rate -- not the gentler retirement lump-sum tables -- and
// (2) you give up everything that amount would have compounded to by retirement.
//
// Reuses engine.js's bracket maths and the compounding engine, so the numbers line up
// with the rest of the app. SA-specific; other regimes should treat it as illustrative.
import { taxOwedAtBrackets, calculateCompoundInterest } from './engine';

export const analyseTwoPotWithdrawal = ({
  withdrawalAmount, annualIncome, taxRate = 0, taxBrackets = null,
  yearsToRetirement = 0, growthRate = 0
}) => {
  const gross = Math.max(0, withdrawalAmount || 0);
  const income = Math.max(0, annualIncome || 0);
  if (gross === 0) {
    return { taxOnWithdrawal: 0, netCashNow: 0, marginalRatePct: 0, futureValueForgone: 0, costPerRandTaken: 0 };
  }

  let taxOnWithdrawal;
  if (taxBrackets && taxBrackets.length) {
    taxOnWithdrawal = taxOwedAtBrackets(income + gross, taxBrackets) - taxOwedAtBrackets(income, taxBrackets);
  } else {
    taxOnWithdrawal = gross * (Math.max(0, taxRate) / 100);
  }
  taxOnWithdrawal = Math.max(0, Math.min(taxOnWithdrawal, gross));
  const netCashNow = gross - taxOnWithdrawal;
  const marginalRatePct = (taxOnWithdrawal / gross) * 100;

  // What the gross amount, left invested, would be worth at retirement -- a plain
  // lump-sum growth run, no further contributions, no tax inside a retirement fund.
  const years = Math.max(0, Math.round(yearsToRetirement || 0));
  const futureValueForgone = years > 0
    ? calculateCompoundInterest({
        initial: gross, monthly: 0, rate: growthRate || 0, years,
        inflation: 0, taxRate: 0, wrapper: true, compoundFrequency: 12
      }).finalBalance
    : gross;

  return {
    taxOnWithdrawal,
    netCashNow,
    marginalRatePct,
    futureValueForgone,
    // For every R1 of spendable cash you actually get, this is what it costs in
    // retirement money -- the headline "is it worth it" figure.
    costPerRandTaken: netCashNow > 0 ? futureValueForgone / netCashNow : 0
  };
};
