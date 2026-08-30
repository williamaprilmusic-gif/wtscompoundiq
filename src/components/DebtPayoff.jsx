// src/components/DebtPayoff.jsx
import React, { useState, useEffect, useMemo } from 'react';
import './DebtPayoff.css';
import Term from './Term';
import { simulatePayoff, avalancheOrder, snowballOrder } from '../debtPayoffEngine';
import { savePlanSection } from '../utils/planStorage';
import { usePersistedState } from '../utils/usePersistedState';
import { confirmRemoval } from '../utils/confirmRemoval';
import { parseCSV, downloadCSV, cleanCSVNumber } from '../utils/csv';
import { convertAmount } from '../data/countries';
import SnapshotChart from './SnapshotChart';

const DEBTS_KEY = 'wts_compoundiq_debtpayoff_debts';
const EXTRA_KEY = 'wts_compoundiq_debtpayoff_extra';
const LUMPSUMS_KEY = 'wts_compoundiq_debtpayoff_lumpsums';
export const HISTORY_KEY = 'wts_compoundiq_debtpayoff_history';

const HISTORY_SERIES = [{ key: 'total', label: 'Total Debt Balance' }];

const downloadTemplate = () => {
  downloadCSV('wts-compoundiq-debts-template.csv', [
    ['name', 'balance', 'rate', 'minPayment'],
    ['Credit Card', '20000', '22', '500'],
    ['Car Loan', '100000', '11', '2000']
  ]);
};

