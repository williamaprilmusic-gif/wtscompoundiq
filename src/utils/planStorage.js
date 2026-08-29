// src/utils/planStorage.js
// Single source of truth for the "My Plan" snapshot blob's storage key and its
// read-merge-write shape. Every "Save This Plan" button across the app (Debt Payoff,
// Emergency Fund, Loan & Bond, Power Tools) writes one top-level section of this same
// object, and Dashboard/My Plan/Snapshot read it back -- previously each caller
// independently redeclared the key and reimplemented the same corrupt-JSON-safe
// merge, which meant a future rename/schema change had to be applied everywhere by hand.

export const PLAN_STORAGE_KEY = 'wts_compoundiq_plan_snapshot';

export const readPlan = () => {
  try {
    return JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || '{}');
  } catch {
    return {}; // ignore corrupt snapshot, start fresh
  }
};

// Merges `data` into the plan under `sectionKey` (e.g. 'loan', 'fire') and persists it.
export const savePlanSection = (sectionKey, data) => {
  const existing = readPlan();
  const updated = { ...existing, [sectionKey]: data };
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// Given a saved 'loan' plan section, returns the true monthly payment actually being
// made -- the required installment plus any extra overpayment. Shared so Dashboard/My
// Plan/Snapshot can't drift out of sync on how this is derived (they all display it).
export const loanEffectiveMonthlyPayment = (loan) =>
  Math.round((loan.monthlyPayment || 0) + (loan.extraMonthly || 0));

// Given a saved 'loan' plan section, returns a "N years" label for how long it'll
// actually take to pay off at the saved pace. termYears is the loan's nominal
// contractual term and doesn't shrink when there's an extra payment -- payoffMonths
// (already accelerated by LoanCalculator's savePlan) is the real payoff horizon, so
// pairing the effective monthly payment above with the unadjusted termYears would
// describe two different, contradictory payment scenarios in the same sentence.
export const loanEffectiveTermLabel = (loan) =>
  loan.extraMonthly > 0 && loan.payoffMonths
    ? `${Math.round(loan.payoffMonths / 12 * 10) / 10} years`
    : `${loan.termYears} years`;
