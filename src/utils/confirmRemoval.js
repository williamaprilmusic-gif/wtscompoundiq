// src/utils/confirmRemoval.js
// Shared "only nag when there's something to lose" pattern for row-remove buttons
// (Net Worth's items, Debt Payoff's debts, Invest's goals). A freshly-added blank/default
// row removed right away shouldn't show a confirm dialog; a row with real user-entered
// data deserves one, since there's no undo once it's gone. Factored into one place so
// each caller only has to supply its own "does this row have real data" check instead of
// re-implementing the confirm call -- a caller that only checks some of its fields (and
// silently drops the rest without asking) is a bug, not a stylistic choice.
export const confirmRemoval = (hasData, message) => !hasData || window.confirm(message);
