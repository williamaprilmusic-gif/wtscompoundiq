// src/components/TaxOptimizer.jsx
import React, { useState } from 'react';
import './TaxOptimizer.css';
import { calculateCompoundInterest } from '../engine';
import { compareRetirementVehicle } from '../retirementComparison';
import { getVerificationInfo } from '../data/countries';
import Term from './Term';

const TaxOptimizer = ({ country, initial, monthly, rate, years, inflation, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [], taxBrackets = null, otherTaxableIncome = 0 }) => {
  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';
  const verification = getVerificationInfo(country.code);

  // Defaults: the country's own flat tax rate as the contribution-deduction refund
  // rate (a rough marginal-rate stand-in, same simplification the rest of the app uses
  // for `country.taxRate`), and half of it for the withdrawal tax -- retirement
  // withdrawal tax tables are typically more generous than working-life income tax in
  // most systems this models, but this is a starting guess, not a real table. Both editable.
  const [contributionTaxRate, setContributionTaxRate] = useState(country.taxRate);
  const [withdrawalTaxRate, setWithdrawalTaxRate] = useState(Math.round(country.taxRate / 2));

  const taxableResults = calculateCompoundInterest({
    initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper: false, compoundFrequency,
    contributionIncreaseRate: contributionIncrease, lumpSums, taxBrackets, otherTaxableIncome
  });
  const wrapperResults = calculateCompoundInterest({
    initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper: true, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit,
    contributionIncreaseRate: contributionIncrease, lumpSums, taxBrackets, otherTaxableIncome
  });

  const totalTaxPaid = taxableResults.yearlyData.reduce((sum, row) => sum + row.taxPaid, 0);
  const wrapperBenefit = wrapperResults.finalBalance - taxableResults.finalBalance;

  const retirementResults = compareRetirementVehicle({
    initial, monthly, rate, years, inflation, compoundFrequency, contributionIncreaseRate: contributionIncrease, lumpSums,
    contributionTaxRate, withdrawalTaxRate
  });

  return (
    <div className="card tax-optimizer">
      <div className="tax-header">
        <h2>🧾 Tax Optimizer</h2>
        <p>See how much a tax-free wrapper is worth for your current {country.name} calculator inputs.</p>
        <span className={`tax-verification ${verification.stale ? 'stale' : ''}`}>
          {verification.date
            ? `${verification.stale ? '⚠️ ' : '✓ '}${country.name}'s tax figures last verified ${verification.date} (${verification.daysAgo} day${verification.daysAgo === 1 ? '' : 's'} ago)${verification.stale ? ' -- overdue for a recheck' : ''}`
            : '⚠️ Verification date unknown for this country'}
        </span>
      </div>

      {hasWrapper ? (
        <div className="tax-comparison">
          <div className="tax-compare-card taxable">
            <span className="tax-compare-label">Taxable Account</span>
            <strong className="tax-compare-value">{country.symbol} {taxableResults.finalBalance.toLocaleString()}</strong>
            <span className="tax-compare-sub">after {years} years, {taxBrackets ? 'progressive brackets' : `${country.taxRate}% tax`} on gains</span>
          </div>
          <div className="tax-compare-arrow">→</div>
          <div className="tax-compare-card wrapper">
            <span className="tax-compare-label">{country.wrapperLabel}</span>
            <strong className="tax-compare-value">{country.symbol} {wrapperResults.finalBalance.toLocaleString()}</strong>
            <span className="tax-compare-sub">after {years} years, 0% tax on gains</span>
          </div>
        </div>
      ) : (
        <div className="no-wrapper-note">
          {country.name} has no standard retail tax-free wrapper in this dataset, so a taxable-vs-wrapper comparison isn't shown --
          but interest here is taxed at an indicative {country.taxRate}%.
        </div>
      )}

      <div className="tax-plans-grid">
        {hasWrapper && (
          <div className="tax-plan-card">
            <h3><Term k="wrapper">Tax-Free Wrapper</Term> Strategy</h3>
            <p>Use your {country.taxFreeWrapper} to shelter these contributions from tax entirely.</p>
            <ul>
              <li>Contribution limit: {country.taxFreeLimit}</li>
              <li>Tax avoided over {years} years: <strong>{country.symbol} {totalTaxPaid.toLocaleString()}</strong></li>
              <li>Extra balance from using the wrapper: <strong className="positive">{country.symbol} {wrapperBenefit.toLocaleString()}</strong></li>
            </ul>
            {wrapperResults.wrapperCapExceeded && (
              <p className="wrapper-cap-note">
                ⚠️ Your contribution plan exceeds this wrapper's real-world annual or lifetime limit in at least one year --
                the figures above assume full shelter, but the portion over the cap would actually be taxed like a normal account.
              </p>
            )}
          </div>
        )}

        <div className="tax-plan-card">
          <h3><Term k="taxLossHarvesting">Tax-Loss Harvesting</Term></h3>
          <p>Offset capital gains with investment losses to reduce your tax burden.</p>
          <ul>
            <li>Sell investments at a loss to offset gains elsewhere in your portfolio</li>
            <li>Reinvest in similar (not identical) assets to stay invested</li>
            <li>Watch local wash-sale / bed-and-breakfasting rules before repurchasing</li>
          </ul>
        </div>

        <div className="tax-plan-card">
          <h3><Term k="assetLocation">Asset Location Strategy</Term></h3>
          <p>Place tax-inefficient investments in tax-advantaged accounts, and tax-efficient ones in taxable accounts.</p>
          <ul>
            <li>Put bonds and interest-heavy assets in tax-advantaged wrappers first</li>
            <li>Keep long-term growth stocks in taxable accounts where rates are often lower</li>
            <li>Favor low-turnover, tax-efficient index funds in taxable accounts</li>
          </ul>
        </div>
      </div>

      <div className="retirement-comparison">
        <h3>🏦 <Term k="retirementFund">Retirement Fund</Term> Comparison</h3>
        <p className="retirement-comparison-desc">
          A retirement fund (e.g. South Africa's RA/pension/provident funds, or a traditional-style pension elsewhere)
          works differently from the {hasWrapper ? country.wrapperLabel : 'tax-free wrapper'} above: contributions get an
          upfront tax deduction (a refund at your rate today), growth compounds tax-free, and it's the withdrawal that
          gets taxed -- once, years from now.
        </p>
        <div className="retirement-comparison-form">
          <div className="form-group">
            <label>Contribution Tax Refund Rate (%)</label>
            <input type="number" min="0" max="60" step="1" value={contributionTaxRate} onChange={(e) => setContributionTaxRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Withdrawal Tax Rate (%)</label>
            <input type="number" min="0" max="60" step="1" value={withdrawalTaxRate} onChange={(e) => setWithdrawalTaxRate(Number(e.target.value))} />
          </div>
        </div>
        <div className="retirement-comparison-grid">
          <div className="retirement-stat">
            <span>Net Cost of Contributions (after refund)</span>
            <strong>{country.symbol} {Math.round(retirementResults.netContributionCost).toLocaleString()}</strong>
          </div>
          <div className="retirement-stat">
            <span>Tax Refunds Received Along the Way</span>
            <strong className="positive">{country.symbol} {Math.round(retirementResults.contributionTaxRefund).toLocaleString()}</strong>
          </div>
          <div className="retirement-stat">
            <span>Balance Before Withdrawal Tax</span>
            <strong>{country.symbol} {retirementResults.finalBalance.toLocaleString()}</strong>
          </div>
          <div className="retirement-stat">
            <span>Net After Withdrawal Tax</span>
            <strong className="positive">{country.symbol} {Math.round(retirementResults.netAfterWithdrawalTax).toLocaleString()}</strong>
          </div>
        </div>
        <p className="retirement-comparison-note">
          Illustrative, not tax advice -- real retirement contribution-deduction limits and withdrawal tax tables vary
          by country (and often by age/withdrawal size) and aren't modeled here; both rates above are a flat starting
          guess, editable to match your own situation. The refund isn't compounded back into the balance above -- it's
          shown as a separate amount you'd actually receive along the way, not part of the retirement pot itself.
        </p>
      </div>
    </div>
  );
};

export default TaxOptimizer;
