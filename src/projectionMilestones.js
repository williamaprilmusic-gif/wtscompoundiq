// src/projectionMilestones.js
// Forward-looking companion to milestones.js (which reads saved history). Given the
// Calculator's year-by-year projection, finds the first year the balance crosses each
// round-number threshold -- "you hit R1,000,000 in year 18" -- so the headline figure
// comes with a sense of pace, not just an endpoint. Pure; App.jsx feeds it the
// yearlyData it already computed.
import { convertAmount } from './data/countries';

// Thresholds defined in ZAR (the app's home currency) and scaled into the country's
// currency before comparing, the same approach milestones.js uses so a JPY or USD user
// hits sensibly-spaced milestones rather than "R100k-equivalent" ones.
const THRESHOLDS_ZAR = [100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000, 25000000];

// yearlyData: [{ year, balance }, ...] oldest first (calculateCompoundInterest's shape).
// currencyCode: the country the projection is denominated in.
// maxToReturn: cap the list -- it's a highlights strip, not a full table.
export const projectionMilestones = (yearlyData, currencyCode, maxToReturn = 4) => {
  if (!Array.isArray(yearlyData) || yearlyData.length === 0) return [];
  const thresholds = THRESHOLDS_ZAR.map(t => ({ zar: t, local: convertAmount(t, 'za', currencyCode) }));
  const finalBalance = yearlyData[yearlyData.length - 1].balance;

  const hits = [];
  for (const { zar, local } of thresholds) {
    if (local <= 0 || local > finalBalance) continue; // never reached within the horizon
    let prev = 0;
    for (const row of yearlyData) {
      if (prev < local && row.balance >= local) {
        hits.push({ thresholdZar: zar, amount: local, year: row.year });
        break;
      }
      prev = row.balance;
    }
  }

  // If the plan blows past many thresholds, keep the largest few -- those read as the
  // real achievements ("R5m by year 30" beats listing R100k/R250k/R500k).
  if (hits.length > maxToReturn) return hits.slice(hits.length - maxToReturn);
  return hits;
};
