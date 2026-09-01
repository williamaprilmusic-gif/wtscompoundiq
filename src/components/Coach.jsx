// src/components/Coach.jsx
import React, { useState } from 'react';
import './Coach.css';
import { calculateCompoundInterest } from '../engine';

const Coach = ({ country, initial, monthly, rate, years, inflation, wrapper, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [], maxYears = Infinity, onSetWrapper, onSetMonthly, onSetYears }) => {
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
  // the ceiling this is 0 and step 3 has nothing to offer (marked done below); otherwise
  // it caps both the slider and the value actually applied, so the "+N years" label can't
  // advertise more runway than the Calculator input would accept.
  const maxExtraYears = Math.max(0, maxYears - years);
  const effectiveExtraYears = Math.min(extraYears, maxExtraYears);
  const extendedYears = years + effectiveExtraYears;
  const extended = calculateCompoundInterest({ ...base, years: extendedYears });
  const extendGain = extended.finalBalance - baseline.finalBalance;

  const flashApplied = (key) => {
    setApplied(key);
    setTimeout(() => setApplied(null), 2000);
  };

  const applyWrapper = () => { onSetWrapper(true); flashApplied('wrapper'); };
  const applyBoost = () => { onSetMonthly(Math.round(boostedMonthly)); flashApplied('boost'); };
  const applyYears = () => { onSetYears(extendedYears); flashApplied('years'); };

  const steps = [
    {
      key: 'wrapper',
      number: 1,
      title: 'Build Your Foundation',
      done: !hasWrapper || wrapper,
      body: !hasWrapper
        ? `${country.name} has no standard tax-free wrapper in this dataset -- your foundation is a taxable account at an indicative ${country.taxRate}% tax rate.`
        : wrapper
          ? (baseline.wrapperCapExceeded
            ? `You're using ${country.wrapperLabel}, but your contributions exceed its real-world limit in at least one year -- the portion over the cap is taxed like a normal account, not fully sheltered.`
            : `You're already using ${country.wrapperLabel} -- nice, your gains are sheltered from tax entirely.`)
          : `Switch on your ${country.wrapperLabel} to shelter this plan from tax. That alone is worth an extra ${country.symbol} ${Math.round(wrapperGain).toLocaleString()} over ${years} years.`,
      interactive: hasWrapper && !wrapper,
      onApply: applyWrapper,
      applyLabel: `Turn on ${country.wrapperLabel}`
    },
    {
      key: 'boost',
      number: 2,
      title: 'Accelerate Your Growth',
      done: false,
      body: `Bumping your monthly contribution from ${country.symbol} ${monthly.toLocaleString()} to ${country.symbol} ${Math.round(boostedMonthly).toLocaleString()} (+${boostPercent}%) would grow your final balance by ${country.symbol} ${Math.round(boostGain).toLocaleString()} over ${years} years.`,
      interactive: true,
      control: (
        <div className="coach-slider-row">
          <label>+{boostPercent}% monthly contribution</label>
          <input type="range" min="5" max="100" step="5" value={boostPercent} aria-label="Monthly contribution boost percentage" onChange={(e) => setBoostPercent(Number(e.target.value))} />
        </div>
      ),
      onApply: applyBoost,
      applyLabel: `Set monthly to ${country.symbol}${Math.round(boostedMonthly).toLocaleString()}`
    },
    {
      key: 'years',
      number: 3,
      title: 'Stay The Course',
      done: maxExtraYears === 0,
      body: maxExtraYears === 0
        ? `Your timeframe is already at the ${maxYears}-year maximum -- there's no more runway to add here.`
        : `Staying invested for ${extendedYears} years instead of ${years} adds ${country.symbol} ${Math.round(extendGain).toLocaleString()} to your final balance -- compounding rewards patience more than almost anything else.`,
      interactive: maxExtraYears > 0,
      control: maxExtraYears > 0 ? (
        <div className="coach-slider-row">
          <label>+{effectiveExtraYears} extra year{effectiveExtraYears === 1 ? '' : 's'}</label>
          <input type="range" min="1" max={Math.min(20, maxExtraYears)} step="1" value={effectiveExtraYears} aria-label="Extra years to stay invested" onChange={(e) => setExtraYears(Number(e.target.value))} />
        </div>
      ) : null,
      onApply: applyYears,
      applyLabel: `Set timeframe to ${extendedYears} years`
    }
  ];

  return (
    <div className="card wealth-coach">
      <div className="coach-header">
        <h2>🧭 AI Wealth Coach</h2>
        <p>A 3-step plan built from your current calculator inputs. Adjust each lever below, then apply it straight to your plan.</p>
      </div>

      <div className="coach-steps">
        {steps.map((step) => (
          <div key={step.number} className={`coach-step ${step.done ? 'done' : ''}`}>
            <div className="coach-step-number">{step.done ? '✓' : step.number}</div>
            <div className="coach-step-content">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {step.control}
              {step.interactive && (
                <button className="coach-apply-btn" onClick={step.onApply}>
                  {applied === step.key ? '✓ Applied to your plan' : step.applyLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="coach-assumption-note">
        These are rule-based, not AI-generated: each step recomputes your current plan through the same calculator
        engine with one input changed, assuming a constant {rate}% return. Applying a step updates your actual
        Calculator inputs -- it's a "what-if" comparison you can act on, not personalized financial advice.
      </p>
    </div>
  );
};

export default Coach;
