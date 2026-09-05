// src/components/Dashboard.jsx
// A single glance at everything else in the app already tracks, instead of having to
// visit seven separate tabs to piece it together. Purely a read-only view over what's
// already saved in localStorage by Net Worth, Budget, Invest, Debt Payoff, Emergency
// Fund, Loan & Bond, and Power Tools -- it doesn't compute anything new.
import React, { useState, useEffect, useMemo } from 'react';
import './Dashboard.css';
import { convertAmount } from '../data/countries';
import { daysBetween, fmtDaysAgo } from '../utils/dateAgo';
import { readPlan, loanEffectiveMonthlyPayment, loanEffectiveTermLabel } from '../utils/planStorage';
import SnapshotChart from './SnapshotChart';
import HealthScoreGauge from './HealthScoreGauge';
import { HISTORY_KEY as NETWORTH_HISTORY_KEY, isValidNetWorthEntry } from './NetWorth';
import { HISTORY_KEY as DEBTPAYOFF_HISTORY_KEY, isValidDebtHistoryEntry } from './DebtPayoff';
import { HISTORY_KEY as EMERGENCYFUND_HISTORY_KEY, isValidEfHistoryEntry } from './EmergencyFund';
import { BUDGET_HISTORY_KEY, isValidBudgetHistoryEntry } from '../budgetEngine';
import { BRANDING_KEY as REPORT_BRANDING_KEY, DEFAULT_BRANDING } from './Snapshot';
import { GOALS_KEY as INVEST_GOALS_KEY } from './Invest';
import { COMPLIANCE_KEY } from './MyPlan';
import { scoreEmergencyFund, scoreDebtPayoff, scoreNetWorthTrend, scoreFireProgress, computeHealthScore } from '../financialHealthScore';
import { detectNetWorthMilestones, detectDebtClearedMilestone, detectEfFundedMilestone, sortMilestones } from '../milestones';
import { buildNextSteps } from '../nextSteps';
import { readJSONArray } from '../utils/storage';

const NETWORTH_SERIES = [{ key: 'assets', label: 'Assets' }, { key: 'debts', label: 'Debts' }, { key: 'net', label: 'Net Worth' }];
const DEBT_SERIES = [{ key: 'total', label: 'Total Debt Balance' }];
// colorKey: see SnapshotChart.jsx's SERIES_COLOR_VAR note -- 'total' is also Debt
// Payoff's field name (colored debt-red), but a growing EF balance is the opposite
// semantic, so this needs its own colorKey rather than inheriting that color.
const EF_SERIES = [{ key: 'total', label: 'Emergency Fund Balance', colorKey: 'efBalance' }];
const BUDGET_SERIES = [{ key: 'surplus', label: 'Monthly Surplus' }];

