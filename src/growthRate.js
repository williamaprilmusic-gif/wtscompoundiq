// src/growthRate.js
// Annualised (compound) growth rate between two dated values -- the CAGR that turns
// startValue into endValue over `years`. Backs the Net Worth history's "growing at
// ~X%/yr" readout and the Dashboard's net-worth card. Returns cagr: null when a
// compound rate isn't meaningful (start at or below zero, an end that's gone negative,
// or no time elapsed), while still giving the plain total change in that case.
export const annualisedGrowth = ({ startValue, endValue, years }) => {
  const start = Number(startValue);
  const end = Number(endValue);
  const t = Number(years);

  const totalChange = end - start;
  const totalChangePercent = start > 0 ? (totalChange / start) * 100 : null;

  const canCompound = start > 0 && end > 0 && t > 0 && Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(t);
  const cagr = canCompound ? (Math.pow(end / start, 1 / t) - 1) * 100 : null;

  return { cagr, totalChange, totalChangePercent, years: Number.isFinite(t) ? t : 0 };
};

// Whole-year gap between two ISO date strings, as a float (so 18 months -> 1.5).
// Returns 0 for a missing/unparseable date or a non-positive span.
export const yearsBetweenDates = (fromIso, toIso) => {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return (to - from) / (365.25 * 24 * 3600 * 1000);
};
