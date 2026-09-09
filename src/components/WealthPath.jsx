// src/components/WealthPath.jsx
// "How to build wealth", as an ordered, personalised checklist. The ordering and the
// done/to-do marks come from wealthPathEngine.js; this file holds the human copy for
// each step and wires the "Open <tab>" jumps. Everything the user sees is either their
// own saved number or a stated rule of thumb -- it is guidance, not advice.
import React from 'react';
import './WealthPath.css';
import { computeWealthPath, EXPENSIVE_DEBT_RATE, FI_MULTIPLE } from '../wealthPathEngine';
import { computeBudgetSummary, BUDGET_ITEMS_KEY } from '../budgetEngine';
import { DEBTS_KEY } from './DebtPayoff';
import { readJSONArray } from '../utils/storage';
import { convertAmount } from '../data/countries';

const EF_INPUTS_KEY = 'wts_compoundiq_emergencyfund_inputs';
const NETWORTH_ITEMS_KEY = 'wts_compoundiq_networth_items';
// Net-worth categories that count as a productive portfolio for the 25x FI target --
// cash buffers and the roof over your head don't.
const INVESTED_CATEGORIES = new Set(['Investments', 'Retirement']);

const readJSON = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
};

// id -> copy. `tab` is the exact internal tab name for onNavigate (null = no jump).
const STEP_COPY = {
  budget: {
    title: 'Know exactly what comes in and goes out',
    what: 'List every source of income and every monthly expense so you can see your real surplus — the rand you actually have spare each month.',
    why: 'Every step after this one is funded by that surplus. You can\'t direct money you haven\'t measured.',
    tab: 'Budget'
  },
  starterEf: {
    title: 'Put aside a one-month buffer',
    what: 'Build a small cash cushion — about one month of expenses — in a separate, instant-access account.',
    why: 'It stops a surprise bill going onto a credit card at 20%+ and undoing the next steps.',
    tab: 'Emergency Fund'
  },
  killDebt: {
    title: `Clear debt above ${EXPENSIVE_DEBT_RATE}%`,
    what: 'Throw every spare rand at your highest-rate debt (credit cards, store cards, personal loans) until it\'s gone.',
    why: `Paying off an ${EXPENSIVE_DEBT_RATE}%+ debt is a guaranteed, tax-free return that size — the market won\'t reliably beat it.`,
    tab: 'Debt Payoff'
  },
  fullEf: {
    title: 'Grow the emergency fund to 3 months',
    what: 'Top the buffer up to roughly three months of expenses (more if your income is irregular).',
    why: 'This is what lets you invest for the long term without being forced to sell at a bad time.',
    tab: 'Emergency Fund'
  },
  tfsa: {
    title: 'Use your tax-free allowance every year',
    what: 'Contribute to a Tax-Free Savings Account — growth and withdrawals are never taxed, up to the annual limit.',
    why: 'Unused allowance doesn\'t carry over. Skipping a year is a permanent loss of tax-free room.',
    tab: 'Tax Optimizer'
  },
  retireFund: {
    title: 'Fill your retirement-fund deduction',
    what: 'Contribute to a pension, provident fund or retirement annuity up to 27.5% of income (max R350,000/year) — it comes off your taxable income.',
    why: 'SARS effectively refunds your marginal rate on every rand, so it costs far less than it grows.',
    tab: 'Power Tools'
  },
  invest: {
    title: 'Invest the surplus toward independence',
    what: `With debt gone and the buffer full, invest the rest in a low-cost, diversified fund every month — aim for ${FI_MULTIPLE}x your annual spending.`,
    why: 'At that size a ~4%-a-year drawdown covers your expenses indefinitely. That\'s financial independence.',
    tab: 'Invest'
  },
  fi: {
    title: 'Financial independence',
    what: 'Your invested pot covers your living costs on its own. Work becomes optional.',
    why: 'Everything above compounds toward this one number.',
    tab: null
  }
};

const STATUS_PILL = {
  done: { label: '✓ Done', cls: 'done' },
  now: { label: '● You are here', cls: 'now' },
  todo: { label: '○ To do', cls: 'todo' },
  unknown: { label: '? Add your data', cls: 'unknown' },
  info: { label: 'ℹ Good to do', cls: 'info' }
};

