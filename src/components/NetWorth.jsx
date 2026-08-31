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
import AllocationChart from './AllocationChart';

const HISTORY_SERIES = [
  { key: 'assets', label: 'Assets' },
  { key: 'debts', label: 'Debts' },
  { key: 'net', label: 'Net Worth' }
];

// Fixed category sets per item type -- 'Other' is the default for a new item and the
// fallback for anything a CSV import can't match, so every item always has a usable
// category rather than an empty/undefined one breaking the allocation chart below.
const ASSET_CATEGORIES = ['Cash', 'Investments', 'Property', 'Retirement', 'Vehicle', 'Other'];
const DEBT_CATEGORIES = ['Credit Card', 'Loan', 'Bond/Mortgage', 'Other'];

// Fixed hue per category, assigned by identity (never cycled/generated) -- see the
// dataviz skill. 'Other' reads as neutral/miscellaneous everywhere else in the app
// (SnapshotChart's 'standard' series), so it gets --mut here too. Loan/Vehicle sharing
// a hue is fine -- they never appear in the same chart (one's an asset category, the
// other a debt category, and AllocationChart only ever renders one type's items).
const CATEGORY_COLOR_VAR = {
  Cash: '--accent',
  Investments: '--accent-green',
  Property: '--accent-purple',
  Retirement: '--accent-blue-deep',
  Vehicle: '--accent-yellow',
  'Credit Card': '--accent-red',
  Loan: '--accent-yellow',
  'Bond/Mortgage': '--accent-purple',
  Other: '--mut'
};

export const HISTORY_KEY = 'wts_compoundiq_networth_history';
const ITEMS_KEY = 'wts_compoundiq_networth_items';

// A net worth history entry is only safe to feed to convertAmount/SnapshotChart when
// netWorth, and (if present) totalAssets/totalDebts, are all real numbers -- a
// hand-edited or partially-written localStorage value (or an incompatible imported
// backup) could leave any of the three non-numeric, and totalAssets/totalDebts can be
// independently corrupt while netWorth itself stays valid. One bad point would
// otherwise poison SnapshotChart's min/max scaling (every point on the line, not just
// the bad one) or show as "NaN" on a headline card. Exported so Dashboard.jsx's own
// net worth trend/headline card -- which reads this same history key -- can apply the
// identical guard instead of duplicating it.
export const isValidNetWorthEntry = (h) => Number.isFinite(h.netWorth)
  && (h.totalAssets == null || Number.isFinite(h.totalAssets))
  && (h.totalDebts == null || Number.isFinite(h.totalDebts));

// '' is the sentinel code for "follow whatever the Calculator tab's country is" --
// no real country uses an empty code, so it can't collide. Recomputed per-render
// (cheap -- 37 entries) since the "follow" option's label depends on scenarioCountry.
const REPORTING_CURRENCY_OPTIONS = (scenarioCountry) => [
  { code: '', name: `Follow Calculator tab (${scenarioCountry?.name ?? '...'})`, currency: scenarioCountry?.currency ?? '' },
  ...countriesData
];

const downloadTemplate = () => {
  downloadCSV('wts-compoundiq-networth-template.csv', [
    ['name', 'type', 'category', 'currency', 'value'],
    ['Savings account', 'asset', 'Cash', 'ZAR', '50000'],
    ['Brokerage account', 'asset', 'Investments', 'USD', '3000'],
    ['Credit card', 'debt', 'Credit Card', 'ZAR', '8000']
  ]);
};