// reportingCountry: the currency Net Worth's own tab currently displays in (see
// App.jsx) -- independent of `country` (the Calculator scenario's country), since Net
// Worth's saved figures already carry proper per-snapshot currency conversion and can
// safely be shown in a different currency than whatever the Calculator is set to.
// Debt/Emergency Fund/Loan/FIRE below intentionally still use `country` -- their saved
// figures are raw numbers with no conversion pipeline behind them, so relabeling their
// symbol without converting the number would misrepresent the amount.
const Dashboard = ({ country, reportingCountry, onNavigate, canWhiteLabel = false }) => {
  const netWorthCountry = reportingCountry || country;
  const [plan, setPlan] = useState(null);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [debtHistory, setDebtHistory] = useState([]);
  const [efHistory, setEfHistory] = useState([]);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [investGoals, setInvestGoals] = useState([]);
  // Ultra white-label (canWhiteLabel is passed in as canAccess('Ultra'), same as
  // Snapshot/MyPlan): read-only here too (same reuse as Snapshot's own compliance text
  // on the flip side -- see MyPlan.jsx's BRANDING_KEY note) so the Dashboard PDF export
  // carries the same firm details as the client report, not a blank masthead.
  const [reportBranding, setReportBranding] = useState(DEFAULT_BRANDING);
  // Read-only reuse of the same compliance text set once on My Plan (see Snapshot.jsx's
  // identical reuse) -- one field, now three documents.
  const [compliance, setCompliance] = useState('');

  useEffect(() => {
    setPlan(readPlan());
    setNetWorthHistory(readJSONArray(NETWORTH_HISTORY_KEY));
    setDebtHistory(readJSONArray(DEBTPAYOFF_HISTORY_KEY));
    setEfHistory(readJSONArray(EMERGENCYFUND_HISTORY_KEY));
    setBudgetHistory(readJSONArray(BUDGET_HISTORY_KEY));
    setInvestGoals(readJSONArray(INVEST_GOALS_KEY));
    try {
      const stored = JSON.parse(localStorage.getItem(REPORT_BRANDING_KEY) || '{}');
      setReportBranding({ ...DEFAULT_BRANDING, ...stored });
    } catch { /* ignore corrupt value, keep defaults */ }
    try { setCompliance(localStorage.getItem(COMPLIANCE_KEY) || ''); } catch { /* ignore */ }
  }, []);

  // Same non-numeric guard NetWorth.jsx applies to this same history key (imported
  // above as isValidNetWorthEntry) -- a hand-edited or partially-written localStorage
  // value (or an incompatible imported backup) could leave a history entry with a
  // non-numeric `netWorth`, `totalAssets`, or `totalDebts`, and that single entry would
  // otherwise poison both the headline card (Math.round(NaN) -> "NaN") and the trend
  // chart's min/max scaling (every point on the line, not just the bad one).
  const validNetWorthHistory = useMemo(() => netWorthHistory.filter(isValidNetWorthEntry), [netWorthHistory]);
  const netWorthEntry = validNetWorthHistory.length > 0 ? validNetWorthHistory[validNetWorthHistory.length - 1] : null;

  // Same currency-conversion handling as each source tab's own convertedHistory --
  // a snapshot saved under a different currency gets converted, not relabeled.
  const netWorthPoints = useMemo(() => validNetWorthHistory.map(h => {
    const from = h.displayCurrency || netWorthCountry.code;
    return {
      date: h.date,
      net: convertAmount(h.netWorth, from, netWorthCountry.code),
      assets: convertAmount(h.totalAssets ?? h.netWorth, from, netWorthCountry.code),
      debts: convertAmount(h.totalDebts ?? 0, from, netWorthCountry.code)
    };
  }), [validNetWorthHistory, netWorthCountry.code]);

  // Same non-numeric-`total` guard DebtPayoff.jsx/EmergencyFund.jsx apply to these same
  // history keys (imported above as isValidDebtHistoryEntry/isValidEfHistoryEntry) --
  // one bad point would otherwise poison SnapshotChart's min/max scaling and break the
  // whole chart, not just that one point.
  const debtPoints = useMemo(() => debtHistory
    .filter(isValidDebtHistoryEntry)
    .map(h => ({ date: h.date, total: convertAmount(h.total, h.displayCurrency || country.code, country.code) })),
  [debtHistory, country.code]);

  const efPoints = useMemo(() => efHistory
    .filter(isValidEfHistoryEntry)
    .map(h => ({ date: h.date, total: convertAmount(h.total, h.displayCurrency || country.code, country.code) })),
  [efHistory, country.code]);

  const budgetPoints = useMemo(() => budgetHistory
    .filter(isValidBudgetHistoryEntry)
    .map(h => ({ date: h.date, surplus: convertAmount(h.surplus, h.displayCurrency || country.code, country.code) })),
  [budgetHistory, country.code]);
  const lastBudgetEntry = budgetPoints.length > 0 ? budgetPoints[budgetPoints.length - 1] : null;

  // Invest goals are "live" working data (Invest.jsx's own usePersistedState, no "Save
  // This Plan" snapshot step), like Net Worth/Debt Payoff/Emergency Fund/Loan's raw
  // number fields above -- so this reads current values straight off country.symbol
  // too, no currency-conversion pipeline to run through. Just totals here (count,
  // target, already saved) -- the per-goal required-monthly figure needs the
  // Calculator's live rate/inflation/wrapper, which this read-only aggregate view
  // doesn't otherwise depend on; see Invest.jsx itself for that number.
  const investSummary = investGoals.length > 0 ? {
    count: investGoals.length,
    totalTarget: investGoals.reduce((s, g) => s + (g.goalAmount || 0), 0),
    totalSaved: investGoals.reduce((s, g) => s + (g.startingAmount || 0), 0)
  } : null;

  const hasAnything = !!plan?.debt || !!plan?.emergencyFund || !!plan?.loan || !!plan?.fire || !!netWorthEntry || !!lastBudgetEntry || !!investSummary;

  const hasTrends = netWorthPoints.length > 1 || debtPoints.length > 1 || efPoints.length > 1 || budgetPoints.length > 1;

  // Financial Health Score: one composite number built from whatever's already saved
  // above -- see financialHealthScore.js for why each component is optional (null when
  // that tool's never been used) rather than scored as a failing 0. Net worth trend
  // needs at least two points to mean anything; a single snapshot has no trend to score.
  const efFundedPct = plan?.emergencyFund
    ? (plan.emergencyFund.targetAmount > 0 ? (plan.emergencyFund.currentSavings / plan.emergencyFund.targetAmount) * 100 : 0)
    : null;
  const healthScore = useMemo(() => computeHealthScore([
    { key: 'ef', label: '🛟 Emergency Fund', score: scoreEmergencyFund(efFundedPct) },
    { key: 'debt', label: '💳 Debt Payoff', score: scoreDebtPayoff(plan?.debt?.totalBalance, plan?.debt?.avalancheMonths) },
    {
      key: 'netWorth',
      label: '💰 Net Worth Trend',
      score: netWorthPoints.length > 1 ? scoreNetWorthTrend(netWorthPoints[0].net, netWorthPoints[netWorthPoints.length - 1].net) : null
    },
    { key: 'fire', label: '🔥 FIRE Progress', score: scoreFireProgress(plan?.fire?.yearsToFire) }
  ]), [efFundedPct, plan, netWorthPoints]);

  // Milestones: pure pattern-matching over the same history/plan data above -- no new
  // inputs, nothing computed that isn't already implied by what's been saved elsewhere.
  const milestones = useMemo(() => sortMilestones([
    ...detectNetWorthMilestones(netWorthPoints, netWorthCountry.code),
    ...detectDebtClearedMilestone(debtPoints),
    ...detectEfFundedMilestone(plan?.emergencyFund)
  ]), [netWorthPoints, netWorthCountry.code, debtPoints, plan]);

  // Same pattern-matching approach as the milestones above -- reads only what's already
  // saved and surfaces the obvious gaps as tab shortcuts. No new numbers, no advice.
  const nextSteps = useMemo(() => buildNextSteps({
    plan,
    hasNetWorth: !!netWorthEntry,
    hasHealthScore: !!healthScore
  }), [plan, netWorthEntry, healthScore]);

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="card dashboard">
      <div className="dashboard-print-masthead">
        {canWhiteLabel && reportBranding.logoDataUrl && (
          <img src={reportBranding.logoDataUrl} alt={`${reportBranding.firmName || 'Firm'} logo`} className="dashboard-print-logo" />
        )}
        <h1>{canWhiteLabel && reportBranding.firmName ? reportBranding.firmName : 'WTS CompoundIQ'} -- Financial Dashboard</h1>
        <p>
          {netWorthCountry.name} · Generated {today}
          {canWhiteLabel && reportBranding.advisorName && ` · Prepared by ${reportBranding.advisorName}`}
          {canWhiteLabel && reportBranding.clientName && ` · Prepared for ${reportBranding.clientName}`}
        </p>
      </div>

      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h2>📊 Dashboard</h2>
          <p>Everything you've saved elsewhere in the app, at a glance -- this is a read-only summary, not a new calculator. Save a plan from any tab below to see it show up here.</p>
        </div>
        {hasAnything && (
          <button className="dashboard-print-btn no-print" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
        )}
      </div>

      {hasAnything && canWhiteLabel && !reportBranding.firmName && (
        <p className="dashboard-branding-hint no-print">
          🏷️ This PDF export can carry your firm's name and logo -- set them up in the Snapshot tab's Client Report Branding section and they'll appear here too.
        </p>
      )}

      {!hasAnything && (
        <div className="dashboard-empty">
          <p>Nothing saved yet. Visit Net Worth, Budget, Debt Payoff, Emergency Fund, Loan & Bond, or Power Tools and look for "Save Snapshot" / "Log This Month's Surplus" / "Save This Plan" -- come back here afterward to see it all in one place.</p>
        </div>
      )}

      {healthScore && (
        <>
          <HealthScoreGauge score={healthScore.score} grade={healthScore.grade} label={healthScore.label} components={healthScore.components} />
          <p className="dashboard-note dashboard-health-note">
            A rough composite of what you've saved above ({healthScore.components.length} of 4 possible areas) -- not a credit
            score or financial advice. Save a plan/snapshot in more tabs to bring the rest of it in.
          </p>
        </>
      )}

      {milestones.length > 0 && (
        <div className="dashboard-milestones">
          <h3>🏆 Milestones</h3>
          <ul>
            {milestones.map(m => (
              <li key={m.key}>
                <span className="dashboard-milestone-icon">{m.icon}</span>
                <span className="dashboard-milestone-label">
                  {m.label}{m.amount != null && ` ${netWorthCountry.symbol}${Math.round(m.amount).toLocaleString()}`}
                </span>
                <span className="dashboard-milestone-date">{fmtDaysAgo(daysBetween(m.date))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nextSteps.length > 0 && (
        <div className="dashboard-nextsteps no-print">
          <h3>✅ Suggested next steps</h3>
          <ul>
            {nextSteps.map((s, i) => (
              <li key={i}>
                <span className="dashboard-nextstep-text">{s.text}</span>
                {s.tab && (
                  <button className="dashboard-card-link" onClick={() => onNavigate(s.tab)}>Open {s.tab} →</button>
                )}
              </li>
            ))}
          </ul>
          <p className="dashboard-note">Pattern-matched from what you've saved so far — not advice, just the obvious gaps.</p>
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
              {/* A snapshot saved before totalAssets/totalDebts were tracked has neither
                  -- same fallback as netWorthPoints above, so this card shows a sane
                  figure instead of "NaN assets". */}
              {netWorthCountry.symbol} {Math.round(convertAmount(netWorthEntry.totalAssets ?? netWorthEntry.netWorth, netWorthEntry.displayCurrency || netWorthCountry.code, netWorthCountry.code)).toLocaleString()} assets − {netWorthCountry.symbol} {Math.round(convertAmount(netWorthEntry.totalDebts ?? 0, netWorthEntry.displayCurrency || netWorthCountry.code, netWorthCountry.code)).toLocaleString()} debts
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

        {lastBudgetEntry ? (
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>🧮 Budget Surplus</h3>
              <span className="dashboard-card-meta">as of {fmtDaysAgo(daysBetween(lastBudgetEntry.date))}</span>
            </div>
            <strong className={`dashboard-card-value ${lastBudgetEntry.surplus >= 0 ? 'positive' : 'negative'}`}>
              {lastBudgetEntry.surplus >= 0 ? '' : '−'}{country.symbol} {Math.abs(Math.round(lastBudgetEntry.surplus)).toLocaleString()}/mo
            </strong>
            <span className="dashboard-card-sub">{lastBudgetEntry.surplus >= 0 ? 'monthly surplus, last logged' : 'monthly deficit, last logged'}</span>
            <button className="dashboard-card-link" onClick={() => onNavigate('Budget')}>Open Budget →</button>
          </div>
        ) : (
          <div className="dashboard-card empty">
            <h3>🧮 Budget Surplus</h3>
            <p>No snapshot logged yet.</p>
            <button className="dashboard-card-link" onClick={() => onNavigate('Budget')}>Set it up →</button>
          </div>
        )}

        {investSummary ? (
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>🎯 Invest Goals</h3>
              <span className="dashboard-card-meta">{investSummary.count} goal{investSummary.count === 1 ? '' : 's'}</span>
            </div>
            <strong className="dashboard-card-value">{country.symbol} {Math.round(investSummary.totalTarget).toLocaleString()}</strong>
            <span className="dashboard-card-sub">combined target, {country.symbol} {Math.round(investSummary.totalSaved).toLocaleString()} already saved toward it</span>
            <button className="dashboard-card-link" onClick={() => onNavigate('Invest')}>Open Invest →</button>
          </div>
        ) : (
          <div className="dashboard-card empty">
            <h3>🎯 Invest Goals</h3>
            <p>No goals added yet.</p>
            <button className="dashboard-card-link" onClick={() => onNavigate('Invest')}>Set it up →</button>
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
            <span className="dashboard-card-sub">{plan.debt.avalancheReachable === false ? 'not debt-free within 50 years at this pace' : `debt-free in ${plan.debt.avalancheMonths} months at this pace`}</span>
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
          {budgetPoints.length > 1 && (
            <div className="dashboard-trend-card">
              <span className="dashboard-trend-label">🧮 Budget Surplus</span>
              <SnapshotChart points={budgetPoints} series={BUDGET_SERIES} symbol={country.symbol} />
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

      {canWhiteLabel && compliance.trim() && (
        <p className="dashboard-note dashboard-print-compliance">{compliance.trim()}</p>
      )}
      {canWhiteLabel && ((reportBranding.contactInfo || '').trim() || (reportBranding.fspNumber || '').trim()) && (
        <p className="dashboard-note dashboard-print-compliance">
          {(reportBranding.firmName || '').trim() || 'Contact'}
          {(reportBranding.fspNumber || '').trim() && ` (${reportBranding.fspNumber.trim()})`}
          {(reportBranding.contactInfo || '').trim() && `: ${reportBranding.contactInfo.trim()}`}
        </p>
      )}
    </div>
  );
};

export default Dashboard;
