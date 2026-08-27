// src/components/DebtPayoff.jsx
import React, { useState } from 'react';
import './DebtPayoff.css';
import Term from './Term';

const DEFAULT_DEBTS = [];

const MAX_MONTHS = 600; // 50-year safety cap

// Simulates payoff month-by-month: minimums on every debt, extra cash goes to the
// debt at the front of `order`; once a debt clears, its minimum payment rolls into
// next month's extra (the "snowball"/"avalanche" effect), regardless of strategy.
const simulatePayoff = (debts, extraMonthly, orderFn) => {
  let remaining = debts.map(d => ({ ...d }));
  let totalInterest = 0;
  let months = 0;

  while (remaining.some(d => d.balance > 0.01) && months < MAX_MONTHS) {
    months++;
    const order = orderFn(remaining);

    for (const d of order) {
      if (d.balance <= 0) continue;
      const interest = d.balance * (d.rate / 100 / 12);
      d.balance += interest;
      totalInterest += interest;
      d.balance -= Math.min(d.minPayment, d.balance);
    }

    const freedUpPayment = remaining.filter(d => d.balance <= 0).reduce((s, d) => s + d.minPayment, 0);
    let extra = extraMonthly + freedUpPayment;
    for (const d of order) {
      if (extra <= 0) break;
      if (d.balance <= 0) continue;
      const pay = Math.min(extra, d.balance);
      d.balance -= pay;
      extra -= pay;
    }
  }

  // Determine reachability from whether every debt actually cleared, not from the
  // month count -- a payoff that finishes on exactly the MAX_MONTHS cap is still reachable.
  const reachable = !remaining.some(d => d.balance > 0.01);

  return {
    months,
    totalInterest,
    reachable
  };
};

const avalancheOrder = (debts) => [...debts].sort((a, b) => b.rate - a.rate);
const snowballOrder = (debts) => [...debts].sort((a, b) => a.balance - b.balance);

const PLAN_STORAGE_KEY = 'wts_compoundiq_plan_snapshot';

const DebtPayoff = ({ country }) => {
  const [debts, setDebts] = useState(DEFAULT_DEBTS);
  const [extraMonthly, setExtraMonthly] = useState(0);

  const updateDebt = (id, field, value) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, [field]: Number(value) } : d));
  };

  const addDebt = () => {
    setDebts(prev => [...prev, { id: Date.now(), name: '', balance: 0, rate: 0, minPayment: 0 }]);
  };

  const removeDebt = (id) => setDebts(prev => prev.filter(d => d.id !== id));

  const validDebts = debts.filter(d => d.balance > 0);
  const avalanche = simulatePayoff(validDebts, extraMonthly, avalancheOrder);
  const snowball = simulatePayoff(validDebts, extraMonthly, snowballOrder);
  const interestSaved = snowball.totalInterest - avalanche.totalInterest;

  const [saved, setSaved] = useState(false);
  const savePlan = () => {
    const existing = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || '{}');
    const updated = {
      ...existing,
      debt: {
        savedAt: new Date().toISOString(),
        totalBalance: validDebts.reduce((sum, d) => sum + d.balance, 0),
        extraMonthly,
        avalancheMonths: avalanche.months,
        avalancheInterest: avalanche.totalInterest
      }
    };
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card debt-payoff">
      <div className="debt-header">
        <h2>💳 Debt Payoff Planner</h2>
        <p>Compare the Avalanche (highest interest first -- mathematically fastest) and Snowball (smallest balance first -- most motivating) strategies.</p>
      </div>

      <div className="debt-list">
        {debts.length === 0 && (
          <p className="debt-empty-state">No debts added yet -- click "Add Another Debt" below to enter your first one.</p>
        )}
        {debts.map((d) => (
          <div key={d.id} className="debt-row">
            <input type="text" className="debt-name" placeholder="Debt name" value={d.name} onChange={(e) => setDebts(prev => prev.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))} />
            <div className="debt-field">
              <label>Balance ({country.symbol})</label>
              <input type="number" min="0" value={d.balance} onChange={(e) => updateDebt(d.id, 'balance', e.target.value)} />
            </div>
            <div className="debt-field">
              <label>Rate (%)</label>
              <input type="number" min="0" step="0.1" value={d.rate} onChange={(e) => updateDebt(d.id, 'rate', e.target.value)} />
            </div>
            <div className="debt-field">
              <label>Min Payment ({country.symbol})</label>
              <input type="number" min="0" value={d.minPayment} onChange={(e) => updateDebt(d.id, 'minPayment', e.target.value)} />
            </div>
            <button className="debt-remove" onClick={() => removeDebt(d.id)} aria-label="Remove debt">&times;</button>
          </div>
        ))}
        <button className="debt-add" onClick={addDebt}>+ Add Another Debt</button>
      </div>

      <div className="debt-extra">
        <label>Extra Monthly Payment ({country.symbol}, on top of all minimums)</label>
        <input type="number" min="0" value={extraMonthly} onChange={(e) => setExtraMonthly(Number(e.target.value))} />
      </div>

      {validDebts.length > 0 && (
        <div className="debt-results">
          <div className="debt-result-card avalanche">
            <h3><Term k="avalanche">Avalanche</Term></h3>
            <span className="debt-result-label">Debt-free in</span>
            <strong>{avalanche.reachable ? `${avalanche.months} months` : `50+ years`}</strong>
            <span className="debt-result-label">Total interest paid</span>
            <strong className="interest-figure">{country.symbol} {Math.round(avalanche.totalInterest).toLocaleString()}</strong>
            <div className="debt-order">
              Payoff order: {avalancheOrder(validDebts).map(d => d.name).join(' → ')}
            </div>
          </div>

          <div className="debt-result-card snowball">
            <h3><Term k="snowball">Snowball</Term></h3>
            <span className="debt-result-label">Debt-free in</span>
            <strong>{snowball.reachable ? `${snowball.months} months` : `50+ years`}</strong>
            <span className="debt-result-label">Total interest paid</span>
            <strong className="interest-figure">{country.symbol} {Math.round(snowball.totalInterest).toLocaleString()}</strong>
            <div className="debt-order">
              Payoff order: {snowballOrder(validDebts).map(d => d.name).join(' → ')}
            </div>
          </div>
        </div>
      )}

      {validDebts.length > 0 && interestSaved > 0 && (
        <p className="debt-verdict">
          Avalanche saves you roughly {country.symbol} {Math.round(interestSaved).toLocaleString()} in interest over Snowball here --
          but Snowball clears your first debt faster, which many people find easier to stick with. Pick whichever you'll
          actually follow through on.
        </p>
      )}

      {validDebts.length > 0 && (
        <button className="debt-save-plan-btn" onClick={savePlan}>
          {saved ? '✓ Saved to My Plan' : '💾 Save This Plan'}
        </button>
      )}
    </div>
  );
};

export default DebtPayoff;
