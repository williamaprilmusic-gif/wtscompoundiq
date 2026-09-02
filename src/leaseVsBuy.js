// src/leaseVsBuy.js
// Lease vs. buy the same car over the same period. Buying: value lost to depreciation
// plus finance interest, keeping the residual value at the end. Leasing: upfront plus
// monthly payments over the term, owning nothing after. Distinct from carCost.js,
// which only costs out the buy path. Reuses loanAmortization.js for the finance side.
import { calculateLoanAmortization } from './loanAmortization';
import { clampPct } from './utils/sanitize';

export const leaseVsBuy = ({
  carPrice, buyDeposit = 0, financeRate = 0, financeTermYears = 0,
  annualDepreciationRate = 15, comparePeriodYears,
  leaseUpfront = 0, leaseMonthly = 0
}) => {
  const price = Math.max(0, carPrice || 0);
  const period = Math.max(0, comparePeriodYears || 0);

  const dep = Math.max(0, Math.min(buyDeposit || 0, price));
  const financed = price - dep;
  const amort = (financed > 0 && (financeTermYears || 0) > 0)
    ? calculateLoanAmortization({ principal: financed, annualRate: financeRate, termYears: financeTermYears })
    : null;

  let financeInterest = 0;
  if (amort) {
    const yrs = Math.min(Math.ceil(period), Math.ceil(amort.payoffMonths / 12));
    financeInterest = amort.yearlyData.filter(r => r.year <= yrs).reduce((s, r) => s + r.interestPaid, 0);
  }

  const depRate = clampPct(annualDepreciationRate) / 100;
  const residualValue = price * Math.pow(1 - depRate, period);
  const buyNetCost = (price - residualValue) + financeInterest;

  const leaseCost = Math.max(0, leaseUpfront || 0) + Math.max(0, leaseMonthly || 0) * period * 12;

  return {
    buyNetCost,
    residualValue,
    financeInterest,
    leaseCost,
    buyIsCheaper: buyNetCost < leaseCost,
    difference: Math.abs(buyNetCost - leaseCost)
  };
};
