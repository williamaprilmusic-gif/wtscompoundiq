// src/educationSavings.js
// Projects a future education cost using education-specific inflation (school/university
// fees have historically outpaced general CPI in South Africa), then
// hands that total to goalSolver.js to work out the required monthly contribution --
// same "how much do I need to save" shape as Invest.jsx's goals, but with the target
// amount itself derived from a cost-inflation projection instead of typed in directly.

// currentAnnualCost: today's annual cost, in today's money.
// yearsUntilEnrollment: how many years from now the first year of study begins.
// studyYears: how many consecutive years of study to fund.
// educationInflationRate: %/yr, applied on top of yearsUntilEnrollment + each
// additional study year -- year 1 of study is inflated by yearsUntilEnrollment years,
// year 2 by yearsUntilEnrollment + 1, and so on, since later years' fees also keep
// rising between now and when they're actually due.
export const projectEducationCost = ({ currentAnnualCost = 0, yearsUntilEnrollment = 0, studyYears = 0, educationInflationRate = 0 }) => {
  const rate = (educationInflationRate || 0) / 100;
  const safeCost = Math.max(0, currentAnnualCost);
  const safeStudyYears = Math.max(0, Math.round(studyYears));
  const safeYearsOut = Math.max(0, yearsUntilEnrollment);

  const yearly = [];
  let totalFutureCost = 0;
  for (let i = 0; i < safeStudyYears; i++) {
    const yearsOut = safeYearsOut + i;
    const cost = safeCost * Math.pow(1 + rate, yearsOut);
    yearly.push({ studyYear: i + 1, yearsFromNow: yearsOut, cost });
    totalFutureCost += cost;
  }

  return { totalFutureCost, yearly };
};
