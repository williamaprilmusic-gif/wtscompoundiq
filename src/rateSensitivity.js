// src/rateSensitivity.js
// How a change in the interest rate moves a loan/bond repayment. Given the outstanding
// balance, the current rate, and the years left, this reprices the standard monthly
// installment across a spread of rate shifts -- the "what if the central bank hikes"
// view the Loan & Bond tab (a single fixed rate) doesn't surface. Same
// present-value-of-an-annuity formula loanAmortization.js uses for the forward payment.
const installment = (principal, annualRate, months) => {
  if (!(principal > 0) || !(months > 0)) return 0;
  const r = annualRate / 100 / 12;
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
};

export const DEFAULT_SHIFTS = [-3, -2, -1, 0, 1, 2, 3];

export const rateSensitivity = ({ balance, currentRate, yearsRemaining, shifts = DEFAULT_SHIFTS }) => {
  const p = Math.max(0, balance || 0);
  const months = Math.max(0, Math.round((yearsRemaining || 0) * 12));
  const base = installment(p, currentRate || 0, months);

  return shifts.map(shift => {
    const rate = Math.max(0, (currentRate || 0) + shift);
    const payment = installment(p, rate, months);
    return { shift, rate, payment, deltaVsNow: payment - base };
  });
};
