// src/engine.js
// Robust, lightweight compound interest engine with tax and wrapper support.

export function calculateCompoundInterest({
  initial = 0,
  monthly = 0,
  rate = 0, // annual percentage rate, e.g. 6.8
  years = 0,
  inflation = 0,
  taxRate = 0, // e.g. 31 for South Africa taxable
  wrapper = false, // tax-free wrapper
  compoundFrequency = 12, // periods per year interest is credited (1=annually, 12=monthly, 365=daily, ...)
  annualWrapperLimit = null, // max contributions/year that still qualify for wrapper shelter, or null = no cap
  lifetimeWrapperLimit = null, // max cumulative contributions ever that still qualify, or null = no cap
  contributionIncreaseRate = 0, // % the monthly contribution grows by, once per year (e.g. an annual raise/COLA).
  lumpSums = [] // optional one-off extra deposits: [{ year, amount }, ...]. `year` is
  // 1-indexed to match yearlyData.year (year 1 = the first 12 months). Multiple entries
  // for the same year are summed. Defaults to [] so every existing caller behaves exactly as before.
}) {
  let balance = initial;
  let totalDeposited = initial;
  let totalInterest = 0;
  let yearlyData = [];
  let cumulativeContributions = initial; // lump-sum initial counts toward lifetime room too
  let wrapperCapExceeded = false;

  const periodRate = (rate / 100) / compoundFrequency;

  for (let y = 0; y < years; y++) {
    let yearInterestEarned = 0;

    // This year's monthly contribution, escalated from the base `monthly` amount by
    // contributionIncreaseRate compounding once per year. Monthly contributions are
    // spread evenly across each compounding period so the total deposited per year
    // always equals yearMonthly * 12, regardless of frequency.
    const yearMonthly = monthly * Math.pow(1 + contributionIncreaseRate / 100, y);
    const depositPerPeriod = yearMonthly * (12 / compoundFrequency);
    // Any one-off lump-sum deposits earmarked for this year (e.g. a bonus, inheritance,
    // or tax refund) count as contributions too -- both for the running total and for
    // the wrapper cap checks below.
    const yearLumpSum = lumpSums.filter(l => l.year === y + 1).reduce((sum, l) => sum + (l.amount || 0), 0);
    const yearlyContribution = yearMonthly * 12 + yearLumpSum;

    // Decide, once per year, whether THIS year's growth still qualifies for wrapper
    // shelter -- coarse (whole-year) rather than exact-rand precision, but it's the
    // simplest honest fix for the real bug this models: a wrapper flag alone doesn't
    // check contribution limits at all, so oversized contributions were previously
    // shown as 100% tax-free growth regardless of size, which is not how any real
    // tax-free wrapper works. Once the lifetime cap is breached it stays breached
    // (contributions only accumulate); the annual cap re-opens fresh room every year.
    // Year 1's contribution also includes the lump-sum `initial` deposit -- a real
    // wrapper's annual cap applies to everything paid in that year, so a large upfront
    // deposit that alone exceeds the annual limit must breach it too, not just the
    // ongoing monthly contributions.
    const firstYearContribution = y === 0 ? initial + yearlyContribution : yearlyContribution;
    const projectedCumulative = cumulativeContributions + yearlyContribution;
    const breachesAnnualCap = annualWrapperLimit != null && firstYearContribution > annualWrapperLimit;
    const breachesLifetimeCap = lifetimeWrapperLimit != null && projectedCumulative > lifetimeWrapperLimit;
    const yearIsSheltered = wrapper && !breachesAnnualCap && !breachesLifetimeCap;
    if (wrapper && (breachesAnnualCap || breachesLifetimeCap)) wrapperCapExceeded = true;

    // Lump sums land at the start of their year, so they compound for the full year
    // (like the initial deposit does in year 1) rather than trickling in period by period.
    if (yearLumpSum > 0) {
      balance += yearLumpSum;
      totalDeposited += yearLumpSum;
    }

    for (let p = 0; p < compoundFrequency; p++) {
      // 1. Calculate this period's interest on current balance
      const interest = balance * periodRate;
      balance += interest;
      totalInterest += interest;
      yearInterestEarned += interest;

      // 2. Add this period's share of the monthly deposit
      balance += depositPerPeriod;
      totalDeposited += depositPerPeriod;
    }
    cumulativeContributions += yearlyContribution;

    // 3. Apply tax on gains if NOT sheltered this year (not a wrapper, or a wrapper
    // whose contribution cap was breached)
    let taxPaid = 0;
    if (!yearIsSheltered && taxRate > 0) {
      // Simple tax on nominal interest earned this year
      taxPaid = yearInterestEarned * (taxRate / 100);
      balance -= taxPaid;
      totalInterest -= taxPaid; // Net interest after tax
    }

    // 4. Calculate real value (inflation adjusted)
    const realValue = balance / Math.pow(1 + (inflation / 100), y + 1);

    yearlyData.push({
      year: y + 1,
      balance: Math.round(balance),
      deposited: Math.round(totalDeposited),
      interest: Math.round(totalInterest),
      taxPaid: Math.round(taxPaid),
      realValue: Math.round(realValue),
      sheltered: yearIsSheltered
    });
  }

  return {
    finalBalance: Math.round(balance),
    totalDeposited: Math.round(totalDeposited),
    totalInterest: Math.round(totalInterest),
    wrapperCapExceeded,
    yearlyData
  };
}
