// src/paybackPeriod.js
// "Will this big upfront purchase pay for itself?" -- solar, a heat pump, a borehole, a
// water tank, a home gym, prepaying an annual subscription. Given the upfront cost and
// what it saves (or earns) each month, this returns the simple break-even point, the
// net position over the item's useful life, and -- because the upfront money could have
// been invested instead -- whether buying still comes out ahead once that opportunity
// cost is counted.
export const analysePayback = ({
  upfrontCost, monthlySaving, lifespanYears,
  maintenanceMonthly = 0, savingGrowthPct = 0, investReturnPct = 0
}) => {
  const cost = Math.max(0, upfrontCost || 0);
  const life = Math.max(0, Math.round(lifespanYears || 0));
  const grow = 1 + Math.max(-99, savingGrowthPct || 0) / 100;
  const monthlyR = Math.max(-99, investReturnPct || 0) / 100 / 12;

  const firstNet = Math.max(0, monthlySaving || 0) - Math.max(0, maintenanceMonthly || 0);

  let cumulativeNominal = 0;      // plain running total of net savings, for the headline
  let savingsInvested = 0;        // that same stream, compounded at investReturnPct
  let costInvested = cost;        // the upfront money, left invested instead (opp. cost)
  let breakEvenMonth = null;
  let monthlyNet = firstNet;

  const totalMonths = life * 12;
  for (let m = 1; m <= totalMonths; m++) {
    cumulativeNominal += monthlyNet;
    savingsInvested = savingsInvested * (1 + monthlyR) + monthlyNet;
    costInvested *= (1 + monthlyR);
    if (breakEvenMonth === null && cumulativeNominal >= cost) breakEvenMonth = m;
    if (m % 12 === 0) monthlyNet *= grow; // saving escalates once a year (e.g. with tariffs)
  }

  // Incremental end-wealth of buying vs. not buying: the compounded savings stream you
  // gained, minus what the upfront cash would have grown to if left invested.
  const buyingAdvantage = savingsInvested - costInvested;

  return {
    breakEvenMonths: breakEvenMonth,
    breakEvenYears: breakEvenMonth ? breakEvenMonth / 12 : null,
    lifetimeNet: cumulativeNominal - cost,     // total net saved over its life, minus cost
    firstYearSaving: firstNet * 12,
    neverBreaksEven: breakEvenMonth === null && firstNet <= 0,
    investedInsteadValue: costInvested,
    buyingAdvantage,
    beatsInvesting: buyingAdvantage > 0
  };
};
