// src/debtConsolidation.js
// "Should I roll these debts into one loan?" Compares keeping several debts as they are
// -- each paid at its current fixed monthly amount -- against consolidating the whole
// balance into a single personal loan at one rate and term. Distinct from
// debtPayoffEngine.js's avalanche/snowball, which keeps the debts separate and just
// re-orders the extra payment; this one actually replaces them with a new loan.
import { calculateLoanAmortization } from './loanAmortization';

const MAX_MONTHS = 1200; // 100-year safety cap

// One debt paid at a fixed monthly amount against its own rate, month by month.
const payOffFixed = ({ balance, annualRate, payment }) => {
  const monthlyRate = Math.max(0, annualRate || 0) / 100 / 12;
  let bal = Math.max(0, balance || 0);
  let months = 0;
  let interest = 0;
  if (bal <= 0) return { months: 0, interest: 0, neverPaysOff: false };
  while (bal > 0.01 && months < MAX_MONTHS) {
    const i = bal * monthlyRate;
    if (payment <= i && monthlyRate > 0) return { months: null, interest: Infinity, neverPaysOff: true };
    bal += i;
    interest += i;
    bal -= Math.min(payment, bal);
    months++;
  }
  return { months: bal <= 0.01 ? months : null, interest, neverPaysOff: bal > 0.01 };
};

export const compareDebtConsolidation = ({ debts = [], newRate = 0, newTermYears = 0, extraMonthly = 0 }) => {
  const clean = (Array.isArray(debts) ? debts : [])
    .map(d => ({
      balance: Math.max(0, d.balance || 0),
      rate: Math.max(0, d.rate || 0),
      payment: Math.max(0, d.minPayment || d.payment || 0)
    }))
    .filter(d => d.balance > 0);

  const totalBalance = clean.reduce((s, d) => s + d.balance, 0);
  const currentMonthly = clean.reduce((s, d) => s + d.payment, 0);

  // Current path: each debt runs independently at its own payment. Payoff time is the
  // longest of them; interest is the sum.
  let currentInterest = 0;
  let currentMonths = 0;
  let anyNeverPaysOff = false;
  for (const d of clean) {
    const r = payOffFixed({ balance: d.balance, annualRate: d.rate, payment: d.payment });
    if (r.neverPaysOff) { anyNeverPaysOff = true; currentInterest = Infinity; }
    else {
      currentInterest += r.interest;
      currentMonths = Math.max(currentMonths, r.months);
    }
  }

  // Consolidated path: one amortising loan for the whole balance. `extraMonthly` is an
  // optional overpayment kept on top of the new required installment.
  const amort = totalBalance > 0 && newTermYears > 0
    ? calculateLoanAmortization({ principal: totalBalance, annualRate: newRate, termYears: newTermYears, extraMonthly })
    : null;

  const consolidatedMonthly = amort ? amort.monthlyPayment + Math.max(0, extraMonthly || 0) : 0;
  const consolidatedInterest = amort ? (amort.extra ? amort.extra.totalInterest : amort.totalInterest) : null;
  const consolidatedMonths = amort ? (amort.extra ? amort.extra.payoffMonths : amort.payoffMonths) : null;

  return {
    totalBalance,
    currentMonthly,
    currentInterest,
    currentMonths: anyNeverPaysOff ? null : currentMonths,
    anyNeverPaysOff,
    consolidatedMonthly,
    consolidatedInterest,
    consolidatedMonths,
    // Positive = consolidating saves that much interest / that many months.
    interestSaved: (Number.isFinite(currentInterest) && consolidatedInterest != null)
      ? currentInterest - consolidatedInterest
      : null,
    monthsSaved: (currentMonths && consolidatedMonths != null && !anyNeverPaysOff)
      ? currentMonths - consolidatedMonths
      : null,
    monthlyDifference: amort ? currentMonthly - consolidatedMonthly : null // positive = frees up cash flow
  };
};
