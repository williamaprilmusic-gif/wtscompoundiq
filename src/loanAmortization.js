// src/loanAmortization.js
// Standard fixed-rate amortizing loan calculator -- shared math for a home loan/bond,
// vehicle loan, personal loan, or any other fixed-rate installment loan. Separate from
// engine.js (which models growing an investment) since this models paying one down.

const MAX_MONTHS = 720; // 60-year safety cap, same spirit as DebtPayoff's MAX_MONTHS

const safeNumber = (value, fallback, { min = -Infinity } = {}) =>
  Number.isFinite(value) ? Math.max(min, value) : fallback;

// Simulates a fixed monthly payment against a declining balance, month by month, so
// the totals and the amortization schedule reflect real rounding the same way the
// rest of the app's engines do (rather than only trusting the closed-form formula,
// which also can't model an overpayment scenario on its own).
const simulateSchedule = ({ principal, monthlyRate, payment }) => {
  let balance = principal;
  let totalPaid = 0;
  let totalInterestPaid = 0;
  let monthsElapsed = 0;
  let yearInterest = 0;
  let yearPrincipal = 0;
  const yearly = [];

  while (balance > 0.01 && monthsElapsed < MAX_MONTHS) {
    const interestPortion = balance * monthlyRate;
    let principalPortion = payment - interestPortion;
    if (principalPortion <= 0) break; // payment doesn't even cover interest -- balance would never shrink
    if (principalPortion > balance) principalPortion = balance; // final payment, don't overpay
    const actualPayment = interestPortion + principalPortion;

    balance -= principalPortion;
    totalPaid += actualPayment;
    totalInterestPaid += interestPortion;
    yearInterest += interestPortion;
    yearPrincipal += principalPortion;
    monthsElapsed++;

    if (monthsElapsed % 12 === 0 || balance <= 0.01) {
      yearly.push({
        year: Math.ceil(monthsElapsed / 12),
        balance: Math.round(Math.max(balance, 0)),
        interestPaid: Math.round(yearInterest),
        principalPaid: Math.round(yearPrincipal),
        totalPaidToDate: Math.round(totalPaid)
      });
      yearInterest = 0;
      yearPrincipal = 0;
    }
  }

  return {
    totalPaid,
    totalInterestPaid,
    monthsElapsed,
    yearly,
    reachable: balance <= 0.01
  };
};

export function calculateLoanAmortization({
  principal = 0,
  annualRate = 0, // %, e.g. 11.5
  termYears = 0,
  extraMonthly = 0 // optional overpayment on top of the required installment, every month
}) {
  principal = safeNumber(principal, 0, { min: 0 });
  annualRate = safeNumber(annualRate, 0, { min: 0 });
  termYears = safeNumber(termYears, 0, { min: 0 });
  extraMonthly = safeNumber(extraMonthly, 0, { min: 0 });

  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = Math.round(termYears * 12);

  if (principal <= 0 || totalMonths <= 0) {
    return { monthlyPayment: 0, totalRepayment: 0, totalInterest: 0, payoffMonths: 0, yearlyData: [], reachable: true, extra: null };
  }

  // Standard amortization formula for the required monthly installment.
  const monthlyPayment = monthlyRate === 0
    ? principal / totalMonths
    : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalMonths));

  const standard = simulateSchedule({ principal, monthlyRate, payment: monthlyPayment });

  let extra = null;
  if (extraMonthly > 0) {
    const withExtra = simulateSchedule({ principal, monthlyRate, payment: monthlyPayment + extraMonthly });
    extra = {
      payoffMonths: withExtra.monthsElapsed,
      totalRepayment: Math.round(withExtra.totalPaid),
      totalInterest: Math.round(withExtra.totalInterestPaid),
      monthsSaved: Math.max(0, standard.monthsElapsed - withExtra.monthsElapsed),
      interestSaved: Math.round(standard.totalInterestPaid - withExtra.totalInterestPaid),
      yearlyData: withExtra.yearly,
      reachable: withExtra.reachable
    };
  }

  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalRepayment: Math.round(standard.totalPaid),
    totalInterest: Math.round(standard.totalInterestPaid),
    payoffMonths: standard.monthsElapsed,
    yearlyData: standard.yearly,
    reachable: standard.reachable,
    extra
  };
}
