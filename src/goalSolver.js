// src/goalSolver.js
// Binary-search the monthly contribution needed to reach a goal amount by a target
// year, reusing engine.js's calculateCompoundInterest so every "how much do I need to
// invest monthly" calculator in the app (Invest's goals, Power Tools' Education
// Savings) solves it the same way instead of each reimplementing its own search.
// Originally local to Invest.jsx.
import { calculateCompoundInterest } from './engine';

export const solveMonthlyForGoal = ({ startingAmount, rate, years, inflation, taxRate, wrapper, goalAmount, compoundFrequency, annualWrapperLimit, lifetimeWrapperLimit, contributionIncreaseRate }) => {
  const evaluate = (monthly) => calculateCompoundInterest({
    initial: startingAmount, monthly, rate, years, inflation, taxRate, wrapper, compoundFrequency, annualWrapperLimit, lifetimeWrapperLimit, contributionIncreaseRate
  }).finalBalance;

  const binarySearch = (lo, hi) => {
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (evaluate(mid) < goalAmount) lo = mid; else hi = mid;
    }
    return hi;
  };

  // A wrapper's annual contribution cap creates a cliff in finalBalance(monthly) --
  // engine.js taxes a whole year's growth once yearlyContribution crosses
  // annualWrapperLimit, so a slightly HIGHER monthly contribution can land on a lower
  // final balance than staying just under the cap. A plain binary search assumes a
  // monotonically increasing function and can jump past that cliff, overstating the
  // monthly contribution actually needed. If the goal is reachable while staying fully
  // under the cap (a monotonic sub-range), solve within that sub-range instead.
  if (wrapper && annualWrapperLimit != null) {
    const capMonthly = annualWrapperLimit / 12;
    if (evaluate(capMonthly) >= goalAmount) {
      return binarySearch(0, capMonthly);
    }
  }

  return binarySearch(0, Math.max(goalAmount, 100000));
};
