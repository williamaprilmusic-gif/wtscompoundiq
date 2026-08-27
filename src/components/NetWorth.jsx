// src/components/NetWorth.jsx
import React, { useState, useEffect } from 'react';
import './NetWorth.css';

const HISTORY_KEY = 'wts_compoundiq_networth_history';

const NetWorth = ({ country }) => {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      try { setHistory(JSON.parse(raw)); } catch { /* ignore corrupt history */ }
    }
  }, []);

  const addItem = (type) => {
    setItems(prev => [...prev, { id: Date.now(), name: '', type, value: 0 }]);
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: field === 'name' ? value : Number(value) } : i));
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const totalAssets = items.filter(i => i.type === 'asset').reduce((s, i) => s + i.value, 0);
  const totalDebts = items.filter(i => i.type === 'debt').reduce((s, i) => s + i.value, 0);
  const netWorth = totalAssets - totalDebts;

  const lastSnapshot = history.length > 0 ? history[history.length - 1] : null;
  const delta = lastSnapshot ? netWorth - lastSnapshot.netWorth : null;

  const saveSnapshot = () => {
    const entry = { date: new Date().toISOString(), netWorth, totalAssets, totalDebts };
    const updated = [...history, entry].slice(-24); // keep the most recent 24 snapshots
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  return (
    <div className="card net-worth">
      <div className="nw-header">
        <h2>💰 Net Worth Tracker</h2>
        <p>List everything you own (assets) and owe (debts) to see the full picture -- then save snapshots to track it over time.</p>
      </div>

      <div className="nw-columns">
        <div className="nw-column">
          <div className="nw-column-header">
            <h3>Assets</h3>
            <button className="nw-add-btn asset" onClick={() => addItem('asset')}>+ Add Asset</button>
          </div>
          {items.filter(i => i.type === 'asset').length === 0 && <p className="nw-empty">No assets added yet.</p>}
          {items.filter(i => i.type === 'asset').map(i => (
            <div key={i.id} className="nw-item">
              <input type="text" placeholder="e.g. Savings account" value={i.name} onChange={(e) => updateItem(i.id, 'name', e.target.value)} />
              <input type="number" min="0" value={i.value} onChange={(e) => updateItem(i.id, 'value', e.target.value)} />
              <button className="nw-remove" onClick={() => removeItem(i.id)} aria-label="Remove">&times;</button>
            </div>
          ))}
        </div>

        <div className="nw-column">
          <div className="nw-column-header">
            <h3>Debts</h3>
            <button className="nw-add-btn debt" onClick={() => addItem('debt')}>+ Add Debt</button>
          </div>
          {items.filter(i => i.type === 'debt').length === 0 && <p className="nw-empty">No debts added yet.</p>}
          {items.filter(i => i.type === 'debt').map(i => (
            <div key={i.id} className="nw-item">
              <input type="text" placeholder="e.g. Credit card" value={i.name} onChange={(e) => updateItem(i.id, 'name', e.target.value)} />
              <input type="number" min="0" value={i.value} onChange={(e) => updateItem(i.id, 'value', e.target.value)} />
              <button className="nw-remove" onClick={() => removeItem(i.id)} aria-label="Remove">&times;</button>
            </div>
          ))}
        </div>
      </div>

      <div className={`nw-result ${netWorth >= 0 ? 'positive' : 'negative'}`}>
        <div className="nw-result-row">
          <span>Total Assets</span>
          <strong>{country.symbol} {totalAssets.toLocaleString()}</strong>
        </div>
        <div className="nw-result-row">
          <span>Total Debts</span>
          <strong>{country.symbol} {totalDebts.toLocaleString()}</strong>
        </div>
        <div className="nw-result-row main">
          <span>Net Worth</span>
          <strong>{country.symbol} {netWorth.toLocaleString()}</strong>
        </div>
        {delta !== null && (
          <div className={`nw-delta ${delta >= 0 ? 'up' : 'down'}`}>
            {delta >= 0 ? '▲' : '▼'} {country.symbol} {Math.abs(Math.round(delta)).toLocaleString()} since last snapshot
          </div>
        )}
      </div>

      <button className="nw-save-btn" onClick={saveSnapshot}>📸 Save Snapshot</button>

      {history.length > 0 && (
        <div className="nw-history">
          <div className="nw-history-header">
            <h3>History ({history.length} snapshot{history.length === 1 ? '' : 's'})</h3>
            <button className="nw-clear-btn" onClick={clearHistory}>Clear history</button>
          </div>
          <div className="nw-history-list">
            {[...history].reverse().map((h, idx) => (
              <div key={idx} className="nw-history-row">
                <span>{new Date(h.date).toLocaleDateString()}</span>
                <strong>{country.symbol} {h.netWorth.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="nw-note">
        Saved only in your browser's local storage -- nothing is sent anywhere. Up to the most recent 24 snapshots are kept.
      </p>
    </div>
  );
};

export default NetWorth;
