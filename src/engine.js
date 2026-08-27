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
  lifetimeWrapperLimit = null // max cumulative contributions ever that still qualify, or null = no cap
}) {
  let balance = initial;
  let totalDeposited = initial;
  let totalInterest = 0;
  let yearlyData = [];
  let cumulativeContributions = initial; // lump-sum initial counts toward lifetime room too
  let wrapperCapExceeded = false;

  const periodRate = (rate / 100) / compoundFrequency;
  // Monthly contributions are spread evenly across each compounding period so the
  // total deposited per year always equals monthly * 12, regardless of frequency.
  const depositPerPeriod = monthly * (12 / compoundFrequency);
  const yearlyContribution = monthly * 12;

  for (let y = 0; y < years; y++) {
    let yearInterestEarned = 0;

    // Decide, once per year, whether THIS year's growth still qualifies for wrapper
    // shelter -- coarse (whole-year) rather than exact-rand precision, but it's the
    // simplest honest fix for the real bug this models: a wrapper flag alone doesn't
    // check contribution limits at all, so oversized contributions were previously
    // shown as 100% tax-free growth regardless of size, which is not how any real
    // tax-free wrapper works. Once the lifetime cap is breached it stays breached
    // (contributions only accumulate); the annual cap re-opens fresh room every year.
    const projectedCumulative = cumulativeContributions + yearlyContribution;
    const breachesAnnualCap = annualWrapperLimit != null && yearlyContribution > annualWrapperLimit;
    const breachesLifetimeCap = lifetimeWrapperLimit != null && projectedCumulative > lifetimeWrapperLimit;
    const yearIsSheltered = wrapper && !breachesAnnualCap && !breachesLifetimeCap;
    if (wrapper && (breachesAnnualCap || breachesLifetimeCap)) wrapperCapExceeded = true;

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