// src/retirementGap.js
// Are you on track for the retirement income you actually want? Given a projected pot
// at retirement and a safe withdrawal rate, this is the annual income that pot throws
// off, the shortfall (or surplus) against a target income, and the extra capital that
// shortfall represents. Complements the FIRE Number tool (which sizes a pot from
// expenses) and Drawdown (which tests whether a pot lasts).
export const retirementIncomeGap = ({ projectedPot, targetAnnualIncome, withdrawalRate }) => {
  const pot = Math.max(0, projectedPot || 0);
  const target = Math.max(0, targetAnnualIncome || 0);
  const swr = Math.max(0.01, withdrawalRate || 4) / 100;

  const incomeFromPot = pot * swr;
  const annualGap = target - incomeFromPot;   // positive = short, negative = surplus
  const capitalGap = annualGap / swr;         // extra pot that would close the gap

  return {
    incomeFromPot,
    annualGap,
    capitalGap,
    onTrack: annualGap <= 0,
    coverageRatio: target > 0 ? (incomeFromPot / target) * 100 : 100
  };
};

// How long, saving `extraMonthly` on top of what's already projected, until a plain
// monthly-compounding pot growing at `rate`%/yr reaches `capitalGap` -- turns "you're
// short by R2.3m" into "another 11 years of saving R6,000/month would close it", the
// same kind of concrete timeline the Sinking Fund and Deposit Timeline tools give their
// own targets. Deliberately simple compounding (no contribution escalation, no tax) --
// this is a rough "how long" answer, not a re-run of the full Calculator engine.
const MAX_CLOSE_GAP_MONTHS = 100 * 12;
export const monthsToCloseGap = ({ capitalGap, extraMonthly, rate }) => {
  const gap = Math.max(0, capitalGap || 0);
  const monthly = Math.max(0, extraMonthly || 0);
  if (gap <= 0) return { months: 0, reachable: true };
  if (monthly <= 0) return { months: null, reachable: false };

  const monthlyRate = Math.max(-0.99, (rate || 0) / 100) / 12;
  let balance = 0;
  for (let m = 1; m <= MAX_CLOSE_GAP_MONTHS; m++) {
    balance = balance * (1 + monthlyRate) + monthly;
    if (balance >= gap) return { months: m, reachable: true };
  }
  return { months: null, reachable: false };
};
