// src/components/Dashboard.jsx
// A single glance at everything else in the app already tracks, instead of having to
// visit five separate tabs to piece it together. Purely a read-only view over what's
// already saved in localStorage by Net Worth, Debt Payoff, Emergency Fund, Loan &
// Bond, and Power Tools -- it doesn't compute anything new.
import React, { useState, useEffect, useMemo } from 'react';
import './Dashboard.css';
import { convertAmount } from '../data/countries';
import { daysBetween, fmtDaysAgo } from '../utils/dateAgo';
import { readPlan, loanEffectiveMonthlyPayment, loanEffectiveTermLabel } from '../utils/planStorage';
import SnapshotChart from './SnapshotChart';

const NETWORTH_HISTORY_KEY = 'wts_compoundiq_networth_history';
const DEBTPAYOFF_HISTORY_KEY = 'wts_compoundiq_debtpayoff_history';
const EMERGENCYFUND_HISTORY_KEY = 'wts_compoundiq_emergencyfund_history';
const NETWORTH_SERIES = [{ key: 'assets', label: 'Assets' }, { key: 'debts', label: 'Debts' }, { key: 'net', label: 'Net Worth' }];
const DEBT_SERIES = [{ key: 'total', label: 'Total Debt Balance' }];
const EF_SERIES = [{ key: 'total', label: 'Emergency Fund Balance' }];

const readHistory = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; } // corrupt/foreign JSON in that key -- treat as no history rather than crash
};

// reportingCountry: the currency Net Worth's own tab currently displays in (see
// App.jsx) -- independent of `country` (the Calculator scenario's country), since Net
// Worth's saved figures already carry proper per-snapshot currency conversion and can
// safely be shown in a different currency than whatever the Calculator is set to.
// Debt/Emergency Fund/Loan/FIRE below intentionally still use `country` -- their saved
// figures are raw numbers with no conversion pipeline behind them, so relabeling their
// symbol without converting the number would misrepresent the amount.
const Dashboard = ({ country, reportingCountry, onNavigate }) => {
  const netWorthCountry = reportingCountry || country;
  const [plan, setPlan] = useState(null);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [debtHistory, setDebtHistory] = useState([]);
  const [efHistory, setEfHistory] = useState([]);

  useEffect(() => {
    setPlan(readPlan());
    setNetWorthHistory(readHistory(NETWORTH_HISTORY_KEY));
    setDebtHistory(readHistory(DEBTPAYOFF_HISTORY_KEY));
    setEfHistory(readHistory(EMERGENCYFUND_HISTORY_KEY));
  }, []);

  const netWorthEntry = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1] : null;
  const hasAnything = !!plan?.debt || !!plan?.emergencyFund || !!plan?.loan || !!plan?.fire || !!netWorthEntry;

  // Same currency-conversion handling as each source tab's own convertedHistory --
  // a snapshot saved under a different currency gets converted, not relabeled.
  const netWorthPoints = useMemo(() => netWorthHistory.map(h => {
    const from = h.displayCurrency || netWorthCountry.code;
    return {
      date: h.date,
      net: convertAmount(h.netWorth, from, netWorthCountry.code),
      assets: convertAmount(h.totalAssets ?? h.netWorth, from, netWorthCountry.code),
      debts: convertAmount(h.totalDebts ?? 0, from, netWorthCountry.code)
    };
  }), [netWorthHistory, netWorthCountry.code]);

  const debtPoints = useMemo(() => debtHistory.map(h => ({
    date: h.date,
    total: convertAmount(h.total, h.displayCurrency || country.code, country.code)
  })), [debtHistory, country.code]);

  const efPoints = useMemo(() => efHistory.map(h => ({
    date: h.date,
    total: convertAmount(h.total, h.displayCurrency || country.code, country.code)
  })), [efHistory, country.code]);

  const hasTrends = netWorthPoints.length > 1 || debtPoints.length > 1 || efPoints.length > 1;

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
            {/* netWorthEntry was saved while a possibly-different currency was active --
                convert from its saved displayCurrency into netWorthCountry (Net Worth's
                own tab's reporting currency, independent of the Calculator's country),
                same as NetWorth.jsx does for the identical stored history entries, so
                switching either doesn't relabel an unconverted figure. */}
            <strong className={`dashboard-card-value ${netWorthEntry.netWorth >= 0 ? 'positive' : 'negative'}`}>
              {netWorthCountry.symbol} {Math.round(convertAmount(netWorthEntry.netWorth, netWorthEntry.displayCurrency || netWorthCountry.code, netWorthCountry.code)).toLocaleString()}
            </strong>
            <span className="dashboard-card-sub">
              {netWorthCountry.symbol} {Math.round(convertAmount(netWorthEntry.totalAssets, netWorthEntry.displayCurrency || netWorthCountry.code, netWorthCountry.code)).toLocaleString()} assets − {netWorthCountry.symbol} {Math.round(convertAmount(netWorthEntry.totalDebts, netWorthEntry.displayCurrency || netWorthCountry.code, netWorthCountry.code)).toLocaleString()} debts
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

      {hasTrends && (
        <div className="dashboard-trends">
          <h3>Trends</h3>
          {netWorthPoints.length > 1 && (
            <div className="dashboard-trend-card">
              <span className="dashboard-trend-label">💰 Net Worth</span>
              <SnapshotChart points={netWorthPoints} series={NETWORTH_SERIES} symbol={netWorthCountry.symbol} />
            </div>
          )}
          {debtPoints.length > 1 && (
            <div className="dashboard-trend-card">
              <span className="dashboard-trend-label">💳 Debt Payoff</span>
              <SnapshotChart points={debtPoints} series={DEBT_SERIES} symbol={country.symbol} />
            </div>
          )}
          {efPoints.length > 1 && (
            <div className="dashboard-trend-card">
              <span className="dashboard-trend-label">🛟 Emergency Fund</span>
              <SnapshotChart points={efPoints} series={EF_SERIES} symbol={country.symbol} />
            </div>
          )}
        </div>
      )}

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
