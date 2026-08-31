// src/homeAffordability.js
// Pure math backing PowerTools.jsx's Home/Bond Affordability Calculator.

// The reverse of a standard loan amortization: given a monthly payment budget, an
// interest rate, and a term, how large a loan can that payment actually service? This
// is the same present-value-of-an-annuity formula loanAmortization.js already uses in
// the forward direction (payment from principal) -- solved for principal instead.
export const maxLoanForPayment = ({ payment, annualRate, termYears }) => {
  const monthlyRate = (annualRate || 0) / 100 / 12;
  const totalMonths = Math.round((termYears || 0) * 12);
  if (!(payment > 0) || totalMonths <= 0) return 0;
  if (monthlyRate === 0) return payment * totalMonths;
  return payment * (1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate;
};

// South Africa transfer duty brackets for natural persons buying property directly
// (illustrative, 2026/27 figures -- same "indicative, not a conveyancer's quote"
// caveat as the rest of this app's SA tax data; SARS periodically adjusts these
// thresholds, and this doesn't model trusts/companies, VAT-registered sellers, or any
// exemptions). `base` is the cumulative duty already owed up to the bracket's lower
// threshold; the bracket's `rate` applies only to the portion of price above that.
const ZA_TRANSFER_DUTY_BRACKETS = [
  { upTo: 1210000, rate: 0, base: 0 },
  { upTo: 1663800, rate: 3, base: 0 },
  { upTo: 2329300, rate: 6, base: 13614 },
  { upTo: 2994800, rate: 8, base: 53304 },
  { upTo: 13310000, rate: 11, base: 106044 },
  { upTo: null, rate: 13, base: 1240715 }
];

export const estimateZaTransferDuty = (price) => {
  if (!(price > 0)) return 0;
  const idx = ZA_TRANSFER_DUTY_BRACKETS.findIndex(b => b.upTo === null || price <= b.upTo);
  const bracket = ZA_TRANSFER_DUTY_BRACKETS[idx];
  const prevCap = ZA_TRANSFER_DUTY_BRACKETS[idx - 1]?.upTo || 0;
  return bracket.base + (price - prevCap) * (bracket.rate / 100);
};
