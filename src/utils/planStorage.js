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
