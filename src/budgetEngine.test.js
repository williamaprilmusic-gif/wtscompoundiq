// src/budgetEngine.test.js
import { describe, it, expect } from 'vitest';
import { computeBudgetSummary, EXPENSE_CATEGORIES, isValidBudgetHistoryEntry } from './budgetEngine.js';

describe('computeBudgetSummary', () => {
  it('sums income and expenses separately and computes the surplus', () => {
    const items = [
      { id: 1, kind: 'income', name: 'Salary', amount: 30000 },
      { id: 2, kind: 'expense', category: 'Housing', name: 'Rent', amount: 10000 },
      { id: 3, kind: 'expense', category: 'Food', name: 'Groceries', amount: 4000 }
    ];
    const result = computeBudgetSummary(items);
    expect(result.totalIncome).toBe(30000);
    expect(result.totalExpenses).toBe(14000);
    expect(result.surplus).toBe(16000);
  });

  it('produces a negative surplus when expenses exceed income', () => {
    const items = [
      { id: 1, kind: 'income', name: 'Salary', amount: 10000 },
      { id: 2, kind: 'expense', category: 'Housing', name: 'Rent', amount: 15000 }
    ];
    expect(computeBudgetSummary(items).surplus).toBe(-5000);
  });

  it('breaks expenses down by every category, including ones with nothing in them', () => {
    const items = [{ id: 1, kind: 'expense', category: 'Housing', name: 'Rent', amount: 5000 }];
    const result = computeBudgetSummary(items);
    expect(result.byCategory).toHaveLength(EXPENSE_CATEGORIES.length);
    expect(result.byCategory.find(c => c.category === 'Housing').total).toBe(5000);
    expect(result.byCategory.find(c => c.category === 'Food').total).toBe(0);
  });

  it('treats a missing/unrecognized category as Other', () => {
    const items = [{ id: 1, kind: 'expense', name: 'Mystery charge', amount: 500 }];
    const result = computeBudgetSummary(items);
    expect(result.byCategory.find(c => c.category === 'Other').total).toBe(500);
  });

  it('handles an empty budget without dividing by zero or crashing', () => {
    const result = computeBudgetSummary([]);
    expect(result).toEqual({ totalIncome: 0, totalExpenses: 0, surplus: 0, byCategory: EXPENSE_CATEGORIES.map(cat => ({ category: cat, total: 0 })) });
  });
});

describe('isValidBudgetHistoryEntry', () => {
  it('accepts a positive or negative finite surplus', () => {
    expect(isValidBudgetHistoryEntry({ surplus: 5000 })).toBe(true);
    expect(isValidBudgetHistoryEntry({ surplus: -2000 })).toBe(true);
    expect(isValidBudgetHistoryEntry({ surplus: 0 })).toBe(true);
  });

  it('rejects a missing, non-numeric, or corrupt surplus', () => {
    expect(isValidBudgetHistoryEntry({})).toBe(false);
    expect(isValidBudgetHistoryEntry({ surplus: 'lots' })).toBe(false);
    expect(isValidBudgetHistoryEntry({ surplus: NaN })).toBe(false);
    expect(isValidBudgetHistoryEntry({ surplus: undefined })).toBe(false);
  });
});
