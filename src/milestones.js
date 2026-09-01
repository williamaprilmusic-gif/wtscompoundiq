// src/milestones.js
// Pure pattern-matching over history/plan data Dashboard.jsx already reads -- no new
// inputs, no new storage. Detects a handful of "worth celebrating" crossings from
// data the user's already saved elsewhere, so Dashboard can surface them without
// asking for anything new.
import { convertAmount } from './data/countries';

// Walks consecutive [prev, current] pairs of `points` (each read via `valueKey`),
// calling `detect(prevValue, currentValue, currentPoint)` for each pair and
// collecting whatever milestone objects it returns. Shared by both detectors below --
// previously each reimplemented the identical "init prev from points[0], iterate from
// i=1, compare prev vs current, advance prev" loop by hand, so a future fix to the
// iteration itself (a sorted-input guard, an off-by-one) only needs to happen once here.
const scanConsecutivePairs = (points, valueKey, detect) => {
  if (points.length < 2) return [];
  const milestones = [];
  let prev = points[0][valueKey];
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const current = point[valueKey];
    milestones.push(...detect(prev, current, point));
    prev = current;
  }
  return milestones;
};

// Net worth crossing from <=0 to >0, and every whole order-of-magnitude threshold
// crossed along the way (e.g. first R100k, first R1M) -- defined in ZAR (this app's
// home currency) and converted into whichever currency `points` is actually displayed
// in before comparing, so a VND or JPY user doesn't hit "R100k-equivalent" milestones
// at a wildly different real purchasing power than a GBP or USD user would. See
// detectNetWorthMilestones's `currencyCode` param below.
const NET_WORTH_THRESHOLDS_ZAR = [100000, 500000, 1000000, 5000000, 10000000];

// points: [{ date, net }] already converted to the display currency, oldest first.
// currencyCode: the country code `points` is denominated in (e.g. netWorthCountry.code
// in Dashboard.jsx) -- used only to scale NET_WORTH_THRESHOLDS_ZAR into that currency.
export const detectNetWorthMilestones = (points, currencyCode) => {
  const thresholds = NET_WORTH_THRESHOLDS_ZAR.map(t => convertAmount(t, 'za', currencyCode));
  return scanConsecutivePairs(points, 'net', (prevNet, net, { date }) => {
    const found = [];
    if (prevNet <= 0 && net > 0) {
      found.push({ key: `nw-positive-${date}`, date, label: 'First positive net worth', icon: '🎉' });
    }
    for (const threshold of thresholds) {
      if (prevNet < threshold && net >= threshold) {
        found.push({ key: `nw-${threshold}-${date}`, date, label: 'Net worth crossed', amount: threshold, icon: '💰' });
      }
    }
    return found;
  });
};

// A debt's balance dropping from >0 to <=0 between two consecutive snapshots -- "fully
// paid off", not just "went down". Scans every consecutive pair (via
// scanConsecutivePairs above) rather than only comparing the first and last point, so a
// clear-then-new-debt-then-clear-again history still surfaces every genuine pay-off,
// not just whichever one happens to be bracketed by the oldest/newest snapshot. Uses
// the same `total` field Debt Payoff/Dashboard already track (aggregate debt balance,
// not a per-debt breakdown).
export const detectDebtClearedMilestone = (points) =>
  scanConsecutivePairs(points, 'total', (prevTotal, total, { date }) =>
    prevTotal > 0 && total <= 0 ? [{ key: `debt-cleared-${date}`, date, label: 'Debt fully paid off', icon: '🏁' }] : []
  );

// Emergency Fund reaching (or first reaching) 100% funded, from the currently-saved
// plan snapshot (targetAmount/currentSavings) -- not history-based since EmergencyFund
// doesn't keep a target-vs-actual history, only a balance history.
export const detectEfFundedMilestone = (efPlan) => {
  if (!efPlan || !(efPlan.targetAmount > 0)) return [];
  if (efPlan.currentSavings >= efPlan.targetAmount) {
    return [{ key: 'ef-funded', date: efPlan.savedAt, label: 'Emergency Fund fully funded', icon: '🛟' }];
  }
  return [];
};

// Sorted newest-first, capped -- this is a highlights reel, not a full history browser.
export const MAX_MILESTONES = 6;
export const sortMilestones = (milestones) =>
  [...milestones].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, MAX_MILESTONES);
