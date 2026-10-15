// src/components/MyPlan.jsx
import React, { useState, useEffect } from 'react';
import './MyPlan.css';
import { daysBetween, fmtDaysAgo } from '../utils/dateAgo';
import { PLAN_STORAGE_KEY, readPlan, loanEffectiveMonthlyPayment, loanEffectiveTermLabel } from '../utils/planStorage';
import { useLanguage } from '../i18n/LanguageContext';

const REMINDER_KEY = 'wts_compoundiq_reminder_at';
const REMINDER_NOTIFIED_KEY = 'wts_compoundiq_reminder_notified_at';
const REMINDER_DAYS = 30;
// All five exported so DataBackup.jsx's Export/Import Backup can carry an adviser's
// notes and Ultra white-label branding along with everything else -- these were added across
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

const MyPlan = ({ country, canWhiteLabel = false, onOpenPricing }) => {
  const { t } = useLanguage();
  const [snapshot, setSnapshot] = useState(null);
  const [currentDebtBalance, setCurrentDebtBalance] = useState('');
  const [currentEfBalance, setCurrentEfBalance] = useState('');
  const [currentLoanBalance, setCurrentLoanBalance] = useState('');
  const [reminderAt, setReminderAt] = useState(null);
  const [reminderDue, setReminderDue] = useState(false);
  // Ultra-tier plan annotation, persisted locally. Kept in storage even when
  // the tier can't currently see it, so a downgrade doesn't destroy typed notes.
  const [adviserNotes, setAdviserNotes] = useState('');
  // Ultra white-label: a firm name/tagline shown atop the plan and carried into
  // print. Persisted locally like the adviser notes, and kept through a downgrade.
  const [branding, setBranding] = useState({ firm: '', tagline: '' });
  // Ultra: a custom compliance/disclosure line (e.g. FAIS / FSP wording) appended
  // to the plan and always included in print.
  const [compliance, setCompliance] = useState('');
  // Ultra: the adviser's name, shown as "Prepared by X on <date>" under the
  // branded header (and in print).
  const [preparedBy, setPreparedBy] = useState('');
  // Ultra: which client this printed plan is for, e.g. "Prepared by X for Y".
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
        new Notification('WTS CompoundIQ', { body: t('plan.notifBody') });
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
    if (!window.confirm(t('plan.clearConfirm'))) return;
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
          {clientName.trim() ? t('left.preparedByFor', { name: preparedBy.trim(), client: clientName.trim() }) : t('left.preparedBy', { name: preparedBy.trim() })} · {new Date().toLocaleDateString()}
        </span>
      )}
    </div>
  ) : null;

  const brandingEditor = canWhiteLabel ? (
    <div className="plan-branding-editor no-print">
      <h3>{t('plan.practiceBranding')} <span className="plan-adviser-badge">{t('plan.ultraBadge')}</span></h3>
      <div className="plan-branding-fields">
        <input
          type="text"
          value={branding.firm}
          onChange={(e) => updateBranding({ firm: e.target.value })}
          placeholder={t('plan.phFirm')}
          maxLength={80}
        />
        <input
          type="text"
          value={branding.tagline}
          onChange={(e) => updateBranding({ tagline: e.target.value })}
          placeholder={t('plan.phTagline')}
          maxLength={120}
        />
        <input
          type="text"
          value={preparedBy}
          onChange={(e) => updatePreparedBy(e.target.value)}
          placeholder={t('plan.phPrepared')}
          maxLength={80}
        />
        <input
          type="text"
          value={clientName}
          onChange={(e) => updateClientName(e.target.value)}
          placeholder={t('plan.phClient')}
          maxLength={80}
        />
      </div>
    </div>
  ) : null;

  const complianceEditor = canWhiteLabel ? (
    <div className="plan-branding-editor no-print">
      <h3>{t('plan.complianceTitle')} <span className="plan-adviser-badge">{t('plan.ultraBadge')}</span></h3>
      <textarea
        className="plan-compliance-input"
        value={compliance}
        onChange={(e) => updateCompliance(e.target.value)}
        placeholder={t('plan.phCompliance')}
        rows={3}
      />
    </div>
  ) : null;

  const reminderBlock = (
    <div className="plan-reminder">
      {reminderDue ? (
        <>
          <span className="plan-reminder-due">{t('plan.reminderDue', { days: REMINDER_DAYS })}</span>
          <button className="plan-reminder-btn" onClick={setReminder}>{t('plan.snooze', { days: REMINDER_DAYS })}</button>
        </>
      ) : reminderAt ? (
        <>
          <span>{t('plan.reminderSet', { date: new Date(reminderAt).toLocaleDateString() })}</span>
          <button className="plan-reminder-btn secondary" onClick={cancelReminder}>{t('plan.cancel')}</button>
        </>
      ) : (
        <button className="plan-reminder-btn" onClick={setReminder}>{t('plan.remind', { days: REMINDER_DAYS })}</button>
      )}
    </div>
  );

  if (!snapshot) {
    return (
      <div className="card my-plan">
        {brandingBanner}
        <div className="plan-header">
          <h2>{t('plan.title')}</h2>
          <p>{t('plan.emptyIntro')}</p>
        </div>
        {brandingEditor}
        {complianceEditor}
        {compliance.trim() && <div className="plan-compliance-note">{compliance.trim()}</div>}
        {reminderBlock}
        <p className="plan-note">{t('plan.emptyNote', { days: REMINDER_DAYS })}</p>
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
        <h2>{t('plan.title')}</h2>
        <p>{t('plan.intro')}</p>
      </div>

      {hasDebt && (
        <div className="plan-section">
          <h3>{t('plan.debtTitle')} <span className="plan-saved-label">{t('common.savedAgo', { when: fmtDaysAgo(debtDaysAgo, t) })}</span></h3>
          <div className="plan-baseline">
            {t('left.whenSaved', { balance: `${country.symbol} ${Math.round(snapshot.debt.totalBalance).toLocaleString()}`, extra: `${country.symbol} ${snapshot.debt.extraMonthly.toLocaleString()}` })}{' '}
            {debtReachable
              ? t('plan.baselineDebtOn', { n: snapshot.debt.avalancheMonths })
              : t('plan.baselineDebtOff')}
          </div>
          {debtReachable ? (
            <>
              <div className="plan-checkin">
                <label>{t('left.debtBalanceQ', { symbol: country.symbol })}</label>
                <input type="number" min="0" value={currentDebtBalance} onChange={(e) => setCurrentDebtBalance(e.target.value)} placeholder={t('left.expectedPh', { amount: Math.round(debtExpectedRemaining).toLocaleString() })} />
              </div>
              {debtDrift !== null && (
                <p className={`plan-drift ${debtDrift >= 0 ? 'ahead' : 'behind'}`}>
                  {debtDrift >= 0
                    ? t('left.driftAhead', { amount: `${country.symbol} ${Math.round(debtDrift).toLocaleString()}` })
                    : t('left.driftBehind', { amount: `${country.symbol} ${Math.round(-debtDrift).toLocaleString()}` })}
                </p>
              )}
            </>
          ) : (
            <p className="plan-drift behind">{t('plan.debtNoClear')}</p>
          )}
        </div>
      )}

      {hasEf && (
        <div className="plan-section">
          <h3>{t('plan.efTitle')} <span className="plan-saved-label">{t('common.savedAgo', { when: fmtDaysAgo(efDaysAgo, t) })}</span></h3>
          <div className="plan-baseline">
            {t('plan.efBaseline', { saved: `${country.symbol} ${Math.round(snapshot.emergencyFund.currentSavings).toLocaleString()}`, target: `${country.symbol} ${Math.round(snapshot.emergencyFund.targetAmount).toLocaleString()}`, contribution: `${country.symbol} ${snapshot.emergencyFund.monthlyContribution.toLocaleString()}` })}
          </div>
          <div className="plan-checkin">
            <label>{t('plan.efQ', { symbol: country.symbol })}</label>
            <input type="number" min="0" value={currentEfBalance} onChange={(e) => setCurrentEfBalance(e.target.value)} placeholder={t('plan.expected', { amount: Math.round(efExpectedSaved).toLocaleString() })} />
          </div>
          {efDrift !== null && (
            <p className={`plan-drift ${efDrift >= 0 ? 'ahead' : 'behind'}`}>
              {efDrift >= 0
                ? t('plan.ahead', { amount: `${country.symbol} ${Math.round(efDrift).toLocaleString()}` })
                : t('plan.behindEf', { amount: `${country.symbol} ${Math.round(-efDrift).toLocaleString()}` })}
            </p>
          )}
        </div>
      )}

      {hasLoan && (
        <div className="plan-section">
          <h3>{snapshot.loan.loanTypeLabel || t('plan.loanDefault')} <span className="plan-saved-label">{t('common.savedAgo', { when: fmtDaysAgo(loanDaysAgo, t) })}</span></h3>
          <div className="plan-baseline">
            {t('plan.loanBaseline', { principal: `${country.symbol} ${Math.round(snapshot.loan.principal).toLocaleString()}`, rate: snapshot.loan.annualRate, term: loanEffectiveTermLabel(snapshot.loan, t), payment: `${country.symbol} ${loanEffectiveMonthlyPayment(snapshot.loan).toLocaleString()}` })}
          </div>
          <div className="plan-checkin">
            <label>{t('plan.loanQ', { symbol: country.symbol })}</label>
            <input type="number" min="0" value={currentLoanBalance} onChange={(e) => setCurrentLoanBalance(e.target.value)} placeholder={t('plan.expected', { amount: Math.round(loanExpectedRemaining).toLocaleString() })} />
          </div>
          {loanDrift !== null && (
            <p className={`plan-drift ${loanDrift >= 0 ? 'ahead' : 'behind'}`}>
              {loanDrift >= 0
                ? t('plan.ahead', { amount: `${country.symbol} ${Math.round(loanDrift).toLocaleString()}` })
                : t('plan.behindLoan', { amount: `${country.symbol} ${Math.round(-loanDrift).toLocaleString()}` })}
            </p>
          )}
        </div>
      )}

      {hasFire && (
        <div className="plan-section">
          <h3>{t('plan.fireTitle')} <span className="plan-saved-label">{t('common.savedAgo', { when: fmtDaysAgo(daysBetween(snapshot.fire.savedAt), t) })}</span></h3>
          <div className="plan-baseline">
            {t('plan.fireBaseline', { expenses: `${country.symbol} ${Math.round(snapshot.fire.annualExpenses).toLocaleString()}`, rate: snapshot.fire.withdrawalRate, number: `${country.symbol} ${Math.round(snapshot.fire.fireNumber).toLocaleString()}` })}{' '}
            {snapshot.fire.yearsToFire === null ? t('plan.fireNever') : t('plan.fireYears', { n: snapshot.fire.yearsToFire })}.
          </div>
          <p className="plan-note-inline">{t('plan.fireNote')}</p>
        </div>
      )}

      {reminderBlock}

      {brandingEditor}
      {complianceEditor}

      {canWhiteLabel ? (
        <div className="plan-adviser-notes">
          <h3>
            {t('plan.adviserNotes')} <span className="plan-adviser-badge">{t('plan.ultraBadge')}</span>
            {adviserNotesUpdatedAt && (
              <span className="plan-adviser-updated">{t('left.lastEdited', { when: fmtDaysAgo(daysBetween(adviserNotesUpdatedAt), t) })}</span>
            )}
          </h3>
          <textarea
            value={adviserNotes}
            onChange={(e) => updateAdviserNotes(e.target.value)}
            placeholder={t('plan.phNotes')}
            rows={5}
          />
        </div>
      ) : adviserNotes.trim() ? null : (
        <div className="plan-adviser-upsell no-print">
          <p>
            🗒️ <strong>{t('plan.notesUpsellBold')}</strong> {t('plan.notesUpsell')}
            {onOpenPricing && <button type="button" className="plan-adviser-upsell-btn" onClick={onOpenPricing}>{t('nw.viewPricing')}</button>}
          </p>
        </div>
      )}

      {compliance.trim() && (
        <div className="plan-compliance-note">{compliance.trim()}</div>
      )}

      <button className="plan-clear-btn no-print" onClick={clearPlan}>{t('plan.clearPlan')}</button>

      <p className="plan-note">{t('plan.note')}</p>
    </div>
  );
};

export default MyPlan;
