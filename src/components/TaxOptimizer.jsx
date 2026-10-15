// src/components/TaxOptimizer.jsx
import React, { useState } from 'react';
import './TaxOptimizer.css';
import { calculateCompoundInterest } from '../engine';
import { compareRetirementVehicle } from '../retirementComparison';
import { estimateLossHarvestingSaving } from '../capitalGainsTax';
import { getVerificationInfo } from '../data/countries';
import Term from './Term';
import { useLanguage } from '../i18n/LanguageContext';

const TaxOptimizer = ({ country, initial, monthly, rate, years, inflation, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [], taxBrackets = null, otherTaxableIncome = 0 }) => {
  const { t } = useLanguage();
  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';
  const verification = getVerificationInfo(country.code);

  // Defaults: the country's own flat tax rate as the contribution-deduction refund
  // rate (a rough marginal-rate stand-in, same simplification the rest of the app uses
  // for `country.taxRate`), and half of it for the withdrawal tax -- retirement
  // withdrawal tax tables are typically more generous than working-life income tax in
  // most systems this models, but this is a starting guess, not a real table. Both editable.
  const [contributionTaxRate, setContributionTaxRate] = useState(country.taxRate);
  const [withdrawalTaxRate, setWithdrawalTaxRate] = useState(Math.round(country.taxRate / 2));
  const [lossAmount, setLossAmount] = useState(0);
  const [lossMarginalRate, setLossMarginalRate] = useState(country.taxRate);
  // "How much of my TFSA lifetime allowance have I already used?" -- a real SA planning
  // constraint (R500,000 lifetime, and you can't reclaim room by withdrawing).
  const [tfsaContributed, setTfsaContributed] = useState(0);
  const lifetimeLimit = country.lifetimeWrapperLimit || 0;
  const annualLimit = country.annualWrapperLimit || 0;
  const tfsaUsedPct = lifetimeLimit > 0 ? Math.min(100, Math.max(0, (tfsaContributed / lifetimeLimit) * 100)) : 0;
  const tfsaRemaining = Math.max(0, lifetimeLimit - tfsaContributed);
  const tfsaYearsLeft = annualLimit > 0 ? tfsaRemaining / annualLimit : null;

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

  const lossHarvesting = estimateLossHarvestingSaving({ lossAmount, marginalRatePct: lossMarginalRate });

  return (
    <div className="card tax-optimizer">
      <div className="tax-header">
        <h2>{t('tax.title')}</h2>
        <p>{t('tax.intro', { country: country.name })}</p>
        <span className={`tax-verification ${verification.stale ? 'stale' : ''}`}>
          {verification.date
            ? `${verification.stale ? '⚠️ ' : '✓ '}${t(verification.daysAgo === 1 ? 'tax.verifiedOne' : 'tax.verifiedMany', { country: country.name, date: verification.date, n: verification.daysAgo })}${verification.stale ? t('tax.overdue') : ''}`
            : t('tax.unknownVerification')}
        </span>
      </div>

      {hasWrapper ? (
        <div className="tax-comparison">
          <div className="tax-compare-card taxable">
            <span className="tax-compare-label">{t('tax.taxableAccount')}</span>
            <strong className="tax-compare-value">{country.symbol} {taxableResults.finalBalance.toLocaleString()}</strong>
            <span className="tax-compare-sub">{taxBrackets ? t('tax.afterYearsBrackets', { years }) : t('tax.afterYearsFlat', { years, rate: country.taxRate })}</span>
          </div>
          <div className="tax-compare-arrow">→</div>
          <div className="tax-compare-card wrapper">
            <span className="tax-compare-label">{country.wrapperLabel}</span>
            <strong className="tax-compare-value">{country.symbol} {wrapperResults.finalBalance.toLocaleString()}</strong>
            <span className="tax-compare-sub">{t('tax.afterYearsZero', { years })}</span>
          </div>
        </div>
      ) : (
        <div className="no-wrapper-note">
          {t('tax.noWrapper', { country: country.name, rate: country.taxRate })}
        </div>
      )}

      <div className="tax-plans-grid">
        {hasWrapper && (
          <div className="tax-plan-card">
            <h3><Term k="wrapper">{t('tax.wrapperTerm')}</Term> {t('tax.wrapperSuffix')}</h3>
            <p>{t('tax.wrapperUse', { wrapper: country.code === 'za' ? t('left.tfsaName') : country.taxFreeWrapper })}</p>
            <ul>
              <li>{t('tax.contributionLimit', { limit: country.code === 'za' ? t('left.zaLimit', { annual: `${country.symbol}${Number(country.annualWrapperLimit).toLocaleString()}`, lifetime: `${country.symbol}${Number(country.lifetimeWrapperLimit).toLocaleString()}` }) : country.taxFreeLimit })}</li>
              <li>{t('tax.taxAvoided', { years })} <strong>{country.symbol} {totalTaxPaid.toLocaleString()}</strong></li>
              <li>{t('tax.extraBalance')} <strong className="positive">{country.symbol} {wrapperBenefit.toLocaleString()}</strong></li>
            </ul>
            {wrapperResults.wrapperCapExceeded && (
              <p className="wrapper-cap-note">{t('tax.capNote')}</p>
            )}
            {lifetimeLimit > 0 && (
              <div className="tfsa-lifetime-tracker">
                <div className="form-group">
                  <label>{t('left.tfsaContributed', { wrapper: country.wrapperLabel, symbol: country.symbol })}</label>
                  <input type="number" min="0" step="5000" value={tfsaContributed} onChange={(e) => setTfsaContributed(Number(e.target.value))} />
                </div>
                {tfsaContributed > 0 && (
                  <>
                    <div className="tfsa-lifetime-bar" role="img" aria-label={t('left.tfsaBarAria', { pct: Math.round(tfsaUsedPct) })}>
                      <div className="tfsa-lifetime-fill" style={{ width: `${tfsaUsedPct}%` }} />
                    </div>
                    <p className="tfsa-lifetime-note">
                      {t('left.tfsaNote', { contributed: `${country.symbol}${Math.round(tfsaContributed).toLocaleString()}`, limit: `${country.symbol}${lifetimeLimit.toLocaleString()}`, pct: Math.round(tfsaUsedPct) })}{' '}
                      {tfsaRemaining > 0
                        ? <>{t('tax.roomLeft', { amount: `${country.symbol}${Math.round(tfsaRemaining).toLocaleString()}`, more: tfsaYearsLeft != null && annualLimit > 0 ? t('tax.roomMore', { years: tfsaYearsLeft.toFixed(1), limit: `${country.symbol}${annualLimit.toLocaleString()}` }) : '' })}</>
                        : <>{t('tax.lifetimeUsed')}</>}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="tax-plan-card">
          <h3><Term k="taxLossHarvesting">{t('tax.harvestTerm')}</Term></h3>
          <p>{t('tax.harvestIntro')}</p>
          <ul>
            <li>{t('tax.harvest1')}</li>
            <li>{t('tax.harvest2')}</li>
            <li>{t('tax.harvest3')}</li>
          </ul>
          <div className="tax-loss-harvest-calc">
            <div className="form-group">
              <label>{t('left.realisedLoss', { symbol: country.symbol })}</label>
              <input type="number" min="0" step="1000" value={lossAmount} onChange={(e) => setLossAmount(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>{t('left.taxMarginal')}</label>
              <input type="number" min="0" max="60" step="1" value={lossMarginalRate} onChange={(e) => setLossMarginalRate(Number(e.target.value))} />
            </div>
          </div>
          {lossAmount > 0 && (
            <p className="tax-loss-harvest-result">
              {t('tax.lossLine1')} <strong>{country.symbol} {Math.round(lossAmount).toLocaleString()}</strong> {t('tax.lossLine2')}{' '}
              <strong className="positive">{country.symbol} {Math.round(lossHarvesting.taxSaved).toLocaleString()}</strong>{' '}
              {t('tax.lossLine3', { offset: `${country.symbol} ${Math.round(lossHarvesting.taxableGainOffset).toLocaleString()}`, rate: lossMarginalRate })}
            </p>
          )}
        </div>

        <div className="tax-plan-card">
          <h3><Term k="assetLocation">{t('tax.locationTerm')}</Term></h3>
          <p>{t('tax.locationIntro')}</p>
          <ul>
            <li>{t('tax.location1')}</li>
            <li>{t('tax.location2')}</li>
            <li>{t('tax.location3')}</li>
          </ul>
        </div>
      </div>

      <div className="retirement-comparison">
        <h3>🏦 <Term k="retirementFund">{t('tax.retirementTerm')}</Term> {t('tax.retirementSuffix')}</h3>
        <p className="retirement-comparison-desc">
          {t('tax.retirementDesc', { wrapper: hasWrapper ? country.wrapperLabel : t('tax.taxFreeWrapperFallback') })}
        </p>
        <div className="retirement-comparison-form">
          <div className="form-group">
            <label>{t('tax.contributionRefundRate')}</label>
            <input type="number" min="0" max="60" step="1" value={contributionTaxRate} onChange={(e) => setContributionTaxRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('tax.withdrawalRate')}</label>
            <input type="number" min="0" max="60" step="1" value={withdrawalTaxRate} onChange={(e) => setWithdrawalTaxRate(Number(e.target.value))} />
          </div>
        </div>
        <div className="retirement-comparison-grid">
          <div className="retirement-stat">
            <span>{t('tax.netCost')}</span>
            <strong>{country.symbol} {Math.round(retirementResults.netContributionCost).toLocaleString()}</strong>
          </div>
          <div className="retirement-stat">
            <span>{t('tax.refunds')}</span>
            <strong className="positive">{country.symbol} {Math.round(retirementResults.contributionTaxRefund).toLocaleString()}</strong>
          </div>
          <div className="retirement-stat">
            <span>{t('tax.beforeWithdrawal')}</span>
            <strong>{country.symbol} {retirementResults.finalBalance.toLocaleString()}</strong>
          </div>
          <div className="retirement-stat">
            <span>{t('tax.netAfter')}</span>
            <strong className="positive">{country.symbol} {Math.round(retirementResults.netAfterWithdrawalTax).toLocaleString()}</strong>
          </div>
        </div>
        <p className="retirement-comparison-note">{t('tax.retirementNote')}</p>
      </div>
    </div>
  );
};

export default TaxOptimizer;
