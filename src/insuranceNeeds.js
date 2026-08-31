// src/insuranceNeeds.js
// Pure math backing PowerTools.jsx's Insurance Needs (Life Cover Gap) Calculator.
// Needs-based method: how much lump-sum cover would it take, today, to clear debts,
// replace a chosen number of years of income for dependents, and cover final expenses
// -- minus cover and liquid savings already in place. A simplified version of the
// standard "needs analysis" approach used in real financial planning (as opposed to
// the "human life value" method, which projects a full career's earnings).
export const computeCoverGap = ({
  outstandingDebts = 0,
  annualIncomeToReplace = 0,
  yearsOfReplacement = 0,
  finalExpenses = 0,
  existingCover = 0,
  existingSavings = 0
}) => {
  const incomeReplacementNeed = Math.max(0, annualIncomeToReplace) * Math.max(0, yearsOfReplacement);
  const totalNeed = Math.max(0, outstandingDebts) + incomeReplacementNeed + Math.max(0, finalExpenses);
  const offsets = Math.max(0, existingCover) + Math.max(0, existingSavings);
  const coverGap = Math.max(0, totalNeed - offsets);
  return { incomeReplacementNeed, totalNeed, offsets, coverGap };
};
