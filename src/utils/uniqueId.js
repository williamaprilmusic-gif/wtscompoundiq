// src/utils/uniqueId.js
// Every "add a row" button across the app (Net Worth items, Debt Payoff debts/lump
// sums, Invest goals, Loan Calculator lump sums, Budget items, and their CSV bulk
// imports) used to mint list-item ids as plain `Date.now()` -- two rows added within
// the same millisecond (a fast double-click, or a same-millisecond addItem racing a
// CSV import's own id generation) silently share an id, and updateItem/removeItem's
// `i.id === id` matching then edits or removes both rows as one.
//
// A plain monotonically-increasing counter, seeded from Date.now() so ids still sort
// roughly chronologically and don't collide with any id already read back out of
// localStorage from a previous session: every call is strictly greater than the last,
// with no modulo/wraparound to accidentally collide with itself, unlike an earlier
// version of this file that combined Date.now() with a counter that wrapped every
// 1000 calls -- a tight loop (a bulk CSV import, or this file's own test) can call
// uniqueId() thousands of times within a single millisecond, and 1000 calls is nowhere
// near enough headroom for that. At one call per id, reaching Number.MAX_SAFE_INTEGER
// from here would take longer than any realistic browser session.
let next = Date.now();

export const uniqueId = () => next++;
