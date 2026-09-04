// src/contractorRate.js
// "What day / hour rate do I need to charge to match my salary?" A contractor gives up
// paid leave, public holidays, sick days, and employer benefits (pension match, medical
// subsidy, UIF/insurance), pays their own tax, and can't bill 100% of the year -- gaps
// between contracts, admin, business development. This works the target take-home back
// up into a billable rate that covers all of it.
export const contractorRate = ({
  targetAnnualTakeHome,
  taxRatePct = 0,            // effective tax on the contractor's gross (income tax + any self-paid contributions)
  benefitsLoadingPct = 0,    // employer benefits to self-fund, as a % of salary (pension match + medical + insurance)
  billableWeeksPerYear = 46, // 52 minus leave, public holidays, sick, admin
  billableHoursPerWeek = 40,
  utilisationPct = 80        // share of those hours actually billed (bench time, BD, quoting)
}) => {
  const takeHome = Math.max(0, targetAnnualTakeHome || 0);
  const taxRate = Math.max(0, Math.min(99, taxRatePct || 0)) / 100;
  const benefits = Math.max(0, benefitsLoadingPct || 0) / 100;
  const weeks = Math.max(1, billableWeeksPerYear || 1);
  const hoursPerWeek = Math.max(1, billableHoursPerWeek || 1);
  const util = Math.max(1, Math.min(100, utilisationPct || 100)) / 100;

  // Gross needed before tax to net the target take-home.
  const grossBeforeTax = taxRate < 1 ? takeHome / (1 - taxRate) : takeHome;
  // Plus the employer benefits the contractor now self-funds (scaled off take-home as a
  // proxy for salary -- close enough for a planning figure).
  const totalRevenueNeeded = grossBeforeTax + takeHome * benefits;

  const billableHoursPerYear = weeks * hoursPerWeek * util;
  const hourlyRate = totalRevenueNeeded / billableHoursPerYear;

  return {
    grossRevenueNeeded: totalRevenueNeeded,
    billableHoursPerYear,
    hourlyRate,
    dailyRate: hourlyRate * hoursPerWeek / 5,       // a "day" = 1/5 of the billable week
    monthlyRevenueTarget: totalRevenueNeeded / 12,
    // How much bigger the billed rate is than a naive "salary / 2080 hours" -- the cost
    // of all the unbillable time and self-funded overhead.
    upliftVsNaive: (hourlyRate / (takeHome / (52 * hoursPerWeek))) - 1
  };
};
