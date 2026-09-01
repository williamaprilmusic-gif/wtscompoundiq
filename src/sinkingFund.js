// src/sinkingFund.js
// A sinking fund: setting aside a fixed amount every month so a known sum is ready by a
// specific date for a planned expense (a car, a wedding, a deposit). Near-term and
// low-risk, so unlike Invest.jsx's goal solver this assumes a modest savings-account
// rate rather than a market return, and solves the monthly amount in closed form.
export const sinkingFundPlan = ({ targetAmount, alreadySaved = 0, months, annualSavingsRate = 0 }) => {
  const target = Math.max(0, targetAmount || 0);
  const start = Math.max(0, alreadySaved || 0);
  const n = Math.max(0, Math.round(months || 0));
  const remaining = Math.max(0, target - start);

  if (n === 0) {
    return { monthlyAmount: remaining, remaining, totalContributions: remaining, interestEarned: 0 };
  }

  const i = Math.max(0, annualSavingsRate || 0) / 100 / 12;
  // Grow the head start over the term, then solve an ordinary annuity for the gap it
  // doesn't cover.
  const startGrown = start * Math.pow(1 + i, n);
  const gap = Math.max(0, target - startGrown);
  const annuityFactor = i === 0 ? n : (Math.pow(1 + i, n) - 1) / i;
  const monthlyAmount = annuityFactor > 0 ? gap / annuityFactor : gap;
  const totalContributions = monthlyAmount * n;
  const interestEarned = Math.max(0, target - start - totalContributions);

  return { monthlyAmount, remaining, totalContributions, interestEarned };
};
