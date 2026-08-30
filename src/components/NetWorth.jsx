// src/components/NetWorth.jsx
import React, { useState, useEffect, useMemo } from 'react';
import './NetWorth.css';
import Term from './Term';
import { countriesData, convertAmount } from '../data/countries';
import { parseCSV, downloadCSV, cleanCSVNumber } from '../utils/csv';
import { usePersistedState } from '../utils/usePersistedState';
import { confirmRemoval } from '../utils/confirmRemoval';
import SnapshotChart from './SnapshotChart';
import CountrySelect from './CountrySelect';

const HISTORY_SERIES = [
  { key: 'assets', label: 'Assets' },
  { key: 'debts', label: 'Debts' },
  { key: 'net', label: 'Net Worth' }
];

const HISTORY_KEY = 'wts_compoundiq_networth_history';
const ITEMS_KEY = 'wts_compoundiq_networth_items';

// '' is the sentinel code for "follow whatever the Calculator tab's country is" --
// no real country uses an empty code, so it can't collide. Recomputed per-render
// (cheap -- 37 entries) since the "follow" option's label depends on scenarioCountry.
const REPORTING_CURRENCY_OPTIONS = (scenarioCountry) => [
  { code: '', name: `Follow Calculator tab (${scenarioCountry?.name ?? '...'})`, currency: scenarioCountry?.currency ?? '' },
  ...countriesData
];

const downloadTemplate = () => {
  downloadCSV('wts-compoundiq-networth-template.csv', [
    ['name', 'type', 'currency', 'value'],
    ['Savings account', 'asset', 'ZAR', '50000'],
    ['Brokerage account', 'asset', 'USD', '3000'],
    ['Credit card', 'debt', 'ZAR', '8000']
  ]);
};

