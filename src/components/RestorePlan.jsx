// src/components/RestorePlan.jsx
// "I already paid" recovery, for a browser with no entitlement token -- after the user
// cleared site data, or is on a new device. There are no accounts, so the only handle
// is the email the subscription was paid under: the server checks Paystack for an
// active subscription on that address and re-issues a signed token. On success we
// reload so App.jsx's normal on-load entitlement read picks up the restored tier.
import React, { useState } from 'react';
import './RestorePlan.css';
import { restoreEntitlement } from '../utils/entitlement';

const MESSAGES = {
  none: "No active subscription found for that email. Check the address you paid with, or contact support.",
  unconfigured: "Live billing isn't switched on for this app yet, so there's no purchase to restore.",
  bad_email: 'That doesn\'t look like a valid email address.',
  error: "Couldn't reach the server just now. Try again in a moment."
};

export default function RestorePlan() {
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
      setResult({ ok: false, message: MESSAGES[r.status] || MESSAGES.error });
    }
  };

  return (
    <div className="restore-plan">
      {!open ? (
        <button type="button" className="restore-plan-trigger" onClick={() => setOpen(true)}>
          Already paid? Restore your plan
        </button>
      ) : (
        <form className="restore-plan-form" onSubmit={submit}>
          <label htmlFor="restore-email">
            Enter the email you paid with — we'll check for an active subscription and unlock it on this device.
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
              {busy ? 'Checking…' : 'Restore'}
            </button>
          </div>
          {result && (
            <p className={`restore-plan-msg ${result.ok ? 'ok' : 'err'}`}>
              {result.ok
                ? `Found your ${result.tier} subscription — unlocking now…`
                : result.message}
            </p>
          )}
          <p className="restore-plan-note">
            This only restores a real paid subscription. Your saved plans, budgets and other data live in this
            browser — export a backup from the footer to move those between devices.
          </p>
        </form>
      )}
    </div>
  );
}
