// src/ruleOf72.js
// The Rule of 72: a back-of-envelope estimate of how long money takes to double at a
// given annual return (72 / rate). Paired here with the exact figure
// (ln 2 / ln(1 + r)) so the approximation's error is visible, and with the multiple an
// amount grows to over an arbitrary number of years.
export const ruleOf72 = ({ annualRate, years }) => {
  const rate = annualRate || 0;
  const safeYears = Math.max(0, years || 0);
  const approxDoublingYears = rate > 0 ? 72 / rate : null;
  const exactDoublingYears = rate > 0 ? Math.log(2) / Math.log(1 + rate / 100) : null;
  const growthMultiple = Math.pow(1 + rate / 100, safeYears);

  return {
    approxDoublingYears,
    exactDoublingYears,
    growthMultiple,
    doublingsOverPeriod: (exactDoublingYears != null && safeYears > 0) ? safeYears / exactDoublingYears : 0
  };
};
