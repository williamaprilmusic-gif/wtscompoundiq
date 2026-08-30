// src/components/DebtPayoff.jsx
import React, { useState } from 'react';
import './DebtPayoff.css';
import Term from './Term';
import { simulatePayoff, avalancheOrder, snowballOrder } from '../debtPayoffEngine';
import { savePlanSection } from '../utils/planStorage';
import { usePersistedState } from '../utils/usePersistedState';
import { confirmRemoval } from '../utils/confirmRemoval';

const DEBTS_KEY = 'wts_compoundiq_debtpayoff_debts';
const EXTRA_KEY = 'wts_compoundiq_debtpayoff_extra';

const DebtPayoff = ({ country }) => {
  const [debts, setDebts] = usePersistedState(DEBTS_KEY, []);
  const [extraMonthly, setExtraMonthly] = usePersistedState(EXTRA_KEY, 0);

  const updateDebt = (id, field, value) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, [field]: Number(value) } : d));
  };

  const addDebt = () => {
    setDebts(prev => [...prev, { id: Date.now(), name: '', balance: 0, rate: 0, minPayment: 0 }]);
  };

  // See NetWorth.jsx's removeItem for why this only confirms when there's real data
  // entered -- a blank row removed right away doesn't need a safety check. Checks all
  // four editable fields (not just name/balance) -- a debt with a rate and min payment
  // already filled in but a balance that's momentarily 0 (e.g. mid-retype) still counts
  // as real data worth confirming before it's silently dropped.
  const removeDebt = (id) => {
    const debt = debts.find(d => d.id === id);
    const hasData = !!(debt && (debt.name.trim() || debt.balance > 0 || debt.rate > 0 || debt.minPayment > 0));
    if (!confirmRemoval(hasData, `Remove "${debt?.name.trim() || 'this debt'}"? This can't be undone.`)) return;
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  const validDebts = debts.filter(d => d.balance > 0);
  const avalanche = simulatePayoff(validDebts, extraMonthly, avalancheOrder);
  const snowball = simulatePayoff(validDebts, extraMonthly, snowballOrder);
  const interestSaved = snowball.totalInterest - avalanche.totalInterest;

  const [saved, setSaved] = useState(false);
  const savePlan = () => {
    savePlanSection('debt', {
      savedAt: new Date().toISOString(),
      totalBalance: validDebts.reduce((sum, d) => sum + d.balance, 0),
      extraMonthly,
      avalancheMonths: avalanche.months,
      avalancheInterest: avalanche.totalInterest
    });
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
            <input type="text" className="debt-name" placeholder="Debt name" aria-label="Debt name" value={d.name} onChange={(e) => setDebts(prev => prev.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))} />
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
