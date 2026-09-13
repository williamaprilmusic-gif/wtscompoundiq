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

// Gathers every backed-up localStorage key into one { app, exportedAt, data } object.
// usePersistedState debounces its writes, so a field edited moments ago may not be in
// localStorage yet -- force every mounted instance to flush synchronously first, or the
// backup can silently miss it. Shared by both the "save to device" and "email a copy"
// paths so they can never drift apart on what's included.
const buildBackupPayload = () => {
  window.dispatchEvent(new Event(FLUSH_EVENT));
  const data = {};
  ALL_STORAGE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  return { app: 'WTS CompoundIQ', exportedAt: new Date().toISOString(), data };
};

const stampBackup = (now, onExported) => {
  try { localStorage.setItem(LAST_BACKUP_AT_KEY, now); } catch { /* private mode / quota */ }
  onExported?.(now);
};

const exportData = (onExported) => {
  const payload = buildBackupPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wts-compoundiq-backup-${payload.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  stampBackup(payload.exportedAt, onExported);
};

// POSTs the same payload to the serverless email endpoint, which attaches it as a JSON
// file and sends it to `email`. Returns a status string: 'sent' | 'unconfigured'
// (no email provider set up) | 'bad_email' | 'too_large' | 'rate_limited' | 'error'.
const emailData = async (email) => {
  const payload = buildBackupPayload();
  try {
    const res = await fetch('/api/backup/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email || '').trim(), backup: payload })
    });
    const body = await res.json().catch(() => ({}));
    return { status: body.status || 'error', exportedAt: payload.exportedAt };
  } catch {
    return { status: 'error' };
  }
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

const EMAIL_MESSAGES = {
  unconfigured: 'Emailing a backup isn\'t switched on for this app yet — use "Save to Device" instead.',
  bad_email: 'That doesn\'t look like a valid email address.',
  too_large: 'Your saved data is unexpectedly large to email — use "Save to Device" instead.',
  rate_limited: 'You\'ve requested a few of these recently. Wait a little while and try again.',
  error: 'Couldn\'t send it just now. Try again in a moment, or use "Save to Device".'
};

// Inline "email me a copy" form -- opens on demand so the footer stays a single line
// until it's wanted. Mirrors RestorePlan's pattern.
const EmailBackup = ({ onSent }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok } | { ok:false, message }

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    const r = await emailData(email);
    setBusy(false);
    if (r.status === 'sent') {
      setResult({ ok: true });
      if (r.exportedAt) onSent?.(r.exportedAt);
    } else {
      setResult({ ok: false, message: EMAIL_MESSAGES[r.status] || EMAIL_MESSAGES.error });
    }
  };

  if (!open) {
    return (
      <button type="button" className="data-backup-btn secondary" onClick={() => setOpen(true)}>
        📧 Email a Copy
      </button>
    );
  }

  return (
    <form className="data-backup-email" onSubmit={submit}>
      <div className="data-backup-email-row">
        <input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          aria-label="Email address to send the backup to"
        />
        <button type="submit" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send'}</button>
      </div>
      {result && (
        <p className={`data-backup-email-msg ${result.ok ? 'ok' : 'err'}`}>
          {result.ok
            ? 'Sent — check your inbox for a .json file you can Import on any device.'
            : result.message}
        </p>
      )}
      <p className="data-backup-email-note">
        The file travels through a third-party email service and lands in your mailbox unencrypted — only send it to an
        address you control. Nothing is stored on our side.
      </p>
    </form>
  );
};

const DataBackup = () => {
  const [lastBackupAt, setLastBackupAt] = useState(null);

  useEffect(() => {
    try { setLastBackupAt(localStorage.getItem(LAST_BACKUP_AT_KEY) || null); } catch { /* ignore */ }
  }, []);

  const handleExport = () => exportData(setLastBackupAt);
  // An emailed backup is still a backup -- stamp the "last backup" time the same way.
  const handleEmailed = (at) => stampBackup(at, setLastBackupAt);

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
        <button className="data-backup-btn" onClick={handleExport}>⬇️ Save to Device</button>
        <EmailBackup onSent={handleEmailed} />
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
