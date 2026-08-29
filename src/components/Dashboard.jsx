// src/components/Dashboard.jsx
// A single glance at everything else in the app already tracks, instead of having to
// visit five separate tabs to piece it together. Purely a read-only view over what's
// already saved in localStorage by Net Worth, Debt Payoff, Emergency Fund, Loan &
// Bond, and Power Tools -- it doesn't compute anything new.
import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { convertAmount } from '../data/countries';
import { daysBetween, fmtDaysAgo } from '../utils/dateAgo';
import { readPlan, loanEffectiveMonthlyPayment, loanEffectiveTermLabel } from '../utils/planStorage';

const NETWORTH_HISTORY_KEY = 'wts_compoundiq_networth_history';

const Dashboard = ({ country, onNavigate }) => {
  const [plan, setPlan] = useState(null);
  const [netWorthEntry, setNetWorthEntry] = useState(null);

  useEffect(() => {
    setPlan(readPlan());
    try {
      const rawHistory = localStorage.getItem(NETWORTH_HISTORY_KEY);
      if (rawHistory) {
        const history = JSON.parse(rawHistory);
        if (Array.isArray(history) && history.length > 0) setNetWorthEntry(history[history.length - 1]);
      }
    } catch { /* ignore corrupt history */ }
  }, []);

  const hasAnything = !!plan?.debt || !!plan?.emergencyFund || !!plan?.loan || !!plan?.fire || !!netWorthEntry;

  return (
    <div className="card dashboard">
      <div className="dashboard-header">
        <h2>📊 Dashboard</h2>
        <p>Everything you've saved elsewhere in the app, at a glance -- this is a read-only summary, not a new calculator. Save a plan from any tab below to see it show up here.</p>
      </div>

      {!hasAnything && (
        <div className="dashboard-empty">
          <p>Nothing saved yet. Visit Net Worth, Debt Payoff, Emergency Fund, Loan & Bond, or Power Tools and look for "Save Snapshot" / "Save This Plan" -- come back here afterward to see it all in one place.</p>
        </div>
      )}

      <div className="dashboard-grid">
        {netWorthEntry ? (
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>💰 Net Worth</h3>
              <span className="dashboard-card-meta">as of {fmtDaysAgo(daysBetween(netWorthEntry.date))}</span>
            </div>
            {/* netWorthEntry was saved while a possibly-different country was active --
                convert from its saved displayCurrency into the currently selected one,
                same as NetWorth.jsx does for the identical stored history entries, so
                switching country here doesn't relabel an unconverted figure. */}
            <strong className={`dashboard-card-value ${netWorthEntry.netWorth >= 0 ? 'positive' : 'negative'}`}>
              {country.symbol} {Math.round(convertAmount(netWorthEntry.netWorth, netWorthEntry.displayCurrency || country.code, country.code)).toLocaleString()}
            </strong>
            <span className="dashboard-card-sub">
              {country.symbol} {Math.round(convertAmount(netWorthEntry.totalAssets, netWorthEntry.displayCurrency || country.code, country.code)).toLocaleString()} assets − {country.symbol} {Math.round(convertAmount(netWorthEntry.totalDebts, netWorthEntry.displayCurrency || country.code, country.code)).toLocaleString()} debts
            </span>
            <button className="dashboard-card-link" onClick={() => onNavigate('Net Worth')}>Open Net Worth →</button>
          </div>
        ) : (
          <div className="dashboard-card empty">
            <h3>💰 Net Worth</h3>
            <p>No snapshot saved yet.</p>
            <button className="dashboard-card-link" onClick={() => onNavigate('Net Worth')}>Set it up →</button>
          </div>
        )}

        {plan?.emergencyFund ? (
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>🛟 Emergency Fund</h3>
              <span className="dashboard-card-meta">saved {fmtDaysAgo(daysBetween(plan.emergencyFund.savedAt))}</span>
            </div>
            <strong className="dashboard-card-value">
              {plan.emergencyFund.targetAmount > 0 ? Math.min(100, Math.round((plan.emergencyFund.currentSavings / plan.emergencyFund.targetAmount) * 100)) : 0}% funded
            </strong>
            <span className="dashboard-card-sub">
              {country.symbol} {Math.round(plan.emergencyFund.currentSavings).toLocaleString()} of {country.symbol} {Math.round(plan.emergencyFund.targetAmount).toLocaleString()} target
            </span>
            <button className="dashboard-card-link" onClick={() => onNavigate('Emergency Fund')}>Open Emergency Fund →</button>
          </div>
        ) : (
          <div className="dashboard-card empty">
            <h3>🛟 Emergency Fund</h3>
            <p>No plan saved yet.</p>
            <button className="dashboard-card-link" onClick={() => onNavigate('Emergency Fund')}>Set it up →</button>
          </div>
        )}

        {plan?.debt ? (
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>💳 Debt Payoff</h3>
              <span className="dashboard-card-meta">saved {fmtDaysAgo(daysBetween(plan.debt.savedAt))}</span>
            </div>
            <strong className="dashboard-card-value warn">{country.symbol} {Math.round(plan.debt.totalBalance).toLocaleString()}</strong>
            <span className="dashboard-card-sub">debt-free in {plan.debt.avalancheMonths} months at this pace</span>
            <button className="dashboard-card-link" onClick={() => onNavigate('Debt Payoff')}>Open Debt Payoff →</button>
          </div>
        ) : (
          <div className="dashboard-card empty">
            <h3>💳 Debt Payoff</h3>
            <p>No plan saved yet.</p>
            <button className="dashboard-card-link" onClick={() => onNavigate('Debt Payoff')}>Set it up →</button>
          </div>
        )}

        {plan?.loan ? (
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>{plan.loan.loanTypeLabel || '🏦 Loan'}</h3>
              <span className="dashboard-card-meta">saved {fmtDaysAgo(daysBetween(plan.loan.savedAt))}</span>
            </div>
            <strong className="dashboard-card-value warn">{country.symbol} {Math.round(plan.loan.principal).toLocaleString()}</strong>
            {/* monthlyPayment is the required base installment; extraMonthly (if any) is what's
                actually being paid each month to hit the accelerated payoffMonths/totalInterest
                saved above -- show the real total (and the real, shortened payoff horizon) so
                this doesn't understate the payment or contradict itself with the nominal term. */}
            <span className="dashboard-card-sub">{country.symbol} {loanEffectiveMonthlyPayment(plan.loan).toLocaleString()}/mo over {loanEffectiveTermLabel(plan.loan)}</span>
            <button className="dashboard-card-link" onClick={() => onNavigate('Loan & Bond')}>Open Loan & Bond →</button>
          </div>
        ) : (
          <div className="dashboard-card empty">
            <h3>🏦 Loan / Bond</h3>
            <p>No plan saved yet.</p>
            <button className="dashboard-card-link" onClick={() => onNavigate('Loan & Bond')}>Set it up →</button>
          </div>
        )}

        {plan?.fire ? (
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>🔥 FIRE Target</h3>
              <span className="dashboard-card-meta">saved {fmtDaysAgo(daysBetween(plan.fire.savedAt))}</span>
            </div>
            <strong className="dashboard-card-value positive">{country.symbol} {Math.round(plan.fire.fireNumber).toLocaleString()}</strong>
            <span className="dashboard-card-sub">
              {plan.fire.yearsToFire === null ? 'not reachable within 60 years at that pace' : `~${plan.fire.yearsToFire} years out`}
            </span>
            <button className="dashboard-card-link" onClick={() => onNavigate('Power Tools')}>Open Power Tools →</button>
          </div>
        ) : (
          <div className="dashboard-card empty">
            <h3>🔥 FIRE Target</h3>
            <p>No target saved yet.</p>
            <button className="dashboard-card-link" onClick={() => onNavigate('Power Tools')}>Set it up →</button>
          </div>
        )}
      </div>

      {hasAnything && (
        <button className="dashboard-myplan-link" onClick={() => onNavigate('My Plan')}>
          📓 Go to My Plan to check in on progress since you saved →
        </button>
      )}

      <p className="dashboard-note">
        Everything here lives only in your browser's local storage -- nothing is sent anywhere, and none of these
        numbers recompute automatically. Revisit each tab and save again to refresh what's shown here.
      </p>
    </div>
  );
};

export default Dashboard;
