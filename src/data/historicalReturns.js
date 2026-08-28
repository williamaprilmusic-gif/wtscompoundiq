// src/data/historicalReturns.js
// Illustrative, approximate S&P 500 total annual return figures (price + dividends),
// 1970-2024 -- used only to give the Monte Carlo simulator's "Historical" mode a real
// distribution of annual returns (fat tails, real crash years, real boom years) to draw
// from instead of a smooth bell curve. These are approximate/illustrative, sourced from
// public long-run market-history references, not a live feed -- treat the same way as
// every other indicative figure in this app, not as precise year-by-year fact.
// The simulator draws each simulated year independently from this list (a bootstrap
// resample, reordered) -- it does not replay any single real historical sequence.
export const SP500_ANNUAL_RETURNS = [
  4.0, 14.3, 19.0, -14.7, -26.5, 37.2, 23.8, -7.2, 6.6, 18.4,
  32.4, -4.9, 21.5, 22.6, 6.3, 31.7, 18.7, 5.3, 16.6, 31.7,
  -3.1, 30.5, 7.6, 10.1, 1.3, 37.6, 23.0, 33.4, 28.6, 21.0,
  -9.1, -11.9, -22.1, 28.7, 10.9, 4.9, 15.8, 5.5, -37.0, 26.5,
  15.1, 2.1, 16.0, 32.4, 13.7, 1.4, 12.0, 21.8, -4.4, 31.5,
  18.4, 28.7, -18.1, 26.3, 25.0
];
