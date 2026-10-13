// src/components/Coach.jsx
import React, { useState, useEffect } from 'react';
import './Coach.css';
import { calculateCompoundInterest } from '../engine';
import { computeBudgetSummary, BUDGET_ITEMS_KEY } from '../budgetEngine';
import { readJSONArray } from '../utils/storage';
import { readPlan } from '../utils/planStorage';
import { HISTORY_KEY as NETWORTH_HISTORY_KEY, isValidNetWorthEntry } from './NetWorth';
import { balanceSheetRatios } from '../balanceSheetRatios';
import { useLanguage } from '../i18n/LanguageContext';

const Coach = ({ country, initial, monthly, rate, years, inflation, wrapper, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [], maxYears = Infinity, onSetWrapper, onSetMonthly, onSetYears, onSetContributionIncrease }) => {
  const { t } = useLanguage();
  const base = { initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper, compoundFrequency, annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit, contributionIncreaseRate: contributionIncrease, lumpSums };
  const baseline = calculateCompoundInterest(base);

  const [boostPercent, setBoostPercent] = useState(20);
  const [extraYears, setExtraYears] = useState(5);
  const [applied, setApplied] = useState(null);

  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';
  const wrapperOn = calculateCompoundInterest({ ...base, wrapper: true });
  const wrapperGain = wrapperOn.finalBalance - baseline.finalBalance;

  const boostedMonthly = monthly * (1 + boostPercent / 100);
  const boosted = calculateCompoundInterest({ ...base, monthly: boostedMonthly });
  const boostGain = boosted.finalBalance - baseline.finalBalance;

  // Room left below the Calculator's own MAX_YEARS (passed in). When years is already at
  // the ceiling this is 0 and the "stay invested" step has nothing to offer (marked done below); otherwise
  // it caps both the slider and the value actually applied, so the "+N years" label can't
  // advertise more runway than the Calculator input would accept.
  const maxExtraYears = Math.max(0, maxYears - years);
  const effectiveExtraYears = Math.min(extraYears, maxExtraYears);
  const extendedYears = years + effectiveExtraYears;
  const extended = calculateCompoundInterest({ ...base, years: extendedYears });
  const extendGain = extended.finalBalance - baseline.finalBalance;

  // Contribution-escalation step: growing the monthly contribution itself by a %/yr (matching a raise or
  // inflation) rather than a one-off bump -- a flat contribution quietly shrinks in
  // real terms every year it doesn't move. Suggest a couple of points above whatever
  // escalation is already set, floored at 5%, so there's always real room to show.
  const [escalatePercent, setEscalatePercent] = useState(() => Math.max(5, Math.round(contributionIncrease) + 2));
  const canEscalate = typeof onSetContributionIncrease === 'function';
  const escalated = calculateCompoundInterest({ ...base, contributionIncreaseRate: escalatePercent });
  const escalateGain = escalated.finalBalance - baseline.finalBalance;
  const escalateDone = contributionIncrease >= escalatePercent;

  // Budget-surplus step: an unused Budget surplus is money already free to invest, read straight
  // from what's saved on the Budget tab (same computeBudgetSummary(readJSONArray(...))
  // call Budget.jsx's own "send to Debt Payoff" button uses) -- no new number to type
  // in, and no advice invented from nothing.
  const [budgetSurplus, setBudgetSurplus] = useState(null);
  useEffect(() => {
    const summary = computeBudgetSummary(readJSONArray(BUDGET_ITEMS_KEY));
    if (summary.totalIncome > 0 || summary.totalExpenses > 0) setBudgetSurplus(summary.surplus);
  }, []);
  const hasUnusedSurplus = budgetSurplus != null && budgetSurplus > monthly;
  const surplusApplied = calculateCompoundInterest({ ...base, monthly: budgetSurplus ?? monthly });
  const surplusGain = surplusApplied.finalBalance - baseline.finalBalance;

  // TFSA step: contribute exactly the annual tax-free allowance (R46,000/yr in SA ->
  // ~R3,833/mo) inside the wrapper, so none of this year's allowance is wasted. Only
  // offered when there's a wrapper with a real annual cap and the current monthly
  // contribution is below it.
  const tfsaMonthlyMax = country.annualWrapperLimit ? country.annualWrapperLimit / 12 : 0;
  const tfsaMaxApplied = calculateCompoundInterest({ ...base, wrapper: true, monthly: tfsaMonthlyMax });
  const tfsaMaxGain = tfsaMaxApplied.finalBalance - baseline.finalBalance;
  const tfsaStepDone = !hasWrapper || tfsaMonthlyMax === 0 || monthly >= tfsaMonthlyMax;

  // Debt-payoff redirect step: read the saved Debt Payoff plan (the same 'debt' section
  // Dashboard/Snapshot read). Once the Avalanche plan clears the debt, the whole cash
  // flow that was servicing it -- every minimum plus the extra -- is free to invest.
  // Model adding that on top of the current contribution for whatever runway is left
  // after the debt-free date, against investing the current contribution alone over the
  // same window. Only offered when a reachable debt plan is saved and it clears with at
  // least a year of the plan's horizon still to run.
  const [debtPlan, setDebtPlan] = useState(null);
  useEffect(() => {
    const plan = readPlan();
    if (plan.debt && plan.debt.avalancheReachable && plan.debt.combinedMonthly > 0) setDebtPlan(plan.debt);
  }, []);
  const debtFreeYears = debtPlan ? Math.round(debtPlan.avalancheMonths / 12) : 0;
  const debtFreeLabel = debtFreeYears < 1 ? t('coach.underAYear') : t(debtFreeYears === 1 ? 'coach.aboutYear' : 'coach.aboutYears', { n: debtFreeYears });
  const postDebtYears = debtPlan ? Math.max(0, years - debtFreeYears) : 0;
  const postDebtBaseline = debtPlan ? calculateCompoundInterest({ ...base, years: postDebtYears }) : null;
  const redirectApplied = debtPlan ? calculateCompoundInterest({ ...base, years: postDebtYears, monthly: monthly + debtPlan.combinedMonthly }) : null;
  const redirectGain = debtPlan ? redirectApplied.finalBalance - postDebtBaseline.finalBalance : 0;
  const hasDebtRedirect = debtPlan != null && postDebtYears >= 1;

  // Foundation checks folded in from the retired AI Advisor: an unfunded emergency
  // fund or a stretched balance sheet outrank every growth lever above -- both read
  // straight from what's already saved on the Emergency Fund and Net Worth tabs (same
  // sources and thresholds AI Advisor used), so there's nothing new to type in.
  const [savedEfPlan, setSavedEfPlan] = useState(null);
  const [netWorthRatios, setNetWorthRatios] = useState(null);
  useEffect(() => {
    const plan = readPlan();
    if (plan?.emergencyFund && plan.emergencyFund.targetAmount > 0) setSavedEfPlan(plan.emergencyFund);

    const history = readJSONArray(NETWORTH_HISTORY_KEY).filter(isValidNetWorthEntry);
    const latest = history.length > 0 ? history[history.length - 1] : null;
    if (latest) {
      setNetWorthRatios(balanceSheetRatios({ totalAssets: latest.totalAssets ?? latest.netWorth, totalDebts: latest.totalDebts ?? 0 }));
    }
  }, []);
  const efFundedPct = savedEfPlan ? Math.min(100, (savedEfPlan.currentSavings / savedEfPlan.targetAmount) * 100) : null;
  const efFunded = efFundedPct != null && efFundedPct >= 100;
  // 'stretched'/'risky' are balanceSheetRatios.js's own two most-concerning bands
  // (debt above 40% of assets) -- the same threshold AI Advisor used to decide this was
  // worth flagging at all.
  const leverageIsHigh = netWorthRatios && (netWorthRatios.band === 'stretched' || netWorthRatios.band === 'risky');

  const flashApplied = (key) => {
    setApplied(key);
    setTimeout(() => setApplied(null), 2000);
  };

  const applyWrapper = () => { onSetWrapper(true); flashApplied('wrapper'); };
  const applyBoost = () => { onSetMonthly(Math.round(boostedMonthly)); flashApplied('boost'); };
  const applyYears = () => { onSetYears(extendedYears); flashApplied('years'); };
  const applyEscalate = () => { onSetContributionIncrease(escalatePercent); flashApplied('escalate'); };
  const applySurplus = () => { onSetMonthly(Math.round(budgetSurplus)); flashApplied('surplus'); };
  const applyTfsaMax = () => { onSetWrapper(true); onSetMonthly(Math.round(tfsaMonthlyMax)); flashApplied('tfsaMax'); };
  const applyDebtRedirect = () => { onSetMonthly(Math.round(monthly + debtPlan.combinedMonthly)); flashApplied('debtRedirect'); };

  const steps = [
    {
      key: 'wrapper',
      title: t('coach.s1Title'),
      done: !hasWrapper || wrapper,
      body: !hasWrapper
        ? t('coach.s1NoWrapper', { country: country.name, rate: country.taxRate })
        : wrapper
          ? (baseline.wrapperCapExceeded
            ? t('coach.s1OverCap', { wrapper: country.wrapperLabel })
            : t('coach.s1Using', { wrapper: country.wrapperLabel }))
          : t('coach.s1Switch', { wrapper: country.wrapperLabel, amount: `${country.symbol} ${Math.round(wrapperGain).toLocaleString()}`, years }),
      interactive: hasWrapper && !wrapper,
      onApply: applyWrapper,
      applyLabel: t('coach.s1Apply', { wrapper: country.wrapperLabel })
    },
    ...(savedEfPlan ? [{
      key: 'efPriority',
      title: t('coach.efPriorityTitle'),
      done: efFunded,
      body: efFunded
        ? t('coach.efFunded', { saved: `${country.symbol}${Math.round(savedEfPlan.currentSavings).toLocaleString()}`, target: `${country.symbol}${Math.round(savedEfPlan.targetAmount).toLocaleString()}` })
        : t('coach.efPartial', { pct: efFundedPct.toFixed(0), saved: `${country.symbol}${Math.round(savedEfPlan.currentSavings).toLocaleString()}`, target: `${country.symbol}${Math.round(savedEfPlan.targetAmount).toLocaleString()}` }),
      interactive: false
    }] : []),
    ...(leverageIsHigh ? [{
      key: 'leverageCheck',
      title: t('coach.leverageTitle'),
      done: false,
      body: t('coach.leverageBody', { pct: netWorthRatios.debtToAsset.toFixed(0), band: t(`coach.band_${netWorthRatios.band || 'none'}`) }),
      interactive: false
    }] : []),
    {
      key: 'boost',
      title: t('coach.s2Title'),
      done: false,
      body: t('coach.s2Body', { from: `${country.symbol} ${monthly.toLocaleString()}`, to: `${country.symbol} ${Math.round(boostedMonthly).toLocaleString()}`, pct: boostPercent, gain: `${country.symbol} ${Math.round(boostGain).toLocaleString()}`, years }),
      interactive: true,
      control: (
        <div className="coach-slider-row">
          <label>{t('coach.s2Slider', { pct: boostPercent })}</label>
          <input type="range" min="5" max="100" step="5" value={boostPercent} aria-label={t('coach.s2Aria')} onChange={(e) => setBoostPercent(Number(e.target.value))} />
        </div>
      ),
      onApply: applyBoost,
      applyLabel: t('coach.s2Apply', { amount: `${country.symbol}${Math.round(boostedMonthly).toLocaleString()}` })
    },
    {
      key: 'years',
      title: t('coach.s3Title'),
      done: maxExtraYears === 0,
      body: maxExtraYears === 0
        ? t('coach.s3Maxed', { max: maxYears })
        : t('coach.s3Body', { extended: extendedYears, years, gain: `${country.symbol} ${Math.round(extendGain).toLocaleString()}` }),
      interactive: maxExtraYears > 0,
      control: maxExtraYears > 0 ? (
        <div className="coach-slider-row">
          <label>{t(effectiveExtraYears === 1 ? 'coach.s3SliderOne' : 'coach.s3SliderMany', { n: effectiveExtraYears })}</label>
          <input type="range" min="1" max={Math.min(20, maxExtraYears)} step="1" value={effectiveExtraYears} aria-label={t('coach.s3Aria')} onChange={(e) => setExtraYears(Number(e.target.value))} />
        </div>
      ) : null,
      onApply: applyYears,
      applyLabel: t('coach.s3Apply', { years: extendedYears })
    },
    ...(canEscalate ? [{
      key: 'escalate',
      title: t('coach.escalateTitle'),
      done: escalateDone,
      body: escalateDone
        ? t('coach.escalateDone', { current: contributionIncrease, suggest: escalatePercent })
        : t('coach.escalateBody', { monthly: `${country.symbol}${monthly.toLocaleString()}`, suggest: escalatePercent, current: contributionIncrease, gain: `${country.symbol} ${Math.round(escalateGain).toLocaleString()}`, years }),
      interactive: !escalateDone,
      control: !escalateDone ? (
        <div className="coach-slider-row">
          <label>{t('coach.escalateSlider', { pct: escalatePercent })}</label>
          <input type="range" min="1" max="15" step="1" value={escalatePercent} aria-label={t('coach.escalateAria')} onChange={(e) => setEscalatePercent(Number(e.target.value))} />
        </div>
      ) : null,
      onApply: applyEscalate,
      applyLabel: t('coach.escalateApply', { pct: escalatePercent })
    }] : []),
    ...(hasWrapper && tfsaMonthlyMax > 0 ? [{
      key: 'tfsaMax',
      title: t('coach.tfsaTitle', { wrapper: country.wrapperLabel }),
      done: tfsaStepDone,
      body: tfsaStepDone
        ? t('coach.tfsaDone', { monthly: `${country.symbol}${Math.round(tfsaMonthlyMax).toLocaleString()}`, annual: `${country.symbol}${country.annualWrapperLimit.toLocaleString()}`, wrapper: country.wrapperLabel })
        : t('coach.tfsaBody', { monthly: `${country.symbol}${Math.round(tfsaMonthlyMax).toLocaleString()}`, annual: `${country.symbol}${country.annualWrapperLimit.toLocaleString()}`, wrapper: country.wrapperLabel, current: `${country.symbol}${monthly.toLocaleString()}`, gain: `${country.symbol} ${Math.round(tfsaMaxGain).toLocaleString()}`, years }),
      interactive: !tfsaStepDone,
      onApply: applyTfsaMax,
      applyLabel: t('coach.tfsaApply', { monthly: `${country.symbol}${Math.round(tfsaMonthlyMax).toLocaleString()}`, wrapper: country.wrapperLabel })
    }] : []),
    ...(budgetSurplus != null ? [{
      key: 'surplus',
      title: t('coach.surplusTitle'),
      done: !hasUnusedSurplus,
      body: hasUnusedSurplus
        ? t('coach.surplusBody', { surplus: `${country.symbol}${Math.round(budgetSurplus).toLocaleString()}`, extra: `${country.symbol}${Math.round(budgetSurplus - monthly).toLocaleString()}`, current: `${country.symbol}${monthly.toLocaleString()}`, gain: `${country.symbol} ${Math.round(surplusGain).toLocaleString()}`, years })
        : budgetSurplus <= 0
          ? t('coach.surplusNone')
          : t('coach.surplusAlready', { surplus: `${country.symbol}${Math.round(budgetSurplus).toLocaleString()}` }),
      interactive: hasUnusedSurplus,
      onApply: applySurplus,
      applyLabel: t('coach.surplusApply', { amount: `${country.symbol}${Math.round(budgetSurplus).toLocaleString()}` })
    }] : []),
    ...(hasDebtRedirect ? [{
      key: 'debtRedirect',
      title: t('coach.debtTitle'),
      done: false,
      body: t('coach.debtBody', { when: debtFreeLabel, freed: `${country.symbol}${Math.round(debtPlan.combinedMonthly).toLocaleString()}`, current: `${country.symbol}${monthly.toLocaleString()}`, gain: `${country.symbol} ${Math.round(redirectGain).toLocaleString()}`, years: t(postDebtYears === 1 ? 'coach.yearsOne' : 'coach.yearsMany', { n: postDebtYears }) }),
      interactive: true,
      onApply: applyDebtRedirect,
      applyLabel: t('coach.debtApply', { amount: `${country.symbol}${Math.round(monthly + debtPlan.combinedMonthly).toLocaleString()}` })
    }] : [])
  ];

  // Step numbers are display-only and every conditional block above made its own
  // fragile "base + escalate? + tfsa? ..." arithmetic to stay in sequence. Normalise
  // once here instead, so adding or gating a step can't leave a gap or a repeat.
  steps.forEach((step, i) => { step.number = i + 1; });

  return (
    <div className="card wealth-coach">
      <div className="coach-header">
        <h2>{t('coach.title')}</h2>
        <p>{t('coach.intro2')}</p>
      </div>

      <div className="coach-steps">
        {steps.map((step) => (
          <div key={step.key} className={`coach-step ${step.done ? 'done' : ''}`}>
            <div className="coach-step-number">{step.done ? '✓' : step.number}</div>
            <div className="coach-step-content">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {step.control}
              {step.interactive && (
                <button className="coach-apply-btn" onClick={step.onApply}>
                  {applied === step.key ? t('coach.applied') : step.applyLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="coach-assumption-note">
        {t('coach.note2', { rate })}
      </p>
    </div>
  );
};

export default Coach;
