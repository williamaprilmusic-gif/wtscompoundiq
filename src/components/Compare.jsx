// src/components/Compare.jsx
import React, { useState } from 'react';
import './Compare.css';
import { countriesData, convertAmount } from '../data/countries';
import { calculateCompoundInterest } from '../engine';
import Term from './Term';

const Compare = ({ country, initial, monthly, rate, years, inflation, compoundFrequency = 12 }) => {
  const otherDefault = countriesData.find(c => c.code !== country.code) || countriesData[0];
  const [codeA, setCodeA] = useState(country.code);
  const [codeB, setCodeB] = useState(otherDefault.code);

  const countryA = countriesData.find(c => c.code === codeA) || country;
  const countryB = countriesData.find(c => c.code === codeB) || otherDefault;

  const base = { initial, monthly, rate, years, inflation, compoundFrequency };
  const resultsA = calculateCompoundInterest({ ...base, taxRate: countryA.taxRate, wrapper: false });
  const resultsB = calculateCompoundInterest({ ...base, taxRate: countryB.taxRate, wrapper: false });

  // Winner is determined by purchasing-power-equivalent value (via USD), never by
  // comparing raw currency units -- 100,000 ZAR and 100,000 USD are not the same size.
  const balanceA_usd = convertAmount(resultsA.finalBalance, countryA.code, 'us');
  const balanceB_usd = convertAmount(resultsB.finalBalance, countryB.code, 'us');
  const winner = balanceA_usd === balanceB_usd ? null : (balanceA_usd > balanceB_usd ? 'A' : 'B');

  const balanceA_inB = convertAmount(resultsA.finalBalance, countryA.code, countryB.code);
  const balanceB_inA = convertAmount(resultsB.finalBalance, countryB.code, countryA.code);

  return (
    <div className="card country-compare">
      <div className="compare-header">
        <h2>🌍 Compare Countries</h2>
        <p>Same {initial.toLocaleString()}/{monthly.toLocaleString()}/mo plan at {rate}% over {years} years -- different tax regimes.</p>
      </div>

      <div className="compare-pickers">
        <select value={codeA} onChange={(e) => setCodeA(e.target.value)}>
          {countriesData.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <span className="compare-vs">vs</span>
        <select value={codeB} onChange={(e) => setCodeB(e.target.value)}>
          {countriesData.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>

      <div className="compare-grid">
        <div className={`compare-card ${winner === 'A' ? 'winner' : ''}`}>
          <h3>{countryA.name}</h3>
          <span className="compare-tax">{countryA.taxRate}% tax on gains</span>
          <strong className="compare-value">{countryA.symbol} {resultsA.finalBalance.toLocaleString()}</strong>
          <span className="compare-converted"><Term k="fxConversion">≈</Term> {countryB.symbol} {Math.round(balanceA_inB).toLocaleString()}</span>
          <div className="compare-details">
            <span>Deposited: {countryA.symbol} {resultsA.totalDeposited.toLocaleString()}</span>
            <span>Interest: {countryA.symbol} {resultsA.totalInterest.toLocaleString()}</span>
            <span>Wrapper: {countryA.wrapperLabel}</span>
          </div>
        </div>

        <div className={`compare-card ${winner === 'B' ? 'winner' : ''}`}>
          <h3>{countryB.name}</h3>
          <span className="compare-tax">{countryB.taxRate}% tax on gains</span>
          <strong className="compare-value">{countryB.symbol} {resultsB.finalBalance.toLocaleString()}</strong>
          <span className="compare-converted">≈ {countryA.symbol} {Math.round(balanceB_inA).toLocaleString()}</span>
          <div className="compare-details">
            <span>Deposited: {countryB.symbol} {resultsB.totalDeposited.toLocaleString()}</span>
            <span>Interest: {countryB.symbol} {resultsB.totalInterest.toLocaleString()}</span>
            <span>Wrapper: {countryB.wrapperLabel}</span>
          </div>
        </div>
      </div>

      <div className="compare-note">
        Converted figures (≈) use an illustrative, approximate exchange rate table (not live rates) so the two plans
        can be compared on the same footing -- the "ahead" highlight is based on this converted value, not the raw
        currency-unit number. Tax rates are simplified single-figure indicators, not full bracket-by-bracket
        calculations.
      </div>
    </div>
  );
};

export default Compare;
