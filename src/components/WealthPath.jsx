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
import { useLanguage } from '../i18n/LanguageContext';

const EF_INPUTS_KEY = 'wts_compoundiq_emergencyfund_inputs';
const NETWORTH_ITEMS_KEY = 'wts_compoundiq_networth_items';
// Net-worth categories that count as a productive portfolio for the 25x FI target --
// cash buffers and the roof over your head don't.
const INVESTED_CATEGORIES = new Set(['Investments', 'Retirement']);

const readJSON = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
};

// id -> destination tab. `tab` is the exact internal tab name for onNavigate (null = no jump).
// The copy itself (title / what / why) lives in the translations: src/i18n/strings/wealthPath.js
// under wp.<id>Title / wp.<id>What / wp.<id>Why.
const STEP_TABS = {
  budget: 'Budget',
  starterEf: 'Emergency Fund',
  killDebt: 'Debt Payoff',
  fullEf: 'Emergency Fund',
  tfsa: 'Tax Optimizer',
  retireFund: 'Power Tools',
  invest: 'Invest',
  fi: null
};
// Tab name -> translation key for its displayed name (names themselves stay English).
const TAB_NAME_KEYS = {
  'Budget': 'nav.budget', 'Emergency Fund': 'nav.emergencyFund', 'Debt Payoff': 'nav.debtPayoff',
  'Tax Optimizer': 'nav.taxOptimizer', 'Power Tools': 'nav.powerTools', 'Invest': 'nav.invest'
};

const STATUS_CLASS = { done: 'done', now: 'now', todo: 'todo', unknown: 'unknown', info: 'info' };
const STATUS_LABEL_KEY = { done: 'wp.pillDone', now: 'wp.pillNow', todo: 'wp.pillTodo', unknown: 'wp.pillUnknown', info: 'wp.pillInfo' };

export default function WealthPath({ country, wrapper, canAccess, onNavigate }) {
  const { t } = useLanguage();
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

  const copyFor = (id) => {
    const vars = { rate: EXPENSIVE_DEBT_RATE, multiple: FI_MULTIPLE };
    return {
      title: t(`wp.${id}Title`, vars),
      what: t(`wp.${id}What`, vars),
      why: t(`wp.${id}Why`, vars),
      tab: STEP_TABS[id]
    };
  };

  const targetLine = (step) => {
    if (step.target == null) return null;
    if (step.id === 'starterEf' || step.id === 'fullEf') {
      const gap = efSavings != null ? Math.max(0, step.target - efSavings) : null;
      return gap != null && gap > 0
        ? t('wp.targetEfGap', { target: money(step.target), gap: money(gap) })
        : t('wp.targetEf', { target: money(step.target) });
    }
    if (step.id === 'killDebt') return t('wp.targetDebt', { rate: EXPENSIVE_DEBT_RATE, amount: money(step.target) });
    if (step.id === 'tfsa') return t('wp.targetTfsa', { monthly: money(step.target), annual: money(country.annualWrapperLimit || 0) });
    if (step.id === 'invest' || step.id === 'fi') return t('wp.targetFi', { amount: money(step.target) });
    return null;
  };

  return (
    <div className="card wealth-path">
      <div className="wp-header">
        <h2>{t('wp.title')}</h2>
        <p>{t('wp.intro')}</p>
      </div>

      <div className="wp-progress">
        <div className="wp-progress-headline">
          <strong>{t('wp.stepOf', { n: currentNumber, total: actionable.length })}</strong>
          <span>{copyFor(currentId).title}</span>
        </div>
        <div className="wp-progress-bar" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={actionable.length}>
          <div className="wp-progress-fill" style={{ width: `${(doneCount / actionable.length) * 100}%` }} />
        </div>
        <p className="wp-progress-sub">{t('wp.stepsDone', { done: doneCount, total: actionable.length })}{fiNumber != null ? t('wp.fiNumberSuffix', { amount: money(fiNumber) }) : ''}</p>
      </div>

      {fiNumber != null && fiProgressPct != null && (
        <div className="wp-fi">
          <div className="wp-fi-head">
            <span>{t('wp.fiProgress')}</span>
            <strong>{Math.round(fiProgressPct)}%</strong>
          </div>
          <div className="wp-fi-bar"><div className="wp-fi-fill" style={{ width: `${fiProgressPct}%` }} /></div>
          <p className="wp-fi-sub">
            {t('wp.fiSub', { multiple: FI_MULTIPLE })}
          </p>
        </div>
      )}

      <ol className="wp-steps">
        {actionable.map((step, i) => {
          const copy = copyFor(step.id);
          const shown = step.id === currentId && step.status !== 'done' ? 'now' : step.status;
          const pillKey = STATUS_LABEL_KEY[shown] ? shown : 'todo';
          const pill = { label: t(STATUS_LABEL_KEY[pillKey]), cls: STATUS_CLASS[pillKey] };
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
                    {locked
                      ? t('wp.openLocked', { tab: t(TAB_NAME_KEYS[copy.tab] || copy.tab), tier: tabTier })
                      : t('wp.open', { tab: t(TAB_NAME_KEYS[copy.tab] || copy.tab) })} →
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
          <strong>{copyFor('fi').title}</strong>
          <p>{copyFor('fi').what}{fiNumber != null ? t('wp.fiForYou', { amount: money(fiNumber) }) : ''}</p>
        </div>
      </div>

      <p className="wp-note">
        {t('wp.note', { multiple: FI_MULTIPLE, rate: EXPENSIVE_DEBT_RATE })}
      </p>
    </div>
  );
}
