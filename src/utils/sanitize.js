// src/utils/sanitize.js
// Shared input floors for the calculator engines. Several modules had their own
// one-line copy of these; centralised so the magic numbers can't drift apart.
//
// floorRate: a rate at or below -100% drives Math.pow to a zero or negative base
// (Infinity, or NaN with a fractional exponent) and isn't a meaningful figure anyway,
// so floor it just above -100.
// clampPct: bound a percentage (a tax rate, a depreciation rate) to [0, 100].
export const RATE_FLOOR = -99.99;
export const floorRate = (value) => Math.max(RATE_FLOOR, value || 0);
export const clampPct = (value) => Math.max(0, Math.min(100, value || 0));
