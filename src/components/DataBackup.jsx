// src/components/DataBackup.jsx
// Always reachable regardless of tier -- this is the one place that can rescue a lost
// tier/plan if browser data is cleared, so it can't itself live behind a paywall.
import React, { useState, useEffect } from 'react';
import './DataBackup.css';
import { PLAN_STORAGE_KEY } from '../utils/planStorage';
import { FLUSH_EVENT } from '../utils/usePersistedState';
import { daysBetween, fmtDaysAgo } from '../utils/dateAgo';
import { HISTORY_KEY as NETWORTH_HISTORY_KEY } from './NetWorth';
import { HISTORY_KEY as DEBTPAYOFF_HISTORY_KEY, EXTRA_KEY as DEBTPAYOFF_EXTRA_KEY } from './DebtPayoff';
import { HISTORY_KEY as EMERGENCYFUND_HISTORY_KEY } from './EmergencyFund';
import { BUDGET_ITEMS_KEY, BUDGET_HISTORY_KEY } from '../budgetEngine';
import {
  ADVISER_NOTES_KEY as MYPLAN_ADVISER_NOTES_KEY,
  BRANDING_KEY as MYPLAN_BRANDING_KEY,
  COMPLIANCE_KEY as MYPLAN_COMPLIANCE_KEY,
  PREPARED_BY_KEY as MYPLAN_PREPARED_BY_KEY,
  CLIENT_NAME_KEY as MYPLAN_CLIENT_NAME_KEY
} from './MyPlan';

const ALL_STORAGE_KEYS = [
  'wts_compoundiq_tier',
  PLAN_STORAGE_KEY,
  'wts_compoundiq_reminder_at',
  'wts_compoundiq_reminder_notified_at',
  'wts_compoundiq_reporting_currency',
  NETWORTH_HISTORY_KEY,
  DEBTPAYOFF_HISTORY_KEY,
  EMERGENCYFUND_HISTORY_KEY,
  // Working data auto-saved by usePersistedState (see src/utils/usePersistedState.js)
  // -- the actual entered rows, not just the "Save This Plan" summaries above.
  'wts_compoundiq_networth_items',
  DEBTPAYOFF_EXTRA_KEY,
  'wts_compoundiq_debtpayoff_debts',
  'wts_compoundiq_debtpayoff_lumpsums',
  'wts_compoundiq_invest_goals',
  'wts_compoundiq_emergencyfund_inputs',
  'wts_compoundiq_loancalc_inputs',
  'wts_compoundiq_loancalc_lumpsums',
  BUDGET_ITEMS_KEY,
  // Compare tab's "Compare My Plans" scenarios, and Snapshot's white-label report
  // branding -- both added after this list was first written; included here for the
  // same reason as everything else on it (an export/restore cycle shouldn't silently
  // drop them).
  'wts_compoundiq_scenario_a',
  'wts_compoundiq_scenario_b',
  'wts_compoundiq_report_branding',
  // Budget's surplus history (added alongside its "Log This Month's Surplus" feature),
  // and My Plan's adviser notes / Ultra practice branding, compliance line,
  // prepared-by, and client name -- all added well after this list existed, and all
  // just as real to lose on a restore as anything else here.
  BUDGET_HISTORY_KEY,
  MYPLAN_ADVISER_NOTES_KEY,
  MYPLAN_BRANDING_KEY,
  MYPLAN_COMPLIANCE_KEY,
  MYPLAN_PREPARED_BY_KEY,
  MYPLAN_CLIENT_NAME_KEY
];

// Deliberately NOT included in ALL_STORAGE_KEYS -- like THEME_KEY and the adviser-notes
// "updated at" stamp, this is a display nicety derived from the act of backing up
// itself, not data worth restoring. Restoring an old backup shouldn't also roll back
// how recently a *newer* backup was actually taken.
const LAST_BACKUP_AT_KEY = 'wts_compoundiq_last_backup_at';
const LAST_BACKUP_WARN_DAYS = 30;

const exportData = (onExported) => {
  // usePersistedState debounces its localStorage writes, so a field edited moments ago
  // may not have landed in localStorage yet. Force every mounted instance to flush its
  // latest value synchronously before reading, or the export can silently miss it.
  window.dispatchEvent(new Event(FLUSH_EVENT));
  const data = {};
  ALL_STORAGE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  const now = new Date().toISOString();
  const payload = { app: 'WTS CompoundIQ', exportedAt: now, data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wts-compoundiq-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  try { localStorage.setItem(LAST_BACKUP_AT_KEY, now); } catch { /* private mode / quota */ }
  onExported?.(now);
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
  const [lastBackupAt, setLastBackupAt] = useState(null);

  useEffect(() => {
    try { setLastBackupAt(localStorage.getItem(LAST_BACKUP_AT_KEY) || null); } catch { /* ignore */ }
  }, []);

  const handleExport = () => exportData(setLastBackupAt);

  const backupDaysAgo = lastBackupAt ? daysBetween(lastBackupAt) : null;
  const backupStale = backupDaysAgo === null || backupDaysAgo > LAST_BACKUP_WARN_DAYS;

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
        <button className="data-backup-btn" onClick={handleExport}>⬇️ Export Backup</button>
        <label className="data-backup-btn secondary">
          ⬆️ Import Backup
          <input type="file" accept="application/json" onChange={handleImportFile} hidden />
        </label>
      </div>
      <span className={`data-backup-last ${backupStale ? 'stale' : ''}`}>
        {lastBackupAt
          ? `Last backup: ${fmtDaysAgo(backupDaysAgo)}${backupStale ? ' -- consider exporting a fresh one' : ''}`
          : "You haven't exported a backup yet in this browser -- clearing browser data without one loses everything above."}
      </span>
    </div>
  );
};

export default DataBackup;
