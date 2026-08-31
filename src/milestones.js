// src/milestones.js
// Pure pattern-matching over history/plan data Dashboard.jsx already reads -- no new
// inputs, no new storage. Detects a handful of "worth celebrating" crossings from
// data the user's already saved elsewhere, so Dashboard can surface them without
// asking for anything new.

// Net worth crossing from <=0 to >0, and every whole order-of-magnitude threshold
// crossed along the way (e.g. first R100k, first R1M) -- computed generically off the
// currency's own magnitude rather than hardcoded rand amounts, so it means the same
// thing in any of the app's 36 currencies.
const NET_WORTH_THRESHOLDS = [100000, 500000, 1000000, 5000000, 10000000];

// points: [{ date, net }] already converted to the display currency, oldest first.
export const detectNetWorthMilestones = (points) => {
  if (points.length < 2) return [];
  const milestones = [];
  let prevNet = points[0].net;
  for (let i = 1; i < points.length; i++) {
    const { date, net } = points[i];
    if (prevNet <= 0 && net > 0) {
      milestones.push({ key: `nw-positive-${date}`, date, label: 'First positive net worth', icon: '🎉' });
    }
    for (const threshold of NET_WORTH_THRESHOLDS) {
      if (prevNet < threshold && net >= threshold) {
        milestones.push({ key: `nw-${threshold}-${date}`, date, label: `Net worth crossed`, amount: threshold, icon: '💰' });
      }
    }
    prevNet = net;
  }
  return milestones;
};

// A debt's balance dropping from >0 to <=0 between two consecutive snapshots -- "fully
// paid off", not just "went down". Uses the same `total` field Debt Payoff/Dashboard
// already track (aggregate debt balance, not a per-debt breakdown).
export const detectDebtClearedMilestone = (points) => {
  if (points.length < 2) return [];
  const first = points[0];
  const last = points[points.length - 1];
  if (first.total > 0 && last.total <= 0) {
    return [{ key: `debt-cleared-${last.date}`, date: last.date, label: 'Debt fully paid off', icon: '🏁' }];
  }
  return [];
};

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
