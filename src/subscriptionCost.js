// src/subscriptionCost.js
// The real long-run price of a recurring subscription. A "small" monthly charge is an
// annual cost that usually creeps up with inflation, and every rand of it is a rand
// not compounding somewhere else. Shows the total paid over a chosen horizon and the
// opportunity cost of not investing the same amount instead.
export const subscriptionCost = ({ monthlyAmount, years, investReturn = 0, annualPriceIncrease = 0 }) => {
  const monthly = Math.max(0, monthlyAmount || 0);
  const horizon = Math.max(0, Math.round(years || 0));
  const r = Math.max(-99, investReturn || 0) / 100 / 12;
  const bump = 1 + Math.max(-99, annualPriceIncrease || 0) / 100;

  let totalPaid = 0;
  let investedValue = 0;
  let thisMonth = monthly;
  for (let y = 0; y < horizon; y++) {
    for (let m = 0; m < 12; m++) {
      totalPaid += thisMonth;
      // If the money had gone into an investment instead of the subscription.
      investedValue = investedValue * (1 + r) + thisMonth;
    }
    thisMonth *= bump; // price review once a year
  }

  return {
    annualCostNow: monthly * 12,
    totalPaid,
    investedInsteadValue: investedValue,
    // What you're really giving up: the invested pot, minus the cash you'd have spent
    // anyway -- i.e. the growth foregone on top of the sticker cost.
    opportunityCost: Math.max(0, investedValue - totalPaid),
    horizonYears: horizon
  };
};
