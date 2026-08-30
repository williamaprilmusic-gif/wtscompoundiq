// src/components/DataBackup.jsx
// Always reachable regardless of tier -- this is the one place that can rescue a lost
// tier/plan if browser data is cleared, so it can't itself live behind a paywall.
import React from 'react';
import './DataBackup.css';
import { PLAN_STORAGE_KEY } from '../utils/planStorage';
import { FLUSH_EVENT } from '../utils/usePersistedState';

const ALL_STORAGE_KEYS = [
  'wts_compoundiq_tier',
  PLAN_STORAGE_KEY,
  'wts_compoundiq_reminder_at',
  'wts_compoundiq_reminder_notified_at',
  'wts_compoundiq_networth_history',
  'wts_compoundiq_debtpayoff_history',
  'wts_compoundiq_emergencyfund_history',
  // Working data auto-saved by usePersistedState (see src/utils/usePersistedState.js)
  // -- the actual entered rows, not just the "Save This Plan" summaries above.
  'wts_compoundiq_networth_items',
  'wts_compoundiq_debtpayoff_debts',
  'wts_compoundiq_debtpayoff_extra',
  'wts_compoundiq_debtpayoff_lumpsums',
  'wts_compoundiq_invest_goals',
  'wts_compoundiq_emergencyfund_inputs',
  'wts_compoundiq_loancalc_inputs',
  'wts_compoundiq_loancalc_lumpsums'
];

const exportData = () => {
  // usePersistedState debounces its localStorage writes, so a field edited moments ago
  // may not have landed in localStorage yet. Force every mounted instance to flush its
  // latest value synchronously before reading, or the export can silently miss it.
  window.dispatchEvent(new Event(FLUSH_EVENT));
  const data = {};
  ALL_STORAGE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  const payload = { app: 'WTS CompoundIQ', exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wts-compoundiq-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const importData = (file, onDone) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.data || typeof parsed.data !== 'object') throw new Error('Unrecognized file shape');
      let imported = 0;
      Object.entries(parsed.data).forEach(([key, value]) => {
        if (ALL_STORAGE_KEYS.includes(key) && typeof value === 'string') {
          localStorage.setItem(key, value);
          imported++;
        }
      });
      onDone(imported > 0 ? null : 'No recognized WTS CompoundIQ data found in that file.');
    } catch {
      onDone('Could not read that file -- make sure it\'s a WTS CompoundIQ backup (.json) exported from this app.');
    }
  };
  reader.readAsText(file);
};

const DataBackup = () => {
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Import this backup? It will overwrite your current tier, saved plans, and any entered net worth items, debts, and investment goals in this browser.')) {
      e.target.value = '';
      return;
    }
    importData(file, (error) => {
      if (error) {
        alert(error);
      } else {
        alert('Data imported successfully. Reloading to apply it...');
        window.location.reload();
      }
    });
    e.target.value = ''; // allow re-selecting the same file later
  };

  return (
    <div className="data-backup">
      <span className="data-backup-text">
        Your data (tier, saved plans, net worth/debts/goals) lives only in this browser.
      </span>
      <div className="data-backup-buttons">
        <button className="data-backup-btn" onClick={exportData}>⬇️ Export Backup</button>
        <label className="data-backup-btn secondary">
          ⬆️ Import Backup
          <input type="file" accept="application/json" onChange={handleImportFile} hidden />
        </label>
      </div>
    </div>
  );
};

export default DataBackup;
