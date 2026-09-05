// src/coastContributionShare.js
// Splits a projection's final balance into "already locked in" (what the starting
// amount alone would grow to with zero further contributions) versus "depends on
// continuing to contribute" (everything above that). A second lens on the same
// deposits-vs-growth question the Calculator's split-bar answers, framed around what
// happens if you stopped contributing today rather than around where each rand came
// from. Takes both final balances already computed (by two calls to
// calculateCompoundInterest, one with monthly set to 0) rather than recomputing the
// projection itself, so it stays a plain, easily-testable split.
export const coastContributionShare = (finalBalance, coastFinalBalance) => {
  const balance = Math.max(0, finalBalance || 0);
  // Coast balance can't exceed the real (with-contributions) balance -- clamped in case
  // of floating-point drift when monthly is already 0 and the two calls should match
  // exactly.
  const coast = Math.max(0, Math.min(coastFinalBalance || 0, balance));
  const dependsOnContributing = Math.max(0, balance - coast);
  const coastSharePct = balance > 0 ? (coast / balance) * 100 : 100;
  return { coastFinalBalance: coast, dependsOnContributing, coastSharePct };
};
