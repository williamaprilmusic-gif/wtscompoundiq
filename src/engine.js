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
  compoundFrequency = 12 // periods per year interest is credited (1=annually, 12=monthly, 365=daily, ...)
}) {
  let balance = initial;
  let totalDeposited = initial;
  let totalInterest = 0;
  let yearlyData = [];

  const periodRate = (rate / 100) / compoundFrequency;
  // Monthly contributions are spread evenly across each compounding period so the
  // total deposited per year always equals monthly * 12, regardless of frequency.
  const depositPerPeriod = monthly * (12 / compoundFrequency);

  for (let y = 0; y < years; y++) {
    let yearInterestEarned = 0;

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

    // 3. Apply tax on gains if NOT a wrapper
    let taxPaid = 0;
    if (!wrapper && taxRate > 0) {
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
      realValue: Math.round(realValue)
    });
  }

  return {
    finalBalance: Math.round(balance),
    totalDeposited: Math.round(totalDeposited),
    totalInterest: Math.round(totalInterest),
    yearlyData
  };
}