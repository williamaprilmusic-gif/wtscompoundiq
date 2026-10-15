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
import { useLanguage } from '../i18n/LanguageContext';
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

const importData = (file, onDone, t) => {
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
      onDone(imported > 0 ? null : t('common.backupNoData'));
    } catch {
      onDone(t('common.backupBadFile'));
    }
  };
  reader.readAsText(file);
};

// status -> backup.* translation key
const EMAIL_MESSAGE_KEYS = {
  unconfigured: 'backup.emUnconfigured',
  bad_email: 'backup.emBad',
  too_large: 'backup.emTooLarge',
  rate_limited: 'backup.emRate',
  error: 'backup.emError'
};

// Inline "email me a copy" form -- opens on demand so the footer stays a single line
// until it's wanted. Mirrors RestorePlan's pattern.
const EmailBackup = ({ onSent }) => {
  const { t } = useLanguage();
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
      setResult({ ok: false, message: t(EMAIL_MESSAGE_KEYS[r.status] || EMAIL_MESSAGE_KEYS.error) });
    }
  };

  if (!open) {
    return (
      <button type="button" className="data-backup-btn secondary" onClick={() => setOpen(true)}>
        {t('left.emailCopy')}
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
          aria-label={t('backup.emailAria')}
        />
        <button type="submit" disabled={busy || !email.trim()}>{busy ? t('backup.sending') : t('backup.send')}</button>
      </div>
      {result && (
        <p className={`data-backup-email-msg ${result.ok ? 'ok' : 'err'}`}>
          {result.ok
            ? t('backup.emailSent')
            : result.message}
        </p>
      )}
      <p className="data-backup-email-note">
        {t('backup.emailNote')}
      </p>
    </form>
  );
};

const DataBackup = () => {
  const { t } = useLanguage();
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
    if (!window.confirm(t('common.backupConfirm'))) {
      e.target.value = '';
      return;
    }
    importData(file, (error) => {
      if (error) {
        alert(error);
      } else {
        alert(t('common.backupDone'));
        window.location.reload();
      }
    }, t);
    e.target.value = ''; // allow re-selecting the same file later
  };

  return (
    <div className="data-backup">
      <span className="data-backup-text">{t('common.backupText')}</span>
      <div className="data-backup-buttons">
        <button className="data-backup-btn" onClick={handleExport}>{t('backup.saveDevice')}</button>
        <EmailBackup onSent={handleEmailed} />
        <label className="data-backup-btn secondary">
          {t('common.backupImport')}
          <input type="file" accept="application/json" onChange={handleImportFile} hidden />
        </label>
      </div>
      <span className={`data-backup-last ${backupStale ? 'stale' : ''}`}>
        {lastBackupAt
          ? `${t('left.lastBackup', { when: fmtDaysAgo(backupDaysAgo, t) })}${backupStale ? t('left.lastBackupStale') : ''}`
          : t('backup.noBackup')}
      </span>
    </div>
  );
};

export default DataBackup;
