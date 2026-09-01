// src/carCost.js
// The all-in cost of owning a car over a holding period: what it loses to
// depreciation, the interest if it's financed, and the running costs (insurance, fuel,
// maintenance, licensing) a sticker price never shows. Reuses loanAmortization.js for
// the finance portion, the same amortization math the Loan & Bond tab uses.
import { calculateLoanAmortization } from './loanAmortization';

export const carOwnershipCost = ({
  purchasePrice, deposit = 0, financeRate = 0, financeTermYears = 0,
  yearsOwned, annualDepreciationRate = 15,
  monthlyInsurance = 0, monthlyFuel = 0, monthlyMaintenance = 0
}) => {
  const price = Math.max(0, purchasePrice || 0);
  const dep = Math.max(0, Math.min(deposit || 0, price));
  const held = Math.max(0, yearsOwned || 0);
  const financed = price - dep;

  const amort = (financed > 0 && (financeTermYears || 0) > 0)
    ? calculateLoanAmortization({ principal: financed, annualRate: financeRate, termYears: financeTermYears })
    : null;

  // Interest actually paid across the years the car is held (never past the loan term).
  let financeInterest = 0;
  if (amort) {
    const heldYearCount = Math.min(Math.ceil(held), Math.ceil(amort.payoffMonths / 12));
    financeInterest = amort.yearlyData
      .filter(r => r.year <= heldYearCount)
      .reduce((s, r) => s + r.interestPaid, 0);
  }

  const depRate = Math.max(0, Math.min(annualDepreciationRate || 0, 100)) / 100;
  const residualValue = price * Math.pow(1 - depRate, held);
  const depreciation = price - residualValue;

  const runningMonthly = Math.max(0, monthlyInsurance || 0) + Math.max(0, monthlyFuel || 0) + Math.max(0, monthlyMaintenance || 0);
  const runningTotal = runningMonthly * held * 12;

  const totalCost = depreciation + financeInterest + runningTotal;
  return {
    residualValue,
    depreciation,
    financeInterest,
    runningTotal,
    totalCost,
    costPerMonth: held > 0 ? totalCost / (held * 12) : 0
  };
};
