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

// Illustrative, approximate MSCI World (developed markets, USD) total annual returns,
// 1988-2024 -- a broader, less US-concentrated benchmark than the S&P 500 alone.
// Same caveat as above: approximate/illustrative, not a live feed.
export const MSCI_WORLD_ANNUAL_RETURNS = [
  23.3, 16.6, -17.0, 18.3, -5.2, 22.5, 5.1, 20.7, 13.5, 15.8,
  24.3, 24.9, -13.2, -16.8, -19.9, 33.1, 14.7, 9.5, 20.1, 9.0,
  -40.7, 30.0, 11.8, -5.5, 15.8, 26.7, 4.9, -0.9, 7.5, 22.4,
  -8.7, 27.7, 15.9, 21.8, -18.1, 23.8, 18.7
];

// Illustrative, approximate MSCI Emerging Markets (USD) total annual returns,
// 1988-2024 -- much higher volatility and bigger drawdowns/rallies than developed
// markets (Asian Financial Crisis 1997-98, dot-com, GFC 2008, 2022 dollar strength).
// Approximate/illustrative, not a live feed -- useful as "a much bumpier ride,"
// not as precise history.
export const MSCI_EM_ANNUAL_RETURNS = [
  40.0, 65.0, -10.0, 59.9, 11.4, 74.8, -7.3, -5.2, 6.0, -11.6,
  -25.3, 66.4, -30.6, -2.4, -6.0, 56.3, 26.0, 34.5, 32.6, 39.8,
  -53.2, 79.0, 19.2, -18.2, 18.6, -2.3, -1.8, -14.6, 11.6, 37.8,
  -14.2, 18.9, 18.7, -2.3, -19.7, 10.3, 8.1
];

export const RETURN_MODELS = [
  { key: 'sp500', label: 'US -- S&P 500', data: SP500_ANNUAL_RETURNS },
  { key: 'world', label: 'Global Developed Markets (MSCI World)', data: MSCI_WORLD_ANNUAL_RETURNS },
  { key: 'em', label: 'Emerging Markets (MSCI EM)', data: MSCI_EM_ANNUAL_RETURNS }
];
