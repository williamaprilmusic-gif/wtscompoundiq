// src/components/MyPlan.jsx
import React, { useState, useEffect } from 'react';
import './MyPlan.css';

const STORAGE_KEY = 'wts_compoundiq_plan_snapshot';
const REMINDER_KEY = 'wts_compoundiq_reminder_at';
const REMINDER_NOTIFIED_KEY = 'wts_compoundiq_reminder_notified_at';
const REMINDER_DAYS = 30;

const daysBetween = (isoDate) => Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24)));
const monthsBetween = (isoDate) => daysBetween(isoDate) / 30.44;

const MyPlan = ({ country }) => {
  const [snapshot, setSnapshot] = useState(null);
  const [currentDebtBalance, setCurrentDebtBalance] = useState('');
  const [currentEfBalance, setCurrentEfBalance] = useState('');
  const [reminderAt, setReminderAt] = useState(null);
  const [reminderDue, setReminderDue] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setSnapshot(JSON.parse(raw)); } catch { /* ignore corrupt snapshot */ }
    }

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
    if (!window.confirm("Clear your saved plan? This removes your saved Debt Payoff and Emergency Fund snapshot from My Plan -- it doesn't affect the Debt Payoff or Emergency Fund tabs themselves.")) return;
    localStorage.removeItem(STORAGE_KEY);
    setSnapshot(null);
    setCurrentDebtBalance('');
    setCurrentEfBalance('');
  };


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
        <div className="plan-header">
          <h2>📓 My Plan</h2>
          <p>Nothing saved yet. This is a check-in tool, not a calculator -- save a snapshot from the Debt Payoff or Emergency Fund tabs (look for "Save This Plan"), then come back later to see if you're on track.</p>
        </div>
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

  let debtExpectedRemaining = null;
  let debtDrift = null;
  let debtDaysAgo = null;
  if (hasDebt) {
    debtDaysAgo = daysBetween(snapshot.debt.savedAt);
    const monthsElapsed = monthsBetween(snapshot.debt.savedAt);
    const monthlyPayoffRate = snapshot.debt.avalancheMonths > 0 ? snapshot.debt.totalBalance / snapshot.debt.avalancheMonths : 0;
    debtExpectedRemaining = Math.max(0, snapshot.debt.totalBalance - monthlyPayoffRate * monthsElapsed);
    if (currentDebtBalance !== '') {
      debtDrift = debtExpectedRemaining - Number(currentDebtBalance);
    }
  }

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

  const fmtDaysAgo = (d) => d === 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`;

  return (
    <div className="card my-plan">
      <div className="plan-header">
        <h2>📓 My Plan</h2>
        <p>Enter where things actually stand to see if you're ahead or behind your own plan.</p>
      </div>

      {hasDebt && (
        <div className="plan-section">
          <h3>💳 Debt Payoff <span className="plan-saved-label">saved {fmtDaysAgo(debtDaysAgo)}</span></h3>
          <div className="plan-baseline">
            When saved: {country.symbol} {Math.round(snapshot.debt.totalBalance).toLocaleString()} total debt,
            paying {country.symbol} {snapshot.debt.extraMonthly.toLocaleString()}/mo extra,
            on pace to be debt-free in {snapshot.debt.avalancheMonths} months.
          </div>
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

      {reminderBlock}

      <button className="plan-clear-btn" onClick={clearPlan}>Clear saved plan</button>

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
