// src/components/PowerTools.jsx
import React, { useState } from 'react';
import './PowerTools.css';
import { calculateCompoundInterest } from '../engine';
import Term from './Term';

const MAX_YEARS_TO_SEARCH = 60;

const yearsToReachTarget = ({ initial, monthly, rate, inflation, taxRate, wrapper, target, compoundFrequency, annualWrapperLimit, lifetimeWrapperLimit, contributionIncreaseRate }) => {
  if (initial >= target) return 0;
  for (let y = 1; y <= MAX_YEARS_TO_SEARCH; y++) {
    const { finalBalance } = calculateCompoundInterest({ initial, monthly, rate, years: y, inflation, taxRate, wrapper, compoundFrequency, annualWrapperLimit, lifetimeWrapperLimit, contributionIncreaseRate });
    if (finalBalance >= target) return y;
  }
  return null; // not reachable within MAX_YEARS_TO_SEARCH
};

const PowerTools = ({ country, initial, monthly, rate, inflation, wrapper, compoundFrequency = 12, contributionIncrease = 0 }) => {
  const [annualExpenses, setAnnualExpenses] = useState(0);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const [debtAmount, setDebtAmount] = useState(0);
  const [debtRate, setDebtRate] = useState(0);

  const safeWithdrawalRate = withdrawalRate > 0 ? withdrawalRate : 0.01;
  const fireNumber = annualExpenses / (safeWithdrawalRate / 100);
  const yearsToFire = yearsToReachTarget({
    initial, monthly, rate, inflation, taxRate: country.taxRate, wrapper, target: fireNumber, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit,
    contributionIncreaseRate: contributionIncrease
  });

  const debtIsWorse = debtRate > rate;

  return (
    <div className="card power-tools">
      <div className="power-header">
        <h2>🛠️ Power Tools</h2>
        <p>Quick-fire calculators that use your current calculator inputs as the baseline.</p>
      </div>

      <div className="power-tool-card">
        <h3>🔥 <Term k="fireNumber">FIRE Number</Term> Calculator</h3>
        <p className="power-tool-desc">Financial Independence, Retire Early -- how big a pot do you need, and how long until you get there?</p>
        <div className="power-form">
          <div className="form-group">
            <label>Annual Expenses ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={annualExpenses} onChange={(e) => setAnnualExpenses(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="safeWithdrawalRate">Safe Withdrawal Rate</Term> (%)</label>
            <input type="number" min="1" max="10" step="0.1" value={withdrawalRate} onChange={(e) => setWithdrawalRate(Number(e.target.value))} />
          </div>
        </div>
        <div className="power-result">
          <div className="power-stat">
            <span>Your FIRE Number</span>
            <strong>{country.symbol} {Math.round(fireNumber).toLocaleString()}</strong>
          </div>
          <div className="power-stat">
            <span>Years to FIRE at Current Plan</span>
            <strong className={yearsToFire === null ? 'warn' : 'positive'}>
              {yearsToFire === null ? `Not within ${MAX_YEARS_TO_SEARCH} years` : `${yearsToFire} years`}
            </strong>
          </div>
        </div>
        <p className="power-tool-note">
          Assumes your {rate}% return and {annualExpenses.toLocaleString()} expenses stay constant every year
          (no raises, no lifestyle inflation) -- treat this as a rough target, not a guarantee.
        </p>
      </div>

      <div className="power-tool-card">
        <h3>⚖️ Debt vs. Investment Showdown</h3>
        <p className="power-tool-desc">Extra cash available -- pay down debt, or invest it? Compare guaranteed vs. expected return.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Outstanding Debt ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={debtAmount} onChange={(e) => setDebtAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Debt Interest Rate (%)</label>
            <input type="number" min="0" step="0.1" value={debtRate} onChange={(e) => setDebtRate(Number(e.target.value))} />
          </div>
        </div>
        <div className={`power-verdict ${debtIsWorse ? 'debt' : 'invest'}`}>
          {debtIsWorse
            ? `Pay off the debt first. At ${debtRate}% interest, clearing it is a guaranteed ${debtRate}% return -- better than your ${rate}% expected investment return.`
            : `Investing extra cash looks better here. Your ${rate}% expected investment return beats the ${debtRate}% you'd save paying down debt early.`}
        </div>
        <p className="power-tool-note">
          Simplified comparison of nominal interest rates only -- doesn't account for tax treatment differences,
          investment risk/volatility, or debt-specific factors like credit score impact.
        </p>
      </div>
    </div>
  );
};

export default PowerTools;