const DebtPayoff = ({ country }) => {
  const [debts, setDebts] = usePersistedState(DEBTS_KEY, []);
  const [extraMonthly, setExtraMonthly] = usePersistedState(EXTRA_KEY, 0);
  const [lumpSums, setLumpSums] = usePersistedState(LUMPSUMS_KEY, []);
  const [history, setHistory] = useState([]);
  const [importError, setImportError] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      try { setHistory(JSON.parse(raw)); } catch { /* ignore corrupt history */ }
    }
  }, []);

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

  // Bulk-import debts from a CSV (name, balance, rate, minPayment columns, any order,
  // case-insensitive headers) -- same tolerant parsing approach as Net Worth's CSV
  // import (skip unusable rows rather than failing the whole file).
  const importCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(String(e.target.result));
        if (rows.length < 2) { setImportError('That CSV has no data rows -- see the template for the expected format.'); return; }
        const header = rows[0].map(h => h.trim().toLowerCase());
        const nameIdx = header.indexOf('name');
        const balanceIdx = header.indexOf('balance');
        const rateIdx = header.indexOf('rate');
        const minPaymentIdx = header.indexOf('minpayment');
        if (nameIdx === -1 || balanceIdx === -1) {
          setImportError('CSV needs at least "name" and "balance" columns -- download the template below for the expected format.');
          return;
        }
        const imported = rows.slice(1).map((r, idx) => ({
          id: Date.now() + idx,
          name: (r[nameIdx] || '').trim().slice(0, 80),
          balance: cleanCSVNumber(r[balanceIdx]),
          rate: rateIdx !== -1 ? cleanCSVNumber(r[rateIdx]) : 0,
          minPayment: minPaymentIdx !== -1 ? cleanCSVNumber(r[minPaymentIdx]) : 0
        })).filter(d => d.name && d.balance > 0);

        if (imported.length === 0) {
          setImportError('No usable rows found -- each row needs a name and a balance greater than 0.');
          return;
        }
        setDebts(prev => [...prev, ...imported]);
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

  // One-off extra payments -- a bonus, tax refund, etc. thrown at the debt in a
  // specific month, on top of the regular monthly extra (mirrors the Calculator
  // tab's lump-sum contributions).
  const addLumpSum = () => setLumpSums(prev => [...prev, { id: Date.now(), month: 1, amount: 0 }]);
  const updateLumpSum = (id, field, value) => setLumpSums(prev => prev.map(l => l.id === id ? { ...l, [field]: Number(value) } : l));
  const removeLumpSum = (id) => setLumpSums(prev => prev.filter(l => l.id !== id));

  // Guard against a transient/blank "month" value while the user is mid-edit (clearing
  // the field to retype it sends Number('') = 0 through here, same failure mode Invest.jsx's
  // goalYears guard documents). simulatePayoff's month counter starts at 1, so an
  // unclamped 0 would never match and the lump sum would silently never apply. Clamp
  // only for the calculation, not the stored/displayed value.
  const safeLumpSums = lumpSums.map(l => ({ ...l, month: l.month > 0 ? l.month : 1 }));

  const validDebts = debts.filter(d => d.balance > 0);
  const avalanche = simulatePayoff(validDebts, extraMonthly, avalancheOrder, safeLumpSums);
  const snowball = simulatePayoff(validDebts, extraMonthly, snowballOrder, safeLumpSums);
  const interestSaved = snowball.totalInterest - avalanche.totalInterest;
  const totalBalance = validDebts.reduce((sum, d) => sum + d.balance, 0);

  const [saved, setSaved] = useState(false);
  const savePlan = () => {
    savePlanSection('debt', {
      savedAt: new Date().toISOString(),
      totalBalance,
      extraMonthly,
      avalancheMonths: avalanche.months,
      avalancheInterest: avalanche.totalInterest
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Snapshots record which currency they were saved in (the country selector is
  // global and can change between snapshots) and get converted to the currently
  // selected currency before use here -- same fix NetWorth.jsx applies to its own
  // history, so switching currency doesn't silently mislabel old totals as if they
  // were already in the new currency. Older snapshots saved before this had no
  // displayCurrency -- treat those as already being in the current display currency,
  // matching this app's previous (single-currency) behavior.
  // A hand-edited/corrupt entry with a non-numeric `total` (or an incompatible
  // imported backup) is dropped outright rather than fed to convertAmount -- one NaN
  // point would otherwise poison SnapshotChart's min/max scaling and break the whole
  // chart, not just that one point (see Dashboard.jsx's identical guard on this same
  // history key).
  const convertedHistory = useMemo(() => history
    .filter(h => Number.isFinite(h.total))
    .map(h => ({
      date: h.date,
      total: convertAmount(h.total, h.displayCurrency || country.code, country.code)
    })), [history, country.code]);

  const lastSnapshot = convertedHistory.length > 0 ? convertedHistory[convertedHistory.length - 1] : null;
  const delta = lastSnapshot ? totalBalance - lastSnapshot.total : null;

  const saveSnapshot = () => {
    const entry = { date: new Date().toISOString(), total: totalBalance, displayCurrency: country.code };
    const updated = [...history, entry].slice(-24); // keep the most recent 24 snapshots
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = () => {
    // No count in the message -- see NetWorth.jsx's clearHistory for why (the header
    // above and this raw history.length can diverge when a corrupt entry is filtered
    // out of what's displayed but still present in storage).
    if (!window.confirm("Clear all saved debt balance snapshots? This can't be undone.")) return;
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const exportHistoryCSV = () => {
    downloadCSV('wts-compoundiq-debtpayoff-history.csv', [
      ['Date', `Total Debt Balance (${country.currency})`],
      ...convertedHistory.map(h => [new Date(h.date).toLocaleDateString(), Math.round(h.total)])
    ]);
  };

  return (
    <div className="card debt-payoff">
      <div className="debt-header">
        <h2>💳 Debt Payoff Planner</h2>
        <p>Compare the Avalanche (highest interest first -- mathematically fastest) and Snowball (smallest balance first -- most motivating) strategies.</p>
        <div className="debt-import-row">
          <label className="debt-import-btn">
            📥 Import CSV
            <input type="file" accept=".csv,text/csv" onChange={handleImportFile} hidden />
          </label>
          <button className="debt-template-btn" onClick={downloadTemplate}>Download template</button>
        </div>
        {importError && <p className="debt-import-error">⚠️ {importError}</p>}
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

      <div className="debt-lumpsum-section">
        <div className="debt-lumpsum-header">
          <h3>One-Off Extra Payments</h3>
          <button className="debt-lumpsum-add-btn" onClick={addLumpSum}>+ Add One-Off</button>
        </div>
        {lumpSums.length === 0 ? (
          <p className="debt-lumpsum-empty">None added -- use this for a bonus, tax refund, or any extra payment landing in a specific month, on top of your regular extra above.</p>
        ) : (
          <div className="debt-lumpsum-list">
            {lumpSums.map((l) => (
              <div key={l.id} className="debt-lumpsum-row">
                <div className="debt-lumpsum-field">
                  <label>In month</label>
                  <input type="number" min="1" value={l.month} onChange={(e) => updateLumpSum(l.id, 'month', e.target.value)} />
                </div>
                <div className="debt-lumpsum-field">
                  <label>Amount ({country.symbol})</label>
                  <input type="number" min="0" step="500" value={l.amount} onChange={(e) => updateLumpSum(l.id, 'amount', e.target.value)} />
                </div>
                <button className="debt-lumpsum-remove" onClick={() => removeLumpSum(l.id)} aria-label="Remove one-off payment">&times;</button>
              </div>
            ))}
          </div>
        )}
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
        <div className="debt-actions">
          <button className="debt-save-plan-btn" onClick={savePlan}>
            {saved ? '✓ Saved to My Plan' : '💾 Save This Plan'}
          </button>
          <button className="debt-save-snapshot-btn" onClick={saveSnapshot}>📸 Log Balance</button>
        </div>
      )}

      {history.length > 0 && (
        <div className="debt-history">
          <div className="debt-history-header">
            {/* convertedHistory.length, not history.length -- a corrupt/non-numeric entry is
                filtered out of convertedHistory above but stays in raw history (so "Clear
                history" below can still remove it), and this count should match what the
                list/chart below actually display rather than what's stored. */}
            <h3>Balance History ({convertedHistory.length} snapshot{convertedHistory.length === 1 ? '' : 's'})</h3>
            <div className="debt-history-header-actions">
              <button className="history-export-btn" onClick={exportHistoryCSV}>⬇️ Export CSV</button>
              <button className="debt-clear-history-btn" onClick={clearHistory}>Clear history</button>
            </div>
          </div>
          {delta !== null && (
            <div className={`debt-history-delta ${delta <= 0 ? 'down' : 'up'}`}>
              {delta <= 0 ? '▼' : '▲'} {country.symbol} {Math.abs(Math.round(delta)).toLocaleString()} since last snapshot
            </div>
          )}
          {convertedHistory.length > 1 && (
            <SnapshotChart points={convertedHistory} series={HISTORY_SERIES} symbol={country.symbol} />
          )}
          <div className="debt-history-list">
            {[...convertedHistory].reverse().map((h, idx) => (
              <div key={idx} className="debt-history-row">
                <span>{new Date(h.date).toLocaleDateString()}</span>
                <strong>{country.symbol} {Math.round(h.total).toLocaleString()}</strong>
              </div>
            ))}
          </div>
          <p className="debt-history-note">
            Logging your balance here just tracks it over time for your own reference -- it doesn't affect the
            Avalanche/Snowball projections above, which are always calculated from the debts listed at the top.
          </p>
        </div>
      )}
    </div>
  );
};

export default DebtPayoff;
