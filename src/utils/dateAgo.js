// src/utils/dateAgo.js
// Shared "how long ago was this saved" helpers -- used anywhere a saved snapshot's
// age needs to be shown (Dashboard, My Plan, ...).

// Falls back to 0 (not NaN) for an unparseable/missing isoDate -- a hand-edited
// localStorage value or an older-schema entry missing its date field would otherwise
// produce NaN here, which Math.max(0, NaN) still returns as NaN (Math.max never
// "clamps away" a NaN operand), and which every caller either renders as the literal
// string "NaN days ago" (fmtDaysAgo) or multiplies into a further NaN (monthsBetween's
// callers in MyPlan.jsx). 0 elapsed is a reasonable, non-broken degradation --
// equivalent to treating an unreadable date as "just now" rather than corrupting
// whatever's downstream.
export const daysBetween = (isoDate) => {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24))) : 0;
};

export const fmtDaysAgo = (d) => d === 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`;
