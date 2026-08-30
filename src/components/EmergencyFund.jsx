// src/components/EmergencyFund.jsx
import React, { useState, useEffect, useMemo } from 'react';
import './EmergencyFund.css';
import Term from './Term';
import { savePlanSection } from '../utils/planStorage';
import { usePersistedState } from '../utils/usePersistedState';
import { convertAmount } from '../data/countries';
import { downloadCSV } from '../utils/csv';
import SnapshotChart from './SnapshotChart';

const INPUTS_KEY = 'wts_compoundiq_emergencyfund_inputs';
export const HISTORY_KEY = 'wts_compoundiq_emergencyfund_history';
const DEFAULT_INPUTS = { monthlyExpenses: 0, monthsCoverage: 3, currentSavings: 0, monthlyContribution: 0 };
const HISTORY_SERIES = [{ key: 'total', label: 'Emergency Fund Balance' }];

const EmergencyFund = ({ country }) => {
  const [inputs, setInputs] = usePersistedState(INPUTS_KEY, DEFAULT_INPUTS);
  const { monthlyExpenses, monthsCoverage, currentSavings, monthlyContribution } = inputs;
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      try { setHistory(JSON.parse(raw)); } catch { /* ignore corrupt history */ }
    }
  }, []);

  const updateInput = (field, value) => setInputs(prev => ({ ...prev, [field]: Number(value) }));

  const targetAmount = monthlyExpenses * monthsCoverage;
  const remaining = Math.max(0, targetAmount - currentSavings);
  const progressPct = targetAmount > 0 ? Math.min(100, (currentSavings / targetAmount) * 100) : 100;
  const isFunded = currentSavings >= targetAmount;
  const monthsToTarget = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : null;

  const savePlan = () => {
    savePlanSection('emergencyFund', {
      savedAt: new Date().toISOString(),
      targetAmount,
      currentSavings,
      monthlyContribution
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Same pattern as NetWorth.jsx/DebtPayoff.jsx: record which currency a snapshot was
  // saved in and convert through a memo before use, so switching the global country
  // selector after logging a balance doesn't mislabel an old total as the new currency.
  const convertedHistory = useMemo(() => history.map(h => ({
    date: h.date,
    total: convertAmount(h.total, h.displayCurrency || country.code, country.code)
  })), [history, country.code]);

  const lastSnapshot = convertedHistory.length > 0 ? convertedHistory[convertedHistory.length - 1] : null;
  const delta = lastSnapshot ? currentSavings - lastSnapshot.total : null;

  const saveSnapshot = () => {
    const entry = { date: new Date().toISOString(), total: currentSavings, displayCurrency: country.code };
    const updated = [...history, entry].slice(-24); // keep the most recent 24 snapshots
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = () => {
    if (!window.confirm(`Clear all ${history.length} saved emergency fund snapshot${history.length === 1 ? '' : 's'}? This can't be undone.`)) return;
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const exportHistoryCSV = () => {
    downloadCSV('wts-compoundiq-emergencyfund-history.csv', [
      ['Date', `Balance (${country.currency})`],
      ...convertedHistory.map(h => [new Date(h.date).toLocaleDateString(), Math.round(h.total)])
    ]);
  };

  return (
    <div className="card emergency-fund">
      <div className="ef-header">
        <h2>🛟 <Term k="emergencyFund">Emergency Fund</Term> Tracker</h2>
        <p>Before investing, most guidance recommends this as your financial foundation -- money that's there when life happens, without needing to sell investments or go into debt.</p>
      </div>

      <div className="ef-form">
        <div className="form-group">
          <label>Monthly Essential Expenses ({country.symbol})</label>
          <input type="number" min="0" value={monthlyExpenses} onChange={(e) => updateInput('monthlyExpenses', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Months of Coverage</label>
          <select value={monthsCoverage} onChange={(e) => updateInput('monthsCoverage', e.target.value)}>
            <option value="3">3 months (minimum)</option>
            <option value="6">6 months (standard)</option>
            <option value="9">9 months (cautious)</option>
            <option value="12">12 months (very cautious)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Current Emergency Savings ({country.symbol})</label>
          <input type="number" min="0" value={currentSavings} onChange={(e) => updateInput('currentSavings', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Monthly Contribution ({country.symbol})</label>
          <input type="number" min="0" value={monthlyContribution} onChange={(e) => updateInput('monthlyContribution', e.target.value)} />
        </div>
      </div>

      <div className={`ef-result ${isFunded ? 'funded' : ''}`}>
        <div className="ef-progress-header">
          <span>{country.symbol} {currentSavings.toLocaleString()} of {country.symbol} {targetAmount.toLocaleString()} target</span>
          <span>{progressPct.toFixed(0)}%</span>
        </div>
        <div className="ef-progress-bar">
          <div className="ef-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {isFunded ? (
          <p className="ef-status">✅ Fully funded -- you're covered for {monthsCoverage} months of essential expenses.</p>
        ) : (
          <p className="ef-status">
            {country.symbol} {Math.round(remaining).toLocaleString()} to go.
            {monthsToTarget !== null
              ? ` At ${country.symbol} ${monthlyContribution.toLocaleString()}/month, you'll be fully covered in ${monthsToTarget} month${monthsToTarget === 1 ? '' : 's'}.`
              : ' Set a monthly contribution above to see how long it will take.'}
          </p>
        )}
      </div>

      <p className="ef-note">
        This is simple non-compounding math on purpose -- emergency funds belong in an easily accessible account
        (not invested), so this doesn't assume any investment growth.
      </p>

      <div className="ef-actions">
        <button className="ef-save-plan-btn" onClick={savePlan}>
          {saved ? '✓ Saved to My Plan' : '💾 Save This Plan'}
        </button>
        <button className="ef-save-snapshot-btn" onClick={saveSnapshot}>📸 Log Balance</button>
      </div>

      {history.length > 0 && (
        <div className="ef-history">
          <div className="ef-history-header">
            <h3>Balance History ({history.length} snapshot{history.length === 1 ? '' : 's'})</h3>
            <div className="ef-history-header-actions">
              <button className="history-export-btn" onClick={exportHistoryCSV}>⬇️ Export CSV</button>
              <button className="ef-clear-history-btn" onClick={clearHistory}>Clear history</button>
            </div>
          </div>
          {delta !== null && (
            <div className={`ef-history-delta ${delta >= 0 ? 'up' : 'down'}`}>
              {delta >= 0 ? '▲' : '▼'} {country.symbol} {Math.abs(Math.round(delta)).toLocaleString()} since last snapshot
            </div>
          )}
          {convertedHistory.length > 1 && (
            <SnapshotChart points={convertedHistory} series={HISTORY_SERIES} symbol={country.symbol} />
          )}
          <div className="ef-history-list">
            {[...convertedHistory].reverse().map((h, idx) => (
              <div key={idx} className="ef-history-row">
                <span>{new Date(h.date).toLocaleDateString()}</span>
                <strong>{country.symbol} {Math.round(h.total).toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyFund;
