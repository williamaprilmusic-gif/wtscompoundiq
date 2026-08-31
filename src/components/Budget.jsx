// src/components/Budget.jsx
import React, { useState } from 'react';
import './Budget.css';
import { usePersistedState } from '../utils/usePersistedState';
import { confirmRemoval } from '../utils/confirmRemoval';
import { BUDGET_ITEMS_KEY, EXPENSE_CATEGORIES, computeBudgetSummary } from '../budgetEngine';
import { EXTRA_KEY as DEBT_EXTRA_KEY } from './DebtPayoff';
import AllocationChart from './AllocationChart';
import { uniqueId } from '../utils/uniqueId';

// Fixed hue per expense category, assigned by identity -- same convention as
// NetWorth.jsx's CATEGORY_COLOR_VAR. 'Other' reads as neutral everywhere else in the
// app, so it gets --mut here too.
const EXPENSE_CATEGORY_COLOR_VAR = {
  Housing: '--accent-purple',
  Transport: '--accent-yellow',
  Food: '--accent-green',
  'Debt Payments': '--accent-red',
  Insurance: '--accent-blue-deep',
  Savings: '--accent',
  Other: '--mut'
};

const Budget = ({ country }) => {
  const [items, setItems] = usePersistedState(BUDGET_ITEMS_KEY, []);
  const [pushed, setPushed] = useState(false);

  const addItem = (kind) => setItems(prev => [...prev, { id: uniqueId(), kind, name: '', category: 'Other', amount: 0 }]);

  const updateItem = (id, field, value) => {
    const isTextField = field === 'name' || field === 'category';
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: isTextField ? value : Number(value) } : i));
  };

  // Same "only confirm when there's real data" pattern as NetWorth.jsx's removeItem.
  // `(item.name || '')` guards a hand-edited/imported backup item that's missing a
  // `name` field entirely -- `.trim()` on a bare `undefined` throws and crashes the
  // remove action instead of just falling back to the "this line item" label.
  const removeItem = (id) => {
    const item = items.find(i => i.id === id);
    const hasData = !!(item && ((item.name || '').trim() || item.amount > 0));
    if (!confirmRemoval(hasData, `Remove "${(item?.name || '').trim() || 'this line item'}"? This can't be undone.`)) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const summary = computeBudgetSummary(items);
  const expenseSegments = summary.byCategory.map(c => ({
    key: c.category, label: c.category, value: c.total, colorVar: EXPENSE_CATEGORY_COLOR_VAR[c.category]
  }));

  // Writes straight to Debt Payoff's own storage key -- picked up next time that tab
  // mounts (tabs in this app fully unmount on navigation, so there's no stale in-memory
  // state to worry about; see usePersistedState.js's own note on this). Only offered
  // when there's a real surplus to send -- pushing a negative or zero number into
  // "extra monthly payment" wouldn't mean anything there.
  const pushSurplusToDebtPayoff = () => {
    if (summary.surplus <= 0) return;
    try {
      localStorage.setItem(DEBT_EXTRA_KEY, JSON.stringify(Math.round(summary.surplus)));
      setPushed(true);
      setTimeout(() => setPushed(false), 2500);
    } catch { /* ignore (private mode, storage full, etc.) */ }
  };

  const incomeItems = items.filter(i => i.kind === 'income');
  const expenseItems = items.filter(i => i.kind === 'expense');

  return (
    <div className="card budget-tracker">
      <div className="budget-header">
        <h2>🧮 Budget / Cash Flow Tracker</h2>
        <p>List what comes in and what goes out each month to see your real surplus -- the number every other planning tool here (Debt Payoff's extra payment, Power Tools' "extra cash available") ultimately depends on.</p>
      </div>

      <div className="budget-columns">
        <div className="budget-column">
          <div className="budget-column-header">
            <h3>Income</h3>
            <button className="budget-add-btn income" onClick={() => addItem('income')}>+ Add Income</button>
          </div>
          {incomeItems.length === 0 && <p className="budget-empty">No income added yet.</p>}
          {incomeItems.map(i => (
            <div key={i.id} className="budget-item">
              <input type="text" placeholder="e.g. Salary" aria-label="Income name" value={i.name} onChange={(e) => updateItem(i.id, 'name', e.target.value)} />
              <input type="number" min="0" aria-label="Income amount" value={i.amount} onChange={(e) => updateItem(i.id, 'amount', e.target.value)} />
              <button className="budget-remove" onClick={() => removeItem(i.id)} aria-label="Remove">&times;</button>
            </div>
          ))}
        </div>

        <div className="budget-column">
          <div className="budget-column-header">
            <h3>Expenses</h3>
            <button className="budget-add-btn expense" onClick={() => addItem('expense')}>+ Add Expense</button>
          </div>
          {expenseItems.length === 0 && <p className="budget-empty">No expenses added yet.</p>}
          {expenseItems.map(i => (
            <div key={i.id} className="budget-item budget-item-expense">
              <input type="text" placeholder="e.g. Rent" aria-label="Expense name" value={i.name} onChange={(e) => updateItem(i.id, 'name', e.target.value)} />
              <select aria-label="Expense category" value={i.category || 'Other'} onChange={(e) => updateItem(i.id, 'category', e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min="0" aria-label="Expense amount" value={i.amount} onChange={(e) => updateItem(i.id, 'amount', e.target.value)} />
              <button className="budget-remove" onClick={() => removeItem(i.id)} aria-label="Remove">&times;</button>
            </div>
          ))}
        </div>
      </div>

      <div className={`budget-result ${summary.surplus >= 0 ? 'positive' : 'negative'}`}>
        <div className="budget-result-row">
          <span>Total Income</span>
          <strong>{country.symbol} {Math.round(summary.totalIncome).toLocaleString()}</strong>
        </div>
        <div className="budget-result-row">
          <span>Total Expenses</span>
          <strong>{country.symbol} {Math.round(summary.totalExpenses).toLocaleString()}</strong>
        </div>
        <div className="budget-result-row main">
          <span>{summary.surplus >= 0 ? 'Monthly Surplus' : 'Monthly Deficit'}</span>
          <strong>{country.symbol} {Math.abs(Math.round(summary.surplus)).toLocaleString()}</strong>
        </div>
      </div>

      {summary.surplus > 0 && (
        <button className="budget-push-btn" onClick={pushSurplusToDebtPayoff}>
          {pushed ? '✓ Sent -- open Debt Payoff to see it applied' : `→ Send ${country.symbol}${Math.round(summary.surplus).toLocaleString()}/mo surplus to Debt Payoff's extra payment`}
        </button>
      )}

      {summary.totalExpenses > 0 && (
        <div className="budget-allocation">
          <h3>Expense Breakdown</h3>
          <AllocationChart segments={expenseSegments} symbol={country.symbol} />
        </div>
      )}

      <p className="budget-note">
        Saved only in your browser's local storage -- nothing is sent anywhere. This is a simple monthly snapshot (no
        history tracking, unlike Net Worth/Debt Payoff/Emergency Fund) -- re-enter or adjust amounts as your budget changes.
      </p>
    </div>
  );
};

export default Budget;
