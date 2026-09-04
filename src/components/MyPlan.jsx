// src/components/MyPlan.jsx
import React, { useState, useEffect } from 'react';
import './MyPlan.css';
import { daysBetween, fmtDaysAgo } from '../utils/dateAgo';
import { PLAN_STORAGE_KEY, readPlan, loanEffectiveMonthlyPayment, loanEffectiveTermLabel } from '../utils/planStorage';

const REMINDER_KEY = 'wts_compoundiq_reminder_at';
const REMINDER_NOTIFIED_KEY = 'wts_compoundiq_reminder_notified_at';
const REMINDER_DAYS = 30;
// All five exported so DataBackup.jsx's Export/Import Backup can carry an adviser's
// notes and Enterprise branding along with everything else -- these were added across
// several rounds after that list was first written and, like the scenario/report-
// branding keys already on it, would otherwise silently vanish on a restore.
export const ADVISER_NOTES_KEY = 'wts_compoundiq_adviser_notes';
// Not exported/backed up on its own -- purely a display nicety derived from the notes
// themselves (like Dashboard's "saved X ago" labels), not data worth restoring; if
// ADVISER_NOTES_KEY round-trips through a backup, this timestamp being stale by however
// long the restore took is harmless.
const ADVISER_NOTES_UPDATED_AT_KEY = 'wts_compoundiq_adviser_notes_updated_at';
// This is a separate, simpler branding store from Snapshot.jsx's BRANDING_KEY (firm/
// advisor/client name + logo) -- that one existed first and covers the polished client
// report; this one was added later for the lighter-weight My Plan check-in tool (no
// logo). Not unified into one, since My Plan and Snapshot are different documents an
// adviser might brand differently -- but Snapshot's own print masthead and Dashboard's
// (see Dashboard.jsx) both read Snapshot's BRANDING_KEY, and Snapshot's report reads
// this file's COMPLIANCE_KEY, so at least the compliance text is shared, not tripled.
export const BRANDING_KEY = 'wts_compoundiq_plan_branding';
export const COMPLIANCE_KEY = 'wts_compoundiq_plan_compliance';
export const PREPARED_BY_KEY = 'wts_compoundiq_plan_prepared_by';
export const CLIENT_NAME_KEY = 'wts_compoundiq_plan_client_name';

const monthsBetween = (isoDate) => daysBetween(isoDate) / 30.44;

const readBranding = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(BRANDING_KEY) || '{}');
    return { firm: String(raw.firm || ''), tagline: String(raw.tagline || '') };
  } catch { return { firm: '', tagline: '' }; }
};

