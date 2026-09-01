// src/futureCost.js
// Pure math backing PowerTools.jsx's Future Cost of Living Calculator -- what a given
// today's-money cost will actually be after N years of inflation, and its mirror
// image: what today's-money amount is actually worth in N years' time. Same
// Math.pow(1 + rate/100, years) escalation engine.js's siblings already use elsewhere
// (educationSavings.js's per-year cost inflation, simulateDrawdown's withdrawal
// escalation), factored out here since this tool asks the question standalone rather
// than as one step inside a bigger projection.

export const projectFutureCost = ({ currentCost, years, inflationRate }) => {
  const safeCost = Math.max(0, currentCost || 0);
  const safeYears = Math.max(0, years || 0);
  const futureCost = safeCost * Math.pow(1 + (inflationRate || 0) / 100, safeYears);
  return {
    currentCost: safeCost,
    futureCost,
    totalIncrease: futureCost - safeCost,
    percentIncrease: safeCost > 0 ? ((futureCost - safeCost) / safeCost) * 100 : 0
  };
};

// The inverse question: what is a given today's-money amount actually worth N years
// from now, after inflation erodes its purchasing power -- same rate, opposite
// direction of projectFutureCost.
export const projectPurchasingPower = ({ currentAmount, years, inflationRate }) => {
  const safeAmount = Math.max(0, currentAmount || 0);
  const safeYears = Math.max(0, years || 0);
  const realValue = safeAmount / Math.pow(1 + (inflationRate || 0) / 100, safeYears);
  return {
    currentAmount: safeAmount,
    realValue,
    percentLost: safeAmount > 0 ? ((safeAmount - realValue) / safeAmount) * 100 : 0
  };
};