export default function WealthPath({ country, wrapper, canAccess, onNavigate }) {
  const sym = country.symbol;

  // --- assemble the engine input from whatever the user has saved elsewhere ---
  const budget = computeBudgetSummary(readJSONArray(BUDGET_ITEMS_KEY));
  const hasBudget = budget.totalIncome > 0 && budget.totalExpenses > 0;

  const efInputs = readJSON(EF_INPUTS_KEY) || {};
  const efMonthlyExpenses = Number(efInputs.monthlyExpenses) > 0 ? Number(efInputs.monthlyExpenses) : null;
  const efSavings = Number.isFinite(Number(efInputs.currentSavings)) && (efMonthlyExpenses != null || Number(efInputs.currentSavings) > 0)
    ? Number(efInputs.currentSavings)
    : null;

  const monthlyExpenses = efMonthlyExpenses ?? (budget.totalExpenses > 0 ? budget.totalExpenses : null);

  const debts = readJSONArray(DEBTS_KEY).filter((d) => Number(d.balance) > 0);
  const anyDebtData = debts.length > 0;
  const expensiveDebt = anyDebtData
    ? debts.filter((d) => Number(d.rate) >= EXPENSIVE_DEBT_RATE).reduce((s, d) => s + Number(d.balance), 0)
    : null;

  const nwItems = readJSONArray(NETWORTH_ITEMS_KEY);
  const investedAssets = nwItems.length > 0
    ? nwItems
        .filter((i) => i.type === 'asset' && INVESTED_CATEGORIES.has(i.category))
        .reduce((s, i) => s + convertAmount(Number(i.value) || 0, i.currency || country.code, country.code), 0)
    : null;

  const { steps, currentId, fiNumber, fiProgressPct } = computeWealthPath({
    monthlyExpenses,
    hasBudget,
    expensiveDebt,
    anyDebtData,
    emergencySavings: efSavings,
    wrapperOn: !!wrapper,
    investedAssets,
    annualWrapperLimit: country.annualWrapperLimit || 0
  });

  const money = (n) => `${sym}${Math.round(n).toLocaleString()}`;
  const actionable = steps.filter((s) => s.id !== 'fi');
  const currentNumber = (() => {
    const idx = actionable.findIndex((s) => s.id === currentId);
    return idx === -1 ? actionable.length : idx + 1;
  })();
  const doneCount = actionable.filter((s) => s.status === 'done').length;

  const targetLine = (step) => {
    if (step.target == null) return null;
    if (step.id === 'starterEf' || step.id === 'fullEf') {
      const gap = efSavings != null ? Math.max(0, step.target - efSavings) : null;
      return `Target: ${money(step.target)}${gap != null && gap > 0 ? ` — ${money(gap)} to go` : ''}`;
    }
    if (step.id === 'killDebt') return `Outstanding above ${EXPENSIVE_DEBT_RATE}%: ${money(step.target)}`;
    if (step.id === 'tfsa') return `Allowance: about ${money(step.target)}/month (${money(country.annualWrapperLimit || 0)}/year)`;
    if (step.id === 'invest' || step.id === 'fi') return `Your FI number: ${money(step.target)}`;
    return null;
  };

  return (
    <div className="card wealth-path">
      <div className="wp-header">
        <h2>🪜 Wealth Path</h2>
        <p>
          There's a well-worn order to building wealth. Here it is, with your own numbers filled in where you've
          entered them elsewhere in the app. Work top to bottom — each step makes the next one safe.
        </p>
      </div>

      <div className="wp-progress">
        <div className="wp-progress-headline">
          <strong>Step {currentNumber} of {actionable.length}</strong>
          <span>{STEP_COPY[currentId].title}</span>
        </div>
        <div className="wp-progress-bar" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={actionable.length}>
          <div className="wp-progress-fill" style={{ width: `${(doneCount / actionable.length) * 100}%` }} />
        </div>
        <p className="wp-progress-sub">{doneCount} of {actionable.length} steps done{fiNumber != null ? ` · FI number ${money(fiNumber)}` : ''}</p>
      </div>

      {fiNumber != null && fiProgressPct != null && (
        <div className="wp-fi">
          <div className="wp-fi-head">
            <span>Progress to financial independence</span>
            <strong>{Math.round(fiProgressPct)}%</strong>
          </div>
          <div className="wp-fi-bar"><div className="wp-fi-fill" style={{ width: `${fiProgressPct}%` }} /></div>
          <p className="wp-fi-sub">
            Your invested assets (Investments + Retirement on the Net Worth tab) against {FI_MULTIPLE}× a year of spending.
          </p>
        </div>
      )}

      <ol className="wp-steps">
        {actionable.map((step, i) => {
          const copy = STEP_COPY[step.id];
          const shown = step.id === currentId && step.status !== 'done' ? 'now' : step.status;
          const pill = STATUS_PILL[shown] || STATUS_PILL.todo;
          const tabTier = copy.tab ? { Budget: 'Pro', 'Emergency Fund': 'Pro', 'Debt Payoff': 'Pro', 'Tax Optimizer': 'Pro', 'Power Tools': 'Pro', Invest: 'Pro' }[copy.tab] : null;
          const locked = tabTier && typeof canAccess === 'function' && !canAccess(tabTier);
          return (
            <li key={step.id} className={`wp-step ${shown}`}>
              <div className="wp-step-num">{step.status === 'done' ? '✓' : i + 1}</div>
              <div className="wp-step-body">
                <div className="wp-step-titlerow">
                  <h3>{copy.title}</h3>
                  <span className={`wp-pill ${pill.cls}`}>{pill.label}</span>
                </div>
                <p className="wp-step-what">{copy.what}</p>
                <p className="wp-step-why">{copy.why}</p>
                {targetLine(step) && <p className="wp-step-target">{targetLine(step)}</p>}
                {copy.tab && (
                  <button
                    type="button"
                    className="wp-step-open"
                    onClick={() => onNavigate && onNavigate(copy.tab)}
                  >
                    Open {copy.tab}{locked ? ` (${tabTier})` : ''} →
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className={`wp-finish ${steps.find((s) => s.id === 'fi').status === 'done' ? 'reached' : ''}`}>
        <span className="wp-finish-flag">🏁</span>
        <div>
          <strong>{STEP_COPY.fi.title}</strong>
          <p>{STEP_COPY.fi.what}{fiNumber != null ? ` For you, that's an invested ${money(fiNumber)}.` : ''}</p>
        </div>
      </div>

      <p className="wp-note">
        Guidance, not financial advice. The order is a widely-used rule of thumb; the numbers are your own saved
        figures or a stated assumption ({FI_MULTIPLE}× spending, {EXPENSIVE_DEBT_RATE}% "expensive" debt). Speak to a
        licensed adviser before acting.
      </p>
    </div>
  );
}
