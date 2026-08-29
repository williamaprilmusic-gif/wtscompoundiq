// src/utils/dateAgo.js
// Shared "how long ago was this saved" helpers -- used anywhere a saved snapshot's
// age needs to be shown (Dashboard, My Plan, ...).

export const daysBetween = (isoDate) => Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24)));

export const fmtDaysAgo = (d) => d === 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`;
