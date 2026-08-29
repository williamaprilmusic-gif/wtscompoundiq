// src/powerToolsEngine.js
// Pure simulation functions extracted from PowerTools.jsx so they're independently
// testable (see powerToolsEngine.test.js) without needing to render the component.
import { calculateCompoundInterest } from './engine';

export const MAX_YEARS_TO_SEARCH = 60;

export const yearsToReachTarget = ({ initial, monthly, rate, inflation, taxRate, wrapper, target, compoundFrequency, annualWrapperLimit, lifetimeWrapperLimit, contributionIncreaseRate, lumpSums }) => {
  if (initial >= target) return 0;
  for (let y = 1; y <= MAX_YEARS_TO_SEARCH; y++) {
    const { finalBalance } = calculateCompoundInterest({ initial, monthly, rate, years: y, inflation, taxRate, wrapper, compoundFrequency, annualWrapperLimit, lifetimeWrapperLimit, contributionIncreaseRate, lumpSums });
    if (finalBalance >= target) return y;
  }
  return null; // not reachable within MAX_YEARS_TO_SEARCH
};

// Pay the debt off with extraMonthly first (simple monthly amortization); once it's
// clear, whatever was going to the debt (extraMonthly, or the leftover the month it
// clears) gets invested for the rest of the horizon.
export const simulateDebtFirst = ({ debtAmount, debtRate, extraMonthly, afterTaxReturn, months }) => {
  let debt = debtAmount;
  let investment = 0;
  const debtMonthlyRate = debtRate / 100 / 12;
  const investMonthlyRate = afterTaxReturn / 100 / 12;
  let clearedAtMonth = debt <= 0 ? 0 : null;
  for (let m = 0; m < months; m++) {
    if (debt > 0) {
      debt += debt * debtMonthlyRate;
      const pay = Math.min(extraMonthly, debt);
      debt -= pay;
      const leftover = extraMonthly - pay; // the month debt clears, whatever's left over that month starts investing immediately
      investment = investment * (1 + investMonthlyRate) + leftover;
      if (debt <= 0.01) { debt = 0; if (clearedAtMonth === null) clearedAtMonth = m + 1; }
    } else {
      investment = investment * (1 + investMonthlyRate) + extraMonthly;
    }
  }
  return { debtRemaining: debt, investment, clearedAtMonth };
};

// The other extreme: invest extraMonthly the whole time and leave the debt completely
// untouched (no payments at all) -- the worst case for "invest instead," so the
// comparison isn't quietly assuming the debt gets paid down some other way.
export const simulateInvestFirst = ({ debtAmount, debtRate, extraMonthly, afterTaxReturn, months }) => {
  let debt = debtAmount;
  let investment = 0;
  const debtMonthlyRate = debtRate / 100 / 12;
  const investMonthlyRate = afterTaxReturn / 100 / 12;
  for (let m = 0; m < months; m++) {
    debt += debt * debtMonthlyRate;
    investment = investment * (1 + investMonthlyRate) + extraMonthly;
  }
  return { debtRemaining: debt, investment };
};

// Simple year-by-year retirement drawdown: withdraw (inflation-escalated) at the start
// of each year, grow whatever's left at returnRate. Not a Monte Carlo -- a single
// straight-line path, same spirit as the rest of the calculator.
export const simulateDrawdown = ({ startingBalance, annualWithdrawal, returnRate, inflation, years }) => {
  let balance = startingBalance;
  const path = [{ year: 0, balance }];
  for (let y = 0; y < years; y++) {
    const withdrawal = annualWithdrawal * Math.pow(1 + inflation / 100, y);
    balance -= withdrawal;
    if (balance <= 0) {
      path.push({ year: y + 1, balance: 0 });
      return { depleted: true, lastedYears: y + 1, endingBalance: 0, path };
    }
    balance *= (1 + returnRate / 100);
    path.push({ year: y + 1, balance });
  }
  return { depleted: false, lastedYears: years, endingBalance: balance, path };
};
