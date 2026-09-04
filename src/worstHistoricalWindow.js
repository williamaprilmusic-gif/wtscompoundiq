// src/worstHistoricalWindow.js
// Given a series of real annual returns (%), find the WORST contiguous window of
// `windowYears` -- the actual historical stretch that compounded to the lowest multiple.
// Used by the Monte Carlo tab's Historical mode to show "your plan, run straight
// through history's worst <N>-year stretch" alongside the resampled probability cloud:
// the resampling breaks up real crash-then-recovery sequences, so this puts one
// genuinely bad ordered run back in front of the user.
export const worstHistoricalWindow = (series, windowYears) => {
  const data = Array.isArray(series) ? series.filter(x => Number.isFinite(x)) : [];
  const w = Math.max(1, Math.round(windowYears || 0));
  if (data.length === 0 || w > data.length) return null;

  let worst = null;
  for (let start = 0; start + w <= data.length; start++) {
    let multiple = 1;
    for (let i = start; i < start + w; i++) multiple *= 1 + data[i] / 100;
    if (worst === null || multiple < worst.growthMultiple) {
      worst = {
        startIndex: start,
        growthMultiple: multiple,
        // Compound annual growth rate across that window.
        annualisedReturnPct: (Math.pow(multiple, 1 / w) - 1) * 100,
        windowYears: w
      };
    }
  }
  return worst;
};

// Runs a lump sum + monthly contributions through one fixed ordered return sequence
// (start-of-year contributions, end-of-year growth), for showing what a plan would
// actually have ended with over that worst window.
export const projectThroughSequence = ({ initial = 0, monthly = 0, returnsPct = [] }) => {
  let balance = Math.max(0, initial || 0);
  let contributed = balance;
  for (const r of returnsPct) {
    balance += (monthly || 0) * 12;
    contributed += (monthly || 0) * 12;
    balance *= 1 + (r || 0) / 100;
  }
  return { finalBalance: balance, totalContributed: contributed };
};