// scenarioCountry: the Calculator tab's own country -- distinct from `country` (which
// App.jsx resolves to reportingCurrencyCode when set), used only to label the "follow
// the Calculator tab" option below so it's clear what that option actually means.
const NetWorth = ({ country, scenarioCountry, reportingCurrencyCode = '', onReportingCurrencyChange }) => {
  const [items, setItems] = usePersistedState(ITEMS_KEY, []);
  const [history, setHistory] = useState([]);
  const [importError, setImportError] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      try { setHistory(JSON.parse(raw)); } catch { /* ignore corrupt history */ }
    }
  }, []);

  // Each item carries its own currency so a mortgage in one currency and a brokerage
  // account in another can sit in the same list -- new items default to whatever
  // currency the Calculator tab is currently set to.
  const addItem = (type) => {
    setItems(prev => [...prev, { id: Date.now(), name: '', type, value: 0, currency: country.code }]);
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: field === 'name' || field === 'currency' ? value : Number(value) } : i));
  };

  // Confirm before removing -- but only when there's actually something to lose. A
  // freshly-added blank row (empty name, zero value) removed right away shouldn't
  // nag; a row someone's typed real numbers into deserves a safety check, since
  // there's no undo once it's gone.
  const removeItem = (id) => {
    const item = items.find(i => i.id === id);
    const hasData = !!(item && (item.name.trim() || item.value > 0));
    if (!confirmRemoval(hasData, `Remove "${item?.name.trim() || 'this item'}"? This can't be undone.`)) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Bulk-import assets/debts from a CSV (name, type, currency, value columns, any
  // order, case-insensitive headers). Rows that don't parse to a usable name+value are
  // silently skipped rather than failing the whole import -- a spreadsheet export often
  // has a stray blank row or subtotal line.
  const importCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(String(e.target.result));
        if (rows.length < 2) { setImportError('That CSV has no data rows -- see the template for the expected format.'); return; }
        const header = rows[0].map(h => h.trim().toLowerCase());
        const nameIdx = header.indexOf('name');
        const typeIdx = header.indexOf('type');
        const currencyIdx = header.indexOf('currency');
        const valueIdx = header.indexOf('value');
        if (nameIdx === -1 || valueIdx === -1) {
          setImportError('CSV needs at least "name" and "value" columns -- download the template below for the expected format.');
          return;
        }
        const imported = rows.slice(1).map((r, idx) => {
          const rawCurrency = (currencyIdx !== -1 ? r[currencyIdx] || '' : '').trim().toLowerCase();
          // Accept either a country code ("za") or a currency code ("ZAR") -- whichever matches.
          const matchedCountry = countriesData.find(c => c.code === rawCurrency || c.currency.toLowerCase() === rawCurrency);
          return {
            id: Date.now() + idx,
            name: (r[nameIdx] || '').trim().slice(0, 80),
            type: (typeIdx !== -1 && (r[typeIdx] || '').trim().toLowerCase() === 'debt') ? 'debt' : 'asset',
            currency: matchedCountry ? matchedCountry.code : country.code,
            value: cleanCSVNumber(r[valueIdx])
          };
        }).filter(item => item.name && item.value > 0);

        if (imported.length === 0) {
          setImportError('No usable rows found -- each row needs a name and a value greater than 0.');
          return;
        }
        setItems(prev => [...prev, ...imported]);
        setImportError(null);
      } catch {
        setImportError("Could not read that file -- make sure it's a plain .csv export.");
      }
    };
    reader.readAsText(file);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (file) importCSV(file);
    e.target.value = ''; // allow re-selecting the same file later
  };

  // Every total is converted into the currently displayed country's currency before
  // summing -- items already in that currency convert as a no-op, so a single-currency
  // list behaves exactly as before.
  const valueIn = (item) => convertAmount(item.value, item.currency || country.code, country.code);

  const totalAssets = items.filter(i => i.type === 'asset').reduce((s, i) => s + valueIn(i), 0);
  const totalDebts = items.filter(i => i.type === 'debt').reduce((s, i) => s + valueIn(i), 0);
  const netWorth = totalAssets - totalDebts;

  const lastSnapshot = history.length > 0 ? history[history.length - 1] : null;
  // Older snapshots saved before per-snapshot currency tracking existed have no
  // displayCurrency -- treat those as already being in the current display currency
  // (the best available assumption, matching the app's previous behavior) rather than
  // breaking the delta entirely.
  const lastSnapshotNetWorth = lastSnapshot
    ? convertAmount(lastSnapshot.netWorth, lastSnapshot.displayCurrency || country.code, country.code)
    : null;
  const delta = lastSnapshotNetWorth !== null ? netWorth - lastSnapshotNetWorth : null;

  const saveSnapshot = () => {
    const entry = { date: new Date().toISOString(), netWorth, totalAssets, totalDebts, displayCurrency: country.code };
    const updated = [...history, entry].slice(-24); // keep the most recent 24 snapshots
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = () => {
    if (!window.confirm(`Clear all ${history.length} saved net worth snapshot${history.length === 1 ? '' : 's'}? This can't be undone.`)) return;
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  // Converted once and reused by both the chart and the list below instead of calling
  // convertAmount three times per snapshot. Memoized on [history, country.code] so
  // editing an unrelated field (an asset's value, say) doesn't hand the chart a new
  // array reference every render -- SnapshotChart's own useMemo over this prop would
  // otherwise recompute on every keystroke instead of only when history actually changes.
  // Older snapshots saved before totalAssets/totalDebts were tracked have neither --
  // fall back to netWorth/0 so the Assets/Debts lines just render flat at a sane value
  // instead of NaN for those points.
  const convertedHistory = useMemo(() => history.map(h => {
    const from = h.displayCurrency || country.code;
    return {
      date: h.date,
      net: convertAmount(h.netWorth, from, country.code),
      assets: convertAmount(h.totalAssets ?? h.netWorth, from, country.code),
      debts: convertAmount(h.totalDebts ?? 0, from, country.code)
    };
  }), [history, country.code]);

  const exportHistoryCSV = () => {
    downloadCSV('wts-compoundiq-networth-history.csv', [
      ['Date', `Assets (${country.currency})`, `Debts (${country.currency})`, `Net Worth (${country.currency})`],
      ...convertedHistory.map(h => [new Date(h.date).toLocaleDateString(), Math.round(h.assets), Math.round(h.debts), Math.round(h.net)])
    ]);
  };

  return (
    <div className="card net-worth">
      <div className="nw-header">
        <h2>💰 <Term k="netWorth">Net Worth</Term> Tracker</h2>
        <p>List everything you own (assets) and owe (debts) to see the full picture -- then save snapshots to track it over time. Each item can be in its own currency; totals convert to {country.name}'s {country.currency}.</p>
        {onReportingCurrencyChange && (
          <div className="nw-currency-row">
            <span className="nw-currency-label">Display currency</span>
            <CountrySelect
              countries={REPORTING_CURRENCY_OPTIONS(scenarioCountry)}
              value={reportingCurrencyCode}
              onChange={onReportingCurrencyChange}
              ariaLabel="Net Worth display currency"
            />
          </div>
        )}
        <div className="nw-import-row">
          <label className="nw-import-btn">
            📥 Import CSV
            <input type="file" accept=".csv,text/csv" onChange={handleImportFile} hidden />
          </label>
          <button className="nw-template-btn" onClick={downloadTemplate}>Download template</button>
        </div>
        {importError && <p className="nw-import-error">⚠️ {importError}</p>}
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
              <input type="text" placeholder="e.g. Savings account" aria-label="Asset name" value={i.name} onChange={(e) => updateItem(i.id, 'name', e.target.value)} />
              <select aria-label="Asset currency" value={i.currency || country.code} onChange={(e) => updateItem(i.id, 'currency', e.target.value)}>
                {countriesData.map(c => <option key={c.code} value={c.code}>{c.currency}</option>)}
              </select>
              <input type="number" min="0" aria-label="Asset value" value={i.value} onChange={(e) => updateItem(i.id, 'value', e.target.value)} />
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
              <input type="text" placeholder="e.g. Credit card" aria-label="Debt name" value={i.name} onChange={(e) => updateItem(i.id, 'name', e.target.value)} />
              <select aria-label="Debt currency" value={i.currency || country.code} onChange={(e) => updateItem(i.id, 'currency', e.target.value)}>
                {countriesData.map(c => <option key={c.code} value={c.code}>{c.currency}</option>)}
              </select>
              <input type="number" min="0" aria-label="Debt value" value={i.value} onChange={(e) => updateItem(i.id, 'value', e.target.value)} />
              <button className="nw-remove" onClick={() => removeItem(i.id)} aria-label="Remove">&times;</button>
            </div>
          ))}
        </div>
      </div>

      <div className={`nw-result ${netWorth >= 0 ? 'positive' : 'negative'}`}>
        <div className="nw-result-row">
          <span>Total Assets</span>
          <strong>{country.symbol} {Math.round(totalAssets).toLocaleString()}</strong>
        </div>
        <div className="nw-result-row">
          <span>Total Debts</span>
          <strong>{country.symbol} {Math.round(totalDebts).toLocaleString()}</strong>
        </div>
        <div className="nw-result-row main">
          <span>Net Worth</span>
          <strong>{country.symbol} {Math.round(netWorth).toLocaleString()}</strong>
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
            <div className="nw-history-header-actions">
              <button className="nw-export-history-btn" onClick={exportHistoryCSV}>⬇️ Export CSV</button>
              <button className="nw-clear-btn" onClick={clearHistory}>Clear history</button>
            </div>
          </div>
          {history.length > 1 && (
            <SnapshotChart points={convertedHistory} series={HISTORY_SERIES} symbol={country.symbol} />
          )}
          <div className="nw-history-list">
            {[...convertedHistory].reverse().map((h, idx) => (
              <div key={idx} className="nw-history-row">
                <span>{new Date(h.date).toLocaleDateString()}</span>
                <strong>{country.symbol} {Math.round(h.net).toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="nw-note">
        Saved only in your browser's local storage -- nothing is sent anywhere. Up to the most recent 24 snapshots are kept.
        Currency conversions use the same illustrative, approximate exchange rate table as the Compare tab -- not live rates.
      </p>
    </div>
  );
};

export default NetWorth;
