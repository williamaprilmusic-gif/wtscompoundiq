// src/utils/chartFormat.js
// Small pure formatting helpers shared by the app's dependency-free inline-SVG line
// charts (GrowthChart.jsx, NetWorthHistoryChart.jsx) so axis-tick rounding and compact
// number formatting stay identical everywhere instead of being copy-pasted per chart.

// Round a value up to a "nice" number so axis ticks land on clean figures
// (0 / 1,000 / 2,000, never 0 / 1,247 / 2,494).
export const niceCeil = (value) => {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let niceNormalized;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 2.5) niceNormalized = 2.5;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
};

// Mirror of niceCeil for the negative side, for charts (like net worth) whose axis
// can dip below zero.
export const niceFloor = (value) => value >= 0 ? 0 : -niceCeil(-value);

// Compact axis/tooltip number formatting: 1234567 -> "1.2M", -4200 -> "-4.2K". Safe for
// charts whose values are always >= 0 (the sign branch just never triggers there).
export const formatCompact = (value) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000000) return sign + (abs / 1000000).toFixed(abs >= 10000000 ? 0 : 1) + 'M';
  if (abs >= 1000) return sign + (abs / 1000).toFixed(abs >= 10000 ? 0 : 1) + 'K';
  const rounded = Math.round(abs);
  // A small negative value (e.g. -0.4) rounds to 0 -- don't print "-0" for it; only
  // keep the sign once there's a nonzero rounded magnitude to attach it to.
  return (rounded === 0 ? '' : sign) + rounded.toString();
};