const MyPlan = ({ country, canAdviserNotes = false, onOpenPricing }) => {
  const [snapshot, setSnapshot] = useState(null);
  const [currentDebtBalance, setCurrentDebtBalance] = useState('');
  const [currentEfBalance, setCurrentEfBalance] = useState('');
  const [currentLoanBalance, setCurrentLoanBalance] = useState('');
  const [reminderAt, setReminderAt] = useState(null);
  const [reminderDue, setReminderDue] = useState(false);
  // Enterprise-tier adviser annotation, persisted locally. Kept in storage even when
  // the tier can't currently see it, so a downgrade doesn't destroy typed notes.
  const [adviserNotes, setAdviserNotes] = useState('');
  // Enterprise white-label: a firm name/tagline shown atop the plan and carried into
  // print. Persisted locally like the adviser notes, and kept through a downgrade.
  const [branding, setBranding] = useState({ firm: '', tagline: '' });
  // Enterprise: a custom compliance/disclosure line (e.g. FAIS / FSP wording) appended
  // to the plan and always included in print.
  const [compliance, setCompliance] = useState('');
  // Enterprise: the adviser's name, shown as "Prepared by X on <date>" under the
  // branded header (and in print).
  const [preparedBy, setPreparedBy] = useState('');
  // Enterprise: which client this printed plan is for, e.g. "Prepared by X for Y".
  const [clientName, setClientName] = useState('');
  const [adviserNotesUpdatedAt, setAdviserNotesUpdatedAt] = useState(null);

  const updateAdviserNotes = (value) => {
    setAdviserNotes(value);
    try { localStorage.setItem(ADVISER_NOTES_KEY, value); } catch { /* private mode / quota */ }
    const now = new Date().toISOString();
    try { localStorage.setItem(ADVISER_NOTES_UPDATED_AT_KEY, now); } catch { /* private mode / quota */ }
    setAdviserNotesUpdatedAt(now);
  };

  const updateBranding = (patch) => {
    setBranding((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(BRANDING_KEY, JSON.stringify(next)); } catch { /* private mode / quota */ }
      return next;
    });
  };

  const updateCompliance = (value) => {
    setCompliance(value);
    try { localStorage.setItem(COMPLIANCE_KEY, value); } catch { /* private mode / quota */ }
  };

  const updatePreparedBy = (value) => {
    setPreparedBy(value);
    try { localStorage.setItem(PREPARED_BY_KEY, value); } catch { /* private mode / quota */ }
  };

  const updateClientName = (value) => {
    setClientName(value);
    try { localStorage.setItem(CLIENT_NAME_KEY, value); } catch { /* private mode / quota */ }
  };

  useEffect(() => {
    const plan = readPlan();
    if (Object.keys(plan).length > 0) setSnapshot(plan);
    try { setAdviserNotes(localStorage.getItem(ADVISER_NOTES_KEY) || ''); } catch { /* ignore */ }
    try { setAdviserNotesUpdatedAt(localStorage.getItem(ADVISER_NOTES_UPDATED_AT_KEY) || null); } catch { /* ignore */ }
    try { setCompliance(localStorage.getItem(COMPLIANCE_KEY) || ''); } catch { /* ignore */ }
    try { setPreparedBy(localStorage.getItem(PREPARED_BY_KEY) || ''); } catch { /* ignore */ }
    try { setClientName(localStorage.getItem(CLIENT_NAME_KEY) || ''); } catch { /* ignore */ }
    setBranding(readBranding());

    const storedReminder = localStorage.getItem(REMINDER_KEY);
    if (storedReminder) {
      const due = Date.now() >= new Date(storedReminder).getTime();
      setReminderAt(storedReminder);
      setReminderDue(due);
      // This effect re-runs every time the My Plan tab is mounted (it's unmounted
      // whenever the user navigates away, since it's only conditionally rendered) --
      // without tracking which due-date we've already alerted for, switching back to
      // this tab repeatedly after the reminder is overdue would re-fire a real OS
      // notification on every single visit.
      const alreadyNotified = localStorage.getItem(REMINDER_NOTIFIED_KEY) === storedReminder;
      if (due && !alreadyNotified && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('WTS CompoundIQ', { body: "It's been 30 days -- time for your plan check-in." });
        localStorage.setItem(REMINDER_NOTIFIED_KEY, storedReminder);
      }
    }
  }, []);

  const setReminder = async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    const due = new Date(Date.now() + REMINDER_DAYS * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(REMINDER_KEY, due);
    setReminderAt(due);
    setReminderDue(false);
  };

  const cancelReminder = () => {
    localStorage.removeItem(REMINDER_KEY);
    setReminderAt(null);
    setReminderDue(false);
  };

  const clearPlan = () => {
    if (!window.confirm("Clear your saved plan? This removes your saved Debt Payoff, Emergency Fund, Loan/Bond, and FIRE snapshots from My Plan -- it doesn't affect those tabs themselves.")) return;
    localStorage.removeItem(PLAN_STORAGE_KEY);
    setSnapshot(null);
    setCurrentDebtBalance('');
    setCurrentEfBalance('');
    setCurrentLoanBalance('');
  };


  const brandingBanner = (branding.firm.trim() || preparedBy.trim()) ? (
    <div className="plan-branding">
      {branding.firm.trim() && <span className="plan-branding-firm">{branding.firm.trim()}</span>}
      {branding.tagline.trim() && <span className="plan-branding-tagline">{branding.tagline.trim()}</span>}
      {preparedBy.trim() && (
        <span className="plan-branding-prepared">
          Prepared by {preparedBy.trim()}{clientName.trim() ? ` for ${clientName.trim()}` : ''} · {new Date().toLocaleDateString()}
        </span>
      )}
    </div>
  ) : null;

  const brandingEditor = canAdviserNotes ? (
    <div className="plan-branding-editor no-print">
      <h3>🏷️ Practice Branding <span className="plan-adviser-badge">Enterprise</span></h3>
      <div className="plan-branding-fields">
        <input
          type="text"
          value={branding.firm}
          onChange={(e) => updateBranding({ firm: e.target.value })}
          placeholder="Firm / practice name (shown on the plan and in print)"
          maxLength={80}
        />
        <input
          type="text"
          value={branding.tagline}
          onChange={(e) => updateBranding({ tagline: e.target.value })}
          placeholder="Tagline or licence line (optional)"
          maxLength={120}
        />
        <input
          type="text"
          value={preparedBy}
          onChange={(e) => updatePreparedBy(e.target.value)}
          placeholder='Prepared by (adviser name) — shows "Prepared by X on <today>"'
          maxLength={80}
        />
        <input
          type="text"
          value={clientName}
          onChange={(e) => updateClientName(e.target.value)}
          placeholder='Client name (optional) — adds "for [client]" to the line above'
          maxLength={80}
        />
      </div>
    </div>
  ) : null;

  const complianceEditor = canAdviserNotes ? (
    <div className="plan-branding-editor no-print">
      <h3>⚖️ Compliance Line <span className="plan-adviser-badge">Enterprise</span></h3>
      <textarea
        className="plan-compliance-input"
        value={compliance}
        onChange={(e) => updateCompliance(e.target.value)}
        placeholder="Your firm's disclosure/compliance wording (e.g. FAIS / FSP licence details). Shown on the plan and always included when it's printed. Saved on this device only."
        rows={3}
      />
    </div>
  ) : null;

  const reminderBlock = (
    <div className="plan-reminder">
      {reminderDue ? (
        <>
          <span className="plan-reminder-due">⏰ It's been {REMINDER_DAYS} days -- time for a check-in.</span>
          <button className="plan-reminder-btn" onClick={setReminder}>Snooze another {REMINDER_DAYS} days</button>
        </>
      ) : reminderAt ? (
        <>
          <span>🔔 Reminder set for {new Date(reminderAt).toLocaleDateString()}</span>
          <button className="plan-reminder-btn secondary" onClick={cancelReminder}>Cancel</button>
        </>
      ) : (
        <button className="plan-reminder-btn" onClick={setReminder}>🔔 Remind me in {REMINDER_DAYS} days</button>
      )}
    </div>
  );

  if (!snapshot) {
    return (
      <div className="card my-plan">
        {brandingBanner}
        <div className="plan-header">
          <h2>📓 My Plan</h2>
          <p>Nothing saved yet. This is a check-in tool, not a calculator -- save a snapshot from the Debt Payoff, Emergency Fund, Loan & Bond, or Power Tools (FIRE) tabs (look for "Save This Plan"), then come back later to see if you're on track.</p>
        </div>
        {brandingEditor}
        {complianceEditor}
        {compliance.trim() && <div className="plan-compliance-note">{compliance.trim()}</div>}
        {reminderBlock}
        <p className="plan-note">
          Reminders only fire while this app is open (there's no background server to push a notification while your
          browser is closed) -- but next time you visit after {REMINDER_DAYS} days, you'll see it here.
        </p>
      </div>
    );
  }

  const hasDebt = !!snapshot.debt;
  const hasEf = !!snapshot.emergencyFund;
  const hasLoan = !!snapshot.loan;
  const hasFire = !!snapshot.fire;

  // Debt and loan check-ins share the exact same "straight-line paydown" shape --
  // expected remaining = starting balance minus (balance / payoffMonths) * months
  // elapsed since saving, floored at 0 -- so the calculation lives once here instead
  // of being copy-pasted per section with only the field names changed. A straight-line
  // estimate over the saved payoff term, not a true (front-loaded-interest) amortization
  // curve -- consistent with the "assumes steady linear progress" disclaimer at the bottom.
  const computeRemainingDrift = (startingBalance, payoffMonths, savedAt, currentBalanceInput) => {
    const monthsElapsed = monthsBetween(savedAt);
    const monthlyPayoffRate = payoffMonths > 0 ? startingBalance / payoffMonths : 0;
    const expectedRemaining = Math.max(0, startingBalance - monthlyPayoffRate * monthsElapsed);
    const drift = currentBalanceInput !== '' ? expectedRemaining - Number(currentBalanceInput) : null;
    return { expectedRemaining, drift };
  };

  const debtDaysAgo = hasDebt ? daysBetween(snapshot.debt.savedAt) : null;
  // A saved plan whose payoff never completes inside simulatePayoff's MAX_MONTHS cap
  // stores avalancheReachable === false and avalancheMonths pinned at 600. Feeding 600
  // into computeRemainingDrift as a real term invents a straight-line paydown rate for
  // a debt that's actually growing, so every check-in would read "behind schedule".
  // Same gate Dashboard/Snapshot use; older snapshots (no flag) stay reachable.
  const debtReachable = !hasDebt || snapshot.debt.avalancheReachable !== false;
  const { expectedRemaining: debtExpectedRemaining, drift: debtDrift } = (hasDebt && debtReachable)
    ? computeRemainingDrift(snapshot.debt.totalBalance, snapshot.debt.avalancheMonths, snapshot.debt.savedAt, currentDebtBalance)
    : { expectedRemaining: null, drift: null };

  let efExpectedSaved = null;
  let efDrift = null;
  let efDaysAgo = null;
  if (hasEf) {
    efDaysAgo = daysBetween(snapshot.emergencyFund.savedAt);
    const monthsElapsed = monthsBetween(snapshot.emergencyFund.savedAt);
    efExpectedSaved = Math.min(snapshot.emergencyFund.targetAmount, snapshot.emergencyFund.currentSavings + snapshot.emergencyFund.monthlyContribution * monthsElapsed);
    if (currentEfBalance !== '') {
      efDrift = Number(currentEfBalance) - efExpectedSaved;
    }
  }

  const loanDaysAgo = hasLoan ? daysBetween(snapshot.loan.savedAt) : null;
  const { expectedRemaining: loanExpectedRemaining, drift: loanDrift } = hasLoan
    ? computeRemainingDrift(snapshot.loan.principal, snapshot.loan.payoffMonths, snapshot.loan.savedAt, currentLoanBalance)
    : { expectedRemaining: null, drift: null };

  return (
    <div className="card my-plan">
      {brandingBanner}
      <div className="plan-header">
        <h2>📓 My Plan</h2>
        <p>Enter where things actually stand to see if you're ahead or behind your own plan.</p>
      </div>

      {hasDebt && (
        <div className="plan-section">
          <h3>💳 Debt Payoff <span className="plan-saved-label">saved {fmtDaysAgo(debtDaysAgo)}</span></h3>
          <div className="plan-baseline">
            When saved: {country.symbol} {Math.round(snapshot.debt.totalBalance).toLocaleString()} total debt,
            paying {country.symbol} {snapshot.debt.extraMonthly.toLocaleString()}/mo extra,{' '}
            {debtReachable
              ? `on pace to be debt-free in ${snapshot.debt.avalancheMonths} months.`
              : 'not on track to clear within 50 years at that pace.'}
          </div>
          {debtReachable ? (
            <>
              <div className="plan-checkin">
                <label>What's your total debt balance right now? ({country.symbol})</label>
                <input type="number" min="0" value={currentDebtBalance} onChange={(e) => setCurrentDebtBalance(e.target.value)} placeholder={`Expected: ~${Math.round(debtExpectedRemaining).toLocaleString()}`} />
              </div>
              {debtDrift !== null && (
                <p className={`plan-drift ${debtDrift >= 0 ? 'ahead' : 'behind'}`}>
                  {debtDrift >= 0
                    ? `You're ${country.symbol} ${Math.round(debtDrift).toLocaleString()} ahead of schedule -- nice.`
                    : `You're ${country.symbol} ${Math.round(-debtDrift).toLocaleString()} behind where the plan expected. Worth revisiting the Debt Payoff tab.`}
                </p>
              )}
            </>
          ) : (
            <p className="plan-drift behind">This plan doesn't clear the debt at the saved pace -- raise the extra monthly payment on the Debt Payoff tab before tracking progress here.</p>
          )}
        </div>
      )}

      {hasEf && (
        <div className="plan-section">
          <h3>🛟 Emergency Fund <span className="plan-saved-label">saved {fmtDaysAgo(efDaysAgo)}</span></h3>
          <div className="plan-baseline">
            When saved: {country.symbol} {Math.round(snapshot.emergencyFund.currentSavings).toLocaleString()} saved toward a
            {' '}{country.symbol} {Math.round(snapshot.emergencyFund.targetAmount).toLocaleString()} target,
            contributing {country.symbol} {snapshot.emergencyFund.monthlyContribution.toLocaleString()}/mo.
          </div>
          <div className="plan-checkin">
            <label>What's your emergency fund balance right now? ({country.symbol})</label>
            <input type="number" min="0" value={currentEfBalance} onChange={(e) => setCurrentEfBalance(e.target.value)} placeholder={`Expected: ~${Math.round(efExpectedSaved).toLocaleString()}`} />
          </div>
          {efDrift !== null && (
            <p className={`plan-drift ${efDrift >= 0 ? 'ahead' : 'behind'}`}>
              {efDrift >= 0
                ? `You're ${country.symbol} ${Math.round(efDrift).toLocaleString()} ahead of schedule -- nice.`
                : `You're ${country.symbol} ${Math.round(-efDrift).toLocaleString()} behind where the plan expected. Worth revisiting the Emergency Fund tab.`}
            </p>
          )}
        </div>
      )}

      {hasLoan && (
        <div className="plan-section">
          <h3>{snapshot.loan.loanTypeLabel || '🏦 Loan'} <span className="plan-saved-label">saved {fmtDaysAgo(loanDaysAgo)}</span></h3>
          <div className="plan-baseline">
            When saved: {country.symbol} {Math.round(snapshot.loan.principal).toLocaleString()} borrowed at {snapshot.loan.annualRate}%
            over {loanEffectiveTermLabel(snapshot.loan)}, paying {country.symbol} {loanEffectiveMonthlyPayment(snapshot.loan).toLocaleString()}/mo.
          </div>
          <div className="plan-checkin">
            <label>What's your loan/bond balance right now? ({country.symbol})</label>
            <input type="number" min="0" value={currentLoanBalance} onChange={(e) => setCurrentLoanBalance(e.target.value)} placeholder={`Expected: ~${Math.round(loanExpectedRemaining).toLocaleString()}`} />
          </div>
          {loanDrift !== null && (
            <p className={`plan-drift ${loanDrift >= 0 ? 'ahead' : 'behind'}`}>
              {loanDrift >= 0
                ? `You're ${country.symbol} ${Math.round(loanDrift).toLocaleString()} ahead of schedule -- nice.`
                : `You're ${country.symbol} ${Math.round(-loanDrift).toLocaleString()} behind where the plan expected. Worth revisiting the Loan & Bond tab -- an extra payment there could close the gap.`}
            </p>
          )}
        </div>
      )}

      {hasFire && (
        <div className="plan-section">
          <h3>🔥 FIRE Target <span className="plan-saved-label">saved {fmtDaysAgo(daysBetween(snapshot.fire.savedAt))}</span></h3>
          <div className="plan-baseline">
            When saved: {country.symbol} {Math.round(snapshot.fire.annualExpenses).toLocaleString()}/yr expenses at a {snapshot.fire.withdrawalRate}%
            withdrawal rate puts your FIRE number at {country.symbol} {Math.round(snapshot.fire.fireNumber).toLocaleString()},{' '}
            {snapshot.fire.yearsToFire === null ? 'not reachable within 60 years at that pace' : `about ${snapshot.fire.yearsToFire} years out at your saved pace`}.
          </div>
          <p className="plan-note-inline">
            Revisit the Power Tools tab to see if you're still on pace -- FIRE progress depends on your investment balance, which isn't tracked here.
          </p>
        </div>
      )}

      {reminderBlock}

      {brandingEditor}
      {complianceEditor}

      {canAdviserNotes ? (
        <div className="plan-adviser-notes">
          <h3>
            🗒️ Adviser Notes <span className="plan-adviser-badge">Enterprise</span>
            {adviserNotesUpdatedAt && (
              <span className="plan-adviser-updated">last edited {fmtDaysAgo(daysBetween(adviserNotesUpdatedAt))}</span>
            )}
          </h3>
          <textarea
            value={adviserNotes}
            onChange={(e) => updateAdviserNotes(e.target.value)}
            placeholder="Context, assumptions, and recommendations to hand to a client with this plan. Saved on this device (not synced or uploaded)."
            rows={5}
          />
        </div>
      ) : adviserNotes.trim() ? null : (
        <div className="plan-adviser-upsell no-print">
          <p>
            🗒️ <strong>Adviser Notes</strong> — attach context and recommendations to a client's plan. Included on Enterprise.
            {onOpenPricing && <button type="button" className="plan-adviser-upsell-btn" onClick={onOpenPricing}>View Pricing</button>}
          </p>
        </div>
      )}

      {compliance.trim() && (
        <div className="plan-compliance-note">{compliance.trim()}</div>
      )}

      <button className="plan-clear-btn no-print" onClick={clearPlan}>Clear saved plan</button>

      <p className="plan-note">
        This lives only in your browser's local storage -- nothing is sent anywhere, and it won't follow you to another
        device or browser. "Expected" figures assume steady linear progress at the rate you set when you saved.
        Reminders only fire while this app is open in a tab -- there's no background server to push one while your
        browser is closed.
      </p>
    </div>
  );
};

export default MyPlan;
