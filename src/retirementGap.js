// src/retirementGap.js
// Are you on track for the retirement income you actually want? Given a projected pot
// at retirement and a safe withdrawal rate, this is the annual income that pot throws
// off, the shortfall (or surplus) against a target income, and the extra capital that
// shortfall represents. Complements the FIRE Number tool (which sizes a pot from
// expenses) and Drawdown (which tests whether a pot lasts).
export const retirementIncomeGap = ({ projectedPot, targetAnnualIncome, withdrawalRate }) => {
  const pot = Math.max(0, projectedPot || 0);
  const target = Math.max(0, targetAnnualIncome || 0);
  const swr = Math.max(0.01, withdrawalRate || 4) / 100;

  const incomeFromPot = pot * swr;
  const annualGap = target - incomeFromPot;   // positive = short, negative = surplus
  const capitalGap = annualGap / swr;         // extra pot that would close the gap

  return {
    incomeFromPot,
    annualGap,
    capitalGap,
    onTrack: annualGap <= 0,
    coverageRatio: target > 0 ? (incomeFromPot / target) * 100 : 100
  };
};
