// src/components/Coach.jsx
import React from 'react';
import './Coach.css';
import { calculateCompoundInterest } from '../engine';

const Coach = ({ country, initial, monthly, rate, years, inflation, wrapper, compoundFrequency = 12 }) => {
  const base = { initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper, compoundFrequency };
  const baseline = calculateCompoundInterest(base);

  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';
  const wrapperOn = calculateCompoundInterest({ ...base, wrapper: true });
  const wrapperGain = wrapperOn.finalBalance - baseline.finalBalance;

  const boostedMonthly = monthly * 1.2;
  const boosted = calculateCompoundInterest({ ...base, monthly: boostedMonthly });
  const boostGain = boosted.finalBalance - baseline.finalBalance;

  const extendedYears = years + 5;
  const extended = calculateCompoundInterest({ ...base, years: extendedYears });
  const extendGain = extended.finalBalance - baseline.finalBalance;

  const steps = [
    {
      number: 1,
      title: 'Build Your Foundation',
      done: !hasWrapper || wrapper,
      body: !hasWrapper
        ? `${country.name} has no standard tax-free wrapper in this dataset -- your foundation is a taxable account at an indicative ${country.taxRate}% tax rate.`
        : wrapper
          ? `You're already using ${country.wrapperLabel} -- nice, your gains are sheltered from tax entirely.`
          : `Switch on your ${country.wrapperLabel} to shelter this plan from tax. That alone is worth an extra ${country.symbol} ${Math.round(wrapperGain).toLocaleString()} over ${years} years.`
    },
    {
      number: 2,
      title: 'Accelerate Your Growth',
      done: false,
      body: `Bumping your monthly contribution from ${country.symbol} ${monthly.toLocaleString()} to ${country.symbol} ${Math.round(boostedMonthly).toLocaleString()} (+20%) would grow your final balance by ${country.symbol} ${Math.round(boostGain).toLocaleString()} over ${years} years.`
    },
    {
      number: 3,
      title: 'Stay The Course',
      done: false,
      body: `Staying invested for ${extendedYears} years instead of ${years} adds ${country.symbol} ${Math.round(extendGain).toLocaleString()} to your final balance -- compounding rewards patience more than almost anything else.`
    }
  ];

  return (
    <div className="card wealth-coach">
      <div className="coach-header">
        <h2>🧭 AI Wealth Coach</h2>
        <p>A 3-step plan built from your current calculator inputs -- change them on the Calculator tab and come back.</p>
      </div>

      <div className="coach-steps">
        {steps.map((step) => (
          <div key={step.number} className={`coach-step ${step.done ? 'done' : ''}`}>
            <div className="coach-step-number">{step.done ? '✓' : step.number}</div>
            <div className="coach-step-content">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="coach-assumption-note">
        These are rule-based, not AI-generated: each step recomputes your current plan through the same calculator
        engine with one input changed, assuming a constant {rate}% return. It's a "what-if" comparison, not
        personalized financial advice.
      </p>
    </div>
  );
};

export default Coach;
