// src/depositTimeline.js
// The inverse of the Sinking Fund tool: given what you can put away each month toward a
// home deposit (expressed as a % of the purchase price), how long until it's saved --
// with the running balance earning a modest savings rate. Distinct from Home
// Affordability, which sizes the bond rather than timing the deposit.
import { clampPct } from './utils/sanitize';

export const depositSavingsTimeline = ({ homePrice, depositPercent, monthlySaving, alreadySaved = 0, annualSavingsRate = 0 }) => {
  const price = Math.max(0, homePrice || 0);
  const pct = clampPct(depositPercent);
  const targetAmount = price * (pct / 100);
  const start = Math.max(0, alreadySaved || 0);
  const monthly = Math.max(0, monthlySaving || 0);
  const i = Math.max(0, annualSavingsRate || 0) / 100 / 12;

  if (start >= targetAmount) {
    return { targetAmount, months: 0, alreadyThere: true, totalSaved: start, interestEarned: 0 };
  }
  // Nothing going in, and either no interest or no balance for interest to act on --
  // it never reaches the target, so skip the loop.
  if (monthly === 0 && (i === 0 || start === 0)) {
    return { targetAmount, months: null, alreadyThere: false, totalSaved: start, interestEarned: 0 };
  }

  let balance = start;
  let months = 0;
  const MAX = 1200; // 100-year safety cap
  while (balance < targetAmount && months < MAX) {
    balance = balance * (1 + i) + monthly;
    months++;
  }
  if (balance < targetAmount) {
    return { targetAmount, months: null, alreadyThere: false, totalSaved: balance, interestEarned: 0 };
  }
  return {
    targetAmount,
    months,
    alreadyThere: false,
    totalSaved: balance,
    interestEarned: balance - start - monthly * months
  };
};
