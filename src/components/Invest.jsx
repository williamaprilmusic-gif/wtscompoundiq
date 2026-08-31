// src/components/Invest.jsx
import React, { useState } from 'react';
import './Invest.css';
import { calculateCompoundInterest } from '../engine';
import { solveMonthlyForGoal } from '../goalSolver';
import { usePersistedState } from '../utils/usePersistedState';
import { confirmRemoval } from '../utils/confirmRemoval';
import { parseCSV, downloadCSV, cleanCSVNumber } from '../utils/csv';
import { uniqueId } from '../utils/uniqueId';

const GOALS_KEY = 'wts_compoundiq_invest_goals';

const GOAL_PRESETS = [
  { label: 'Retirement', amount: 2000000, years: 25 },
  { label: 'House Deposit', amount: 300000, years: 5 },
  { label: 'Emergency Fund', amount: 60000, years: 2 },
  { label: 'Custom Goal', amount: 0, years: 1 }
];

const downloadTemplate = () => {
  downloadCSV('wts-compoundiq-goals-template.csv', [
    ['label', 'startingAmount', 'goalAmount', 'goalYears'],
    ['House Deposit', '20000', '300000', '5'],
    ['Wedding Fund', '0', '80000', '2']
  ]);
};

const Invest = ({ country, rate, inflation, wrapper, compoundFrequency = 12, contributionIncrease = 0 }) => {
  const [goals, setGoals] = usePersistedState(GOALS_KEY, []);
  const [importError, setImportError] = useState(null);

  const addGoal = (preset) => {
    setGoals(prev => [...prev, {
      id: uniqueId(),
      label: preset?.label ?? 'New Goal',
      startingAmount: 0,
      goalAmount: preset?.amount ?? 0,
      goalYears: preset?.years ?? 1,
      // Some presets (Retirement, House Deposit, Emergency Fund) start with a nonzero
      // goalAmount, so "goalAmount > 0" alone can't tell a preset the user just clicked
      // apart from one they've actually edited. Track edits explicitly instead: stays
      // false until the user touches any field, so removeGoal below can tell "just
      // added" from "has real data" regardless of the preset's own defaults.
      touched: false
    }]);
  };

  const updateGoal = (id, field, value) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: field === 'label' ? value : Number(value), touched: true } : g));
  };

  // See NetWorth.jsx's removeItem for why this only confirms once a goal actually
  // has real data entered -- a freshly-added preset removed right away doesn't need a
  // safety check. `touched !== false` (rather than `=== true`) so goals saved before
  // this field existed -- which have no `touched` at all -- default to being treated
  // as real data and still get a confirmation.
  const removeGoal = (id) => {
    const goal = goals.find(g => g.id === id);
    const hasData = !!(goal && goal.touched !== false);
    if (!confirmRemoval(hasData, `Remove "${(goal?.label || '').trim() || 'this goal'}"? This can't be undone.`)) return;
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Bulk-import goals from a CSV (label, startingAmount, goalAmount, goalYears
  // columns, any order, case-insensitive headers) -- same tolerant parsing approach
  // as Net Worth's/Debt Payoff's CSV import. Imported goals are marked touched --
  // they carry real user data (from the file), not a preset default.
  const importCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(String(e.target.result));
        if (rows.length < 2) { setImportError('That CSV has no data rows -- see the template for the expected format.'); return; }
        const header = rows[0].map(h => h.trim().toLowerCase());
        const labelIdx = header.indexOf('label');
        const startingIdx = header.indexOf('startingamount');
        const goalIdx = header.indexOf('goalamount');
        const yearsIdx = header.indexOf('goalyears');
        if (labelIdx === -1 || goalIdx === -1) {
          setImportError('CSV needs at least "label" and "goalAmount" columns -- download the template below for the expected format.');
          return;
        }
        const imported = rows.slice(1).map((r) => ({
          id: uniqueId(),
          label: (r[labelIdx] || '').trim().slice(0, 80),
          startingAmount: startingIdx !== -1 ? cleanCSVNumber(r[startingIdx]) : 0,
          goalAmount: cleanCSVNumber(r[goalIdx]),
          goalYears: yearsIdx !== -1 ? Math.max(1, cleanCSVNumber(r[yearsIdx]) || 1) : 1,
          touched: true
        })).filter(g => g.label && g.goalAmount > 0);

        if (imported.length === 0) {
          setImportError('No usable rows found -- each row needs a label and a goalAmount greater than 0.');
          return;
        }
        setGoals(prev => [...prev, ...imported]);
        setImportError(null);
      } catch {
        setImportError("Could not read that file -- make sure it's a plain .csv export.");
      }
    };
    reader.readAsText(file);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (file) importCSV(file);
    e.target.value = ''; // allow re-selecting the same file later
  };

  const computed = goals.map(g => {
    // Guard against a transient 0/blank "years" value while the user is mid-edit
    // (clearing the field to retype it sends Number('') = 0 through here). With
    // years = 0, calculateCompoundInterest's loop never runs, so finalBalance is
    // pinned to startingAmount regardless of the monthly contribution tried --
    // the binary search then can't converge and returns its huge upper bound as
    // "required monthly". Clamp only for the calculation, not the stored/displayed value.
    const safeYears = g.goalYears > 0 ? g.goalYears : 1;
    const requiredMonthly = solveMonthlyForGoal({
      startingAmount: g.startingAmount, rate, years: safeYears, inflation, taxRate: country.taxRate, wrapper, goalAmount: g.goalAmount, compoundFrequency,
      annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit, contributionIncreaseRate: contributionIncrease
    });
    const projection = calculateCompoundInterest({
      initial: g.startingAmount, monthly: requiredMonthly, rate, years: safeYears, inflation, taxRate: country.taxRate, wrapper, compoundFrequency,
      annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit, contributionIncreaseRate: contributionIncrease
    });
    return { ...g, requiredMonthly, projection };
  });

  const combinedMonthly = computed.reduce((sum, g) => sum + g.requiredMonthly, 0);

  return (
    <div className="card invest-planner">
      <div className="invest-header">
        <h2>📈 Goal-Based Investment Planner</h2>
        <p>Track multiple goals at once -- each works backwards from its own target to find the monthly contribution it needs.</p>
        <div className="invest-import-row">
          <label className="invest-import-btn">
            📥 Import CSV
            <input type="file" accept=".csv,text/csv" onChange={handleImportFile} hidden />
          </label>
          <button className="invest-template-btn" onClick={downloadTemplate}>Download template</button>
        </div>
        {importError && <p className="invest-import-error">⚠️ {importError}</p>}
      </div>

      <div className="goal-presets">
        {GOAL_PRESETS.map((preset) => (
          <button key={preset.label} className="goal-preset-btn" onClick={() => addGoal(preset)}>
            + {preset.label}
          </button>
        ))}
      </div>

      {goals.length === 0 && (
        <p className="invest-empty-state">No goals yet -- click one of the buttons above to add your first one.</p>
      )}

      <div className="goals-list">
        {computed.map((g) => (
          <div key={g.id} className="goal-card">
            <div className="goal-card-header">
              <input type="text" className="goal-label" aria-label="Goal name" value={g.label} onChange={(e) => updateGoal(g.id, 'label', e.target.value)} />
              <button className="goal-remove" onClick={() => removeGoal(g.id)} aria-label="Remove goal">&times;</button>
            </div>

            <div className="invest-form">
              <div className="form-group">
                <label>Already Saved ({country.symbol})</label>
                <input type="number" min="0" value={g.startingAmount} onChange={(e) => updateGoal(g.id, 'startingAmount', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Goal Amount ({country.symbol})</label>
                <input type="number" min="0" step="10000" value={g.goalAmount} onChange={(e) => updateGoal(g.id, 'goalAmount', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Timeframe (years)</label>
                <input type="number" min="1" max="60" value={g.goalYears} onChange={(e) => updateGoal(g.id, 'goalYears', e.target.value)} />
              </div>
            </div>

            <div className="invest-result">
              <div className="invest-result-main">
                <span className="invest-result-label">You need to invest</span>
                <strong className="invest-result-value">{country.symbol} {Math.round(g.requiredMonthly).toLocaleString()}<span>/month</span></strong>
              </div>
              <div className="invest-result-grid">
                <div className="invest-stat">
                  <span>Total Contributed</span>
                  <strong>{country.symbol} {g.projection.totalDeposited.toLocaleString()}</strong>
                </div>
                <div className="invest-stat">
                  <span>Total Interest Earned</span>
                  <strong className="positive">{country.symbol} {g.projection.totalInterest.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {goals.length > 1 && (
        <div className="invest-combined">
          <span>Combined monthly needed for all {goals.length} goals</span>
          <strong>{country.symbol} {Math.round(combinedMonthly).toLocaleString()}/month</strong>
        </div>
      )}

      {goals.length > 0 && (
        <p className="invest-assumption-note">
          Assumes a constant {rate}% annual return every year with no volatility (set on the Calculator tab), and that
          each goal amount is a fixed nominal target (not itself adjusted for future inflation). Real markets don't move
          in a straight line -- see the Monte Carlo tab for a range of outcomes instead of a single number.
        </p>
      )}
    </div>
  );
};

export default Invest;
