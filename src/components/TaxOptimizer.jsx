// src/components/TaxOptimizer.jsx
import React from 'react';
import './TaxOptimizer.css';
import { calculateCompoundInterest } from '../engine';
import { getVerificationInfo } from '../data/countries';
import Term from './Term';

const TaxOptimizer = ({ country, initial, monthly, rate, years, inflation, compoundFrequency = 12 }) => {
  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';
  const verification = getVerificationInfo(country.code);

  const taxableResults = calculateCompoundInterest({
    initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper: false, compoundFrequency
  });
  const wrapperResults = calculateCompoundInterest({
    initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper: true, compoundFrequency
  });

  const totalTaxPaid = taxableResults.yearlyData.reduce((sum, row) => sum + row.taxPaid, 0);
  const wrapperBenefit = wrapperResults.finalBalance - taxableResults.finalBalance;

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
            <span className="tax-compare-sub">after {years} years, {country.taxRate}% tax on gains</span>
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
    </div>
  );
};

export default TaxOptimizer;
