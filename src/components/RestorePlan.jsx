// src/components/RestorePlan.jsx
// "I already paid" recovery, for a browser with no entitlement token -- after the user
// cleared site data, or is on a new device. There are no accounts, so the only handle
// is the email the subscription was paid under: the server checks Paystack for an
// active subscription on that address and re-issues a signed token. On success we
// reload so App.jsx's normal on-load entitlement read picks up the restored tier.
import React, { useState } from 'react';
import './RestorePlan.css';
import { restoreEntitlement } from '../utils/entitlement';
import { useLanguage } from '../i18n/LanguageContext';

// status -> restore.* translation key
const MESSAGE_KEYS = {
  none: 'restore.none',
  unconfigured: 'restore.unconfigured',
  unavailable: 'restore.unavailable',
  bad_email: 'restore.badEmail',
  error: 'restore.error'
};

export default function RestorePlan() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok: true, tier } | { ok: false, message }

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    const r = await restoreEntitlement(email);
    setBusy(false);
    if (r.status === 'restored') {
      setResult({ ok: true, tier: r.tier });
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setResult({ ok: false, message: t(MESSAGE_KEYS[r.status] || MESSAGE_KEYS.error) });
    }
  };

  return (
    <div className="restore-plan">
      {!open ? (
        <button type="button" className="restore-plan-trigger" onClick={() => setOpen(true)}>
          {t('restore.title')}
        </button>
      ) : (
        <form className="restore-plan-form" onSubmit={submit}>
          <label htmlFor="restore-email">
            {t('restore.prompt')}
          </label>
          <div className="restore-plan-row">
            <input
              id="restore-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !email.trim()}>
              {busy ? t('restore.checking') : t('restore.restore')}
            </button>
          </div>
          {result && (
            <p className={`restore-plan-msg ${result.ok ? 'ok' : 'err'}`}>
              {result.ok
                ? t('restore.found', { tier: result.tier })
                : result.message}
            </p>
          )}
          <p className="restore-plan-note">
            {t('restore.note')}
          </p>
        </form>
      )}
    </div>
  );
}
