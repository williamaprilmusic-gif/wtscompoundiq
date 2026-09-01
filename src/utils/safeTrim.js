// src/utils/safeTrim.js
// `.trim()` on a field that's `undefined` (a hand-edited or imported backup item
// missing that field entirely) throws and crashes whatever called it -- this was the
// identical `(x.name || '').trim()` / `(x.label || '').trim()` guard, copy-pasted into
// Budget.jsx, DebtPayoff.jsx, Invest.jsx, and NetWorth.jsx's removeItem/removeDebt/
// removeGoal, factored into one place so a future refinement (e.g. also normalizing
// non-string values) only needs to happen once.
export const safeTrim = (value) => (value || '').trim();
