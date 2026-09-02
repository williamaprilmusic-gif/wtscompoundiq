// src/savingsRate.js
// "The shockingly simple math behind early retirement" -- how many years to financial
// independence purely as a function of your savings rate, investing the surplus at a
// real (after-inflation) return and needing 25x annual spending (the 4% rule) to be
// done. Independent of any current portfolio -- FIRE Number / Coast FIRE cover that.

const YEARS_CAP = 100;
export const FI_MULTIPLE = 25; // 4% safe withdrawal rate -> 25x annual spending

export const yearsToFinancialIndependence = ({ takeHomeIncome, annualSpending, realReturn }) => {
  const income = Math.max(0, takeHomeIncome || 0);
  const spending = Math.max(0, annualSpending || 0);
  const annualSaving = income - spending;
  const savingsRate = income > 0 ? (annualSaving / income) * 100 : 0;
  const fiNumber = spending * FI_MULTIPLE;

  if (annualSaving <= 0 || spending <= 0) {
    return { savingsRate, years: null, fiNumber, annualSaving };
  }

  const r = (realReturn || 0) / 100;
  let balance = 0;
  for (let y = 1; y <= YEARS_CAP; y++) {
    balance = balance * (1 + r) + annualSaving;
    if (balance >= fiNumber) return { savingsRate, years: y, fiNumber, annualSaving };
  }
  return { savingsRate, years: null, fiNumber, annualSaving };
};
