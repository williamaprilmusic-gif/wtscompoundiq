// src/financialHealthScore.js
// Combines whatever the user has already saved elsewhere in the app (Emergency Fund,
// Debt Payoff, Net Worth history, FIRE target) into a single 0-100 "financial health"
// score for Dashboard.jsx. Pure and independently testable, same pattern as the app's
// other *Engine.js files -- Dashboard.jsx owns reading localStorage and converting
// currency; this module only scores numbers it's handed.
//
// Every component score is optional (null when that tool hasn't been used yet) and the
// overall score averages only the ones that ARE available -- a user who's only saved an
// Emergency Fund plan still gets a meaningful score built from what they've got, rather
// than being dragged toward 0 by every unvisited tool being scored as "failing". See
// MIN_COMPONENTS below for the floor on how little data is enough to show a score at all.

// Emergency Fund coverage, already expressed as a 0-100+ percentage by the caller
// (currentSavings / targetAmount * 100) -- just clamp it into the 0-100 score range.
export const scoreEmergencyFund = (fundedPct) =>
  fundedPct == null ? null : Math.max(0, Math.min(100, fundedPct));

// Fewer months to debt-free is healthier. A saved plan with a balance already at (or
// below) zero scores as fully debt-free; no saved plan at all contributes no score
// rather than a perfect 100 -- "no debt tracked" isn't the same claim as "no debt".
export const scoreDebtPayoff = (totalBalance, monthsToFree) => {
  if (monthsToFree == null) return null;
  if (totalBalance <= 0) return 100;
  if (monthsToFree <= 24) return 100;
  if (monthsToFree <= 60) return 70;
  if (monthsToFree <= 120) return 40;
  return 15;
};

// Percentage change in net worth from the first to the latest saved snapshot -- needs
// at least two points to mean anything (see caller), a single snapshot has no trend.
export const scoreNetWorthTrend = (firstNetWorth, latestNetWorth) => {
  if (firstNetWorth == null || latestNetWorth == null) return null;
  if (firstNetWorth <= 0) return latestNetWorth > 0 ? 90 : 30; // crossed to positive, or still underwater
  const pctChange = ((latestNetWorth - firstNetWorth) / Math.abs(firstNetWorth)) * 100;
  if (pctChange >= 20) return 100;
  if (pctChange >= 5) return 80;
  if (pctChange >= 0) return 60;
  if (pctChange >= -10) return 35;
  return 15;
};

// yearsToFire: undefined when the FIRE section was never saved (distinct from null,
// which means it WAS saved but isn't reachable within the 60-year search horizon --
// see powerToolsEngine.js's yearsToReachTarget). Object.is-style === comparison, not
// a truthiness check, so this can't be fooled by yearsToFire legitimately being 0.
export const scoreFireProgress = (yearsToFire) => {
  if (yearsToFire === undefined) return null;
  if (yearsToFire === null) return 20;
  if (yearsToFire <= 10) return 100;
  if (yearsToFire <= 20) return 75;
  if (yearsToFire <= 35) return 50;
  return 25;
};

const GRADES = [
  { min: 85, grade: 'A', label: 'Excellent' },
  { min: 70, grade: 'B', label: 'Good' },
  { min: 55, grade: 'C', label: 'Fair' },
  { min: 35, grade: 'D', label: 'Needs work' },
  { min: 0, grade: 'F', label: 'Just getting started' }
];

export const gradeForScore = (score) => GRADES.find(g => score >= g.min);

// Require at least this many real component scores before showing a combined number --
// a brand-new user with a single saved snapshot shouldn't see a confident-looking
// score built from one data point.
export const MIN_COMPONENTS = 2;

// components: [{ key, label, score }] -- score may be null (not yet available).
// Returns null (not enough data yet) or { score, grade, label, components } where
// `components` is filtered down to only the ones that actually contributed.
export const computeHealthScore = (components) => {
  const available = components.filter(c => c.score != null);
  if (available.length < MIN_COMPONENTS) return null;
  const score = Math.round(available.reduce((sum, c) => sum + c.score, 0) / available.length);
  // Pick out only grade/label -- gradeForScore returns the GRADES row, which also carries
  // its `min` threshold; spreading the whole row leaked a stray `min` into the result.
  const { grade, label } = gradeForScore(score);
  return { score, grade, label, components: available };
};
