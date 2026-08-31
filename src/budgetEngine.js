// src/budgetEngine.js
// Pure math + shared storage key for Budget.jsx, kept separate from the component so
// other tools (Debt Payoff's extra monthly payment, Power Tools' Debt vs Invest) can
// pull the computed surplus via computeBudgetSummary(readJSONArray(BUDGET_ITEMS_KEY))
// without importing Budget.jsx's whole component tree just to get a number -- same
// reasoning as goalSolver.js/homeAffordability.js living outside any one component.

export const BUDGET_ITEMS_KEY = 'wts_compoundiq_budget_items';

// Fixed category set -- 'Income' items aren't categorized further (a name is enough:
// salary, side income, etc.); expense items pick one of these. 'Other' is the default/
// fallback so every item always has a usable category.
export const EXPENSE_CATEGORIES = ['Housing', 'Transport', 'Food', 'Debt Payments', 'Insurance', 'Savings', 'Other'];

// items: [{ id, kind: 'income' | 'expense', name, category, amount }]
export const computeBudgetSummary = (items) => {
  const income = items.filter(i => i.kind === 'income');
  const expenses = items.filter(i => i.kind === 'expense');
  const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0);
  const surplus = totalIncome - totalExpenses;

  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    category: cat,
    total: expenses.filter(i => (i.category || 'Other') === cat).reduce((s, i) => s + (i.amount || 0), 0)
  }));

  return { totalIncome, totalExpenses, surplus, byCategory };
};