// scenarioCountry: the Calculator tab's own country -- distinct from `country` (which
// App.jsx resolves to reportingCurrencyCode when set), used only to label the "follow
// the Calculator tab" option below so it's clear what that option actually means.
const NetWorth = ({ country, scenarioCountry, reportingCurrencyCode = '', onReportingCurrencyChange, canFxStressTest = false, onOpenPricing }) => {
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
  // currency this tab is currently displaying in (`country` here is Net Worth's own
  // reporting currency -- see the "Display currency" picker above, which can be pinned
  // independently of the Calculator tab's country).
  const addItem = (type) => {
    setItems(prev => [...prev, { id: Date.now(), name: '', type, value: 0, currency: country.code, category: 'Other' }]);
  };

  const updateItem = (id, field, value) => {
    const isTextField = field === 'name' || field === 'currency' || field === 'category';
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: isTextField ? value : Number(value) } : i));
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
        const categoryIdx = header.indexOf('category');
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
          const type = (typeIdx !== -1 && (r[typeIdx] || '').trim().toLowerCase() === 'debt') ? 'debt' : 'asset';
          const categoryOptions = type === 'debt' ? DEBT_CATEGORIES : ASSET_CATEGORIES;
          const rawCategory = (categoryIdx !== -1 ? r[categoryIdx] || '' : '').trim().toLowerCase();
          const matchedCategory = categoryOptions.find(c => c.toLowerCase() === rawCategory) || 'Other';
          return {
            id: Date.now() + idx,
            name: (r[nameIdx] || '').trim().slice(0, 80),
            type,
            category: matchedCategory,
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

  // Category breakdown for the allocation donuts below -- every category always
  // appears (even at value 0) so the color assignment stays stable as items move
  // between categories; AllocationChart itself drops the zero-value ones before
  // rendering a slice for them.
  const assetSegments = ASSET_CATEGORIES.map(cat => ({
    key: cat,
    label: cat,
    colorVar: CATEGORY_COLOR_VAR[cat],
    value: items.filter(i => i.type === 'asset' && (i.category || 'Other') === cat).reduce((s, i) => s + valueIn(i), 0)
  }));
  const debtSegments = DEBT_CATEGORIES.map(cat => ({
    key: cat,
    label: cat,
    colorVar: CATEGORY_COLOR_VAR[cat],
    value: items.filter(i => i.type === 'debt' && (i.category || 'Other') === cat).reduce((s, i) => s + valueIn(i), 0)
  }));

  // FX Stress Test (Ultra): only meaningful when at least one item is actually in a
  // different currency from the display currency -- a same-currency-only list has
  // nothing for a shock to move. Applies uniformly to every foreign-currency item, as
  // if the display currency itself weakened/strengthened by fxShockPct against
  // everything else at once (the realistic scenario for a SA user with offshore
  // holdings: "if the Rand weakens 15%, what happens to my net worth?") rather than
  // shocking one currency pair at a time.
  const hasForeignCurrencyItems = items.some(i => (i.currency || country.code) !== country.code);
  const [fxShockPct, setFxShockPct] = useState(0);
  const valueInShocked = (item) => {
    const base = valueIn(item);
    return (item.currency || country.code) === country.code ? base : base * (1 + fxShockPct / 100);
  };
  const shockedTotalAssets = items.filter(i => i.type === 'asset').reduce((s, i) => s + valueInShocked(i), 0);
  const shockedTotalDebts = items.filter(i => i.type === 'debt').reduce((s, i) => s + valueInShocked(i), 0);
  const shockedNetWorth = shockedTotalAssets - shockedTotalDebts;

  // Converted once and reused by the delta below, the chart, and the list further down
  // instead of calling convertAmount three times per snapshot. Memoized on
  // [history, country.code] so editing an unrelated field (an asset's value, say)
  // doesn't hand the chart a new array reference every render -- SnapshotChart's own
  // useMemo over this prop would otherwise recompute on every keystroke instead of only
  // when history actually changes. Older snapshots saved before totalAssets/totalDebts
  // were tracked have neither -- fall back to netWorth/0 so the Assets/Debts lines just
  // render flat at a sane value instead of NaN for those points. Non-numeric entries are
  // dropped by isValidNetWorthEntry above before any of this runs -- see there for why.
  const convertedHistory = useMemo(() => history
    .filter(isValidNetWorthEntry)
    .map(h => {
      const from = h.displayCurrency || country.code;
      return {
        date: h.date,
        net: convertAmount(h.netWorth, from, country.code),
        assets: convertAmount(h.totalAssets ?? h.netWorth, from, country.code),
        debts: convertAmount(h.totalDebts ?? 0, from, country.code)
      };
    }), [history, country.code]);

  // Derived from convertedHistory (not raw history) so a non-numeric netWorth in the
  // latest entry -- already filtered out above -- can't turn this into a NaN delta,
  // same pattern DebtPayoff.jsx/EmergencyFund.jsx use for their own deltas.
  const lastSnapshot = convertedHistory.length > 0 ? convertedHistory[convertedHistory.length - 1] : null;
  const delta = lastSnapshot ? netWorth - lastSnapshot.net : null;

  // Forecast: extends the chart with a dashed continuation of the trend, via
  // SnapshotChart's opt-in projectedPoints prop. Simplification, stated below in the
  // note: assets compound at forecastRate/yr, debts are assumed to hold flat at their
  // last known value (this doesn't know your Debt Payoff plan's payoff timeline), and
  // net worth is just their difference each year. Needs 2+ real points -- a forecast
  // needs a real trend to extrapolate from, same requirement SnapshotChart itself has.
  const [forecastEnabled, setForecastEnabled] = useState(true);
  const [forecastYears, setForecastYears] = useState(5);
  const [forecastRate, setForecastRate] = useState(8);
  const canForecast = convertedHistory.length > 1;
  const projectedPoints = useMemo(() => {
    if (!canForecast || !forecastEnabled || forecastYears <= 0) return [];
    const last = convertedHistory[convertedHistory.length - 1];
    const startDate = new Date(last.date);
    const points = [];
    for (let y = 1; y <= forecastYears; y++) {
      const projectedAssets = last.assets * Math.pow(1 + forecastRate / 100, y);
      const date = new Date(startDate);
      date.setFullYear(date.getFullYear() + y);
      points.push({ date: date.toISOString(), assets: projectedAssets, debts: last.debts, net: projectedAssets - last.debts });
    }
    return points;
  }, [canForecast, forecastEnabled, forecastYears, forecastRate, convertedHistory]);

  const saveSnapshot = () => {
    const entry = { date: new Date().toISOString(), netWorth, totalAssets, totalDebts, displayCurrency: country.code };
    const updated = [...history, entry].slice(-24); // keep the most recent 24 snapshots
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = () => {
    // No count in the message -- the header above shows convertedHistory.length (what's
    // actually visible) while this clears the raw, unfiltered history.length (which can
    // include a corrupt entry hidden from that count); stating a specific number here
    // risked contradicting the header instead of just confirming the action.
    if (!window.confirm("Clear all saved net worth snapshots? This can't be undone.")) return;
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

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
              <select aria-label="Asset category" value={i.category || 'Other'} onChange={(e) => updateItem(i.id, 'category', e.target.value)}>
                {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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
              <select aria-label="Debt category" value={i.category || 'Other'} onChange={(e) => updateItem(i.id, 'category', e.target.value)}>
                {DEBT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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

      {(totalAssets > 0 || totalDebts > 0) && (
        <div className="nw-allocation">
          {totalAssets > 0 && (
            <div className="nw-allocation-card">
              <h3>Asset Allocation</h3>
              <AllocationChart segments={assetSegments} symbol={country.symbol} />
            </div>
          )}
          {totalDebts > 0 && (
            <div className="nw-allocation-card">
              <h3>Debt Breakdown</h3>
              <AllocationChart segments={debtSegments} symbol={country.symbol} />
            </div>
          )}
        </div>
      )}

      {hasForeignCurrencyItems && (
        canFxStressTest ? (
          <div className="nw-fx-stress">
            <h3>💱 FX Stress Test</h3>
            <p className="nw-fx-stress-desc">
              See how much your net worth actually moves if {country.currency} shifts against everything you hold in a
              different currency -- realistic for anyone with offshore holdings.
            </p>
            <div className="nw-fx-stress-slider-row">
              <input
                type="range"
                min="-40"
                max="40"
                step="1"
                value={fxShockPct}
                onChange={(e) => setFxShockPct(Number(e.target.value))}
                aria-label={`${country.currency} shock percentage`}
              />
              <span className="nw-fx-stress-pct">{fxShockPct > 0 ? '+' : ''}{fxShockPct}%</span>
            </div>
            <div className="nw-fx-stress-grid">
              <div className="nw-fx-stress-stat">
                <span>Net Worth at {fxShockPct > 0 ? '+' : ''}{fxShockPct}%</span>
                <strong className={shockedNetWorth >= 0 ? 'positive' : 'negative'}>{country.symbol} {Math.round(shockedNetWorth).toLocaleString()}</strong>
              </div>
              <div className="nw-fx-stress-stat">
                <span>Change from Today</span>
                <strong className={shockedNetWorth - netWorth >= 0 ? 'positive' : 'negative'}>
                  {shockedNetWorth - netWorth >= 0 ? '+' : '-'}{country.symbol} {Math.abs(Math.round(shockedNetWorth - netWorth)).toLocaleString()}
                </strong>
              </div>
            </div>
            <p className="nw-fx-stress-note">
              Assumes every foreign-currency item moves by the same {fxShockPct}% at once (a simplification -- real
              currencies don't move in lockstep) and uses this app's illustrative, approximate exchange rate table, not
              live rates.
            </p>
          </div>
        ) : (
          <div className="nw-fx-stress-upsell">
            <p>
              💱 <strong>FX Stress Test</strong> -- see how much your net worth actually moves if {country.currency} shifts
              against your offshore holdings. Included on Ultra.{' '}
              {onOpenPricing && <button type="button" className="nw-fx-stress-upsell-btn" onClick={onOpenPricing}>View Pricing</button>}
            </p>
          </div>
        )
      )}

      <button className="nw-save-btn" onClick={saveSnapshot}>📸 Save Snapshot</button>

      {history.length > 0 && (
        <div className="nw-history">
          <div className="nw-history-header">
            {/* convertedHistory.length, not history.length -- a corrupt/non-numeric entry is
                filtered out of convertedHistory above but stays in raw history (so "Clear
                history" below can still remove it), and this count should match what the
                list/chart below actually display rather than what's stored. */}
            <h3>History ({convertedHistory.length} snapshot{convertedHistory.length === 1 ? '' : 's'})</h3>
            <div className="nw-history-header-actions">
              <button className="history-export-btn" onClick={exportHistoryCSV}>⬇️ Export CSV</button>
              <button className="nw-clear-btn" onClick={clearHistory}>Clear history</button>
            </div>
          </div>
          {canForecast && (
            <div className="nw-forecast-controls">
              <label className="nw-forecast-toggle">
                <input type="checkbox" checked={forecastEnabled} onChange={(e) => setForecastEnabled(e.target.checked)} />
                Show forecast
              </label>
              {forecastEnabled && (
                <>
                  <label>
                    <span>Years</span>
                    <input type="number" min="1" max="30" value={forecastYears} onChange={(e) => setForecastYears(Number(e.target.value))} />
                  </label>
                  <label>
                    <span>Assumed annual growth (%)</span>
                    <input type="number" step="0.5" value={forecastRate} onChange={(e) => setForecastRate(Number(e.target.value))} />
                  </label>
                </>
              )}
            </div>
          )}
          {convertedHistory.length > 1 && (
            <SnapshotChart points={convertedHistory} series={HISTORY_SERIES} symbol={country.symbol} projectedPoints={projectedPoints} />
          )}
          {projectedPoints.length > 0 && (
            <p className="nw-forecast-note">
              Dashed line: assumes your assets keep compounding at {forecastRate}%/yr and your debts stay flat at their
              current total (this doesn't know your Debt Payoff plan's payoff timeline) -- a simple illustration, not a
              prediction.
            </p>
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
