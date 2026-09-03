// src/growthRate.js
// Annualised (compound) growth rate between two dated values -- the CAGR that turns
// startValue into endValue over `years`. Backs the Net Worth history's "growing at
// ~X%/yr" readout. Returns cagr: null (with a `reason`) when a compound rate isn't
// meaningful (start at or below zero, an end that's gone negative, or no time
// elapsed), while still giving the plain total change in that case.
// Under this many years apart, an annualised rate is just noise -- e.g. two snapshots
// logged the same day (one correcting the other) would otherwise annualise a large
// jump to Infinity or thousands of percent. Below the floor, cagr is null and the
// caller falls back to the plain total-change figure.
const MIN_YEARS_FOR_CAGR = 1 / 12;

export const annualisedGrowth = ({ startValue, endValue, years }) => {
  const start = Number(startValue);
  const end = Number(endValue);
  const t = Number(years);

  const totalChange = end - start;
  const totalChangePercent = start > 0 ? (totalChange / start) * 100 : null;

  const canCompound = start > 0 && end > 0 && Number.isFinite(start) && Number.isFinite(end)
    && Number.isFinite(t) && t >= MIN_YEARS_FOR_CAGR;
  let cagr = canCompound ? (Math.pow(end / start, 1 / t) - 1) * 100 : null;
  if (cagr != null && !Number.isFinite(cagr)) cagr = null;

  // Why cagr is null, so the caller can show the right explanation rather than a
  // one-size-fits-all "needs a positive starting value" (which is wrong when it was
  // the *end* that went non-positive).
  let reason = null;
  if (cagr == null) {
    if (!(Number.isFinite(start) && start > 0)) reason = 'nonpositive-start';
    else if (!(Number.isFinite(end) && end > 0)) reason = 'nonpositive-end';
    else if (!(Number.isFinite(t) && t >= MIN_YEARS_FOR_CAGR)) reason = 'short-span';
    else reason = 'short-span';
  }

  return { cagr, reason, totalChange, totalChangePercent, years: Number.isFinite(t) ? t : 0 };
};

// Whole-year gap between two ISO date strings, as a float (so 18 months -> 1.5).
// Returns 0 for a missing/unparseable date or a non-positive span.
export const yearsBetweenDates = (fromIso, toIso) => {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return (to - from) / (365.25 * 24 * 3600 * 1000);
};
