// src/components/MonteCarlo.jsx
import React, { useState } from 'react';
import './MonteCarlo.css';
import { calculateCompoundInterest } from '../engine';
import { SP500_ANNUAL_RETURNS } from '../data/historicalReturns';
import Term from './Term';
import FanChart from './FanChart';

const NUM_SIMULATIONS = 1000;

// Box-Muller transform for a normally-distributed random return.
const gaussianRandom = (mean, stddev) => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * stddev;
};

const percentileOf = (sortedArr, p) => sortedArr[Math.floor(p * (sortedArr.length - 1))];

const runSimulation = ({ initial, monthly, rate, years, volatility, goal, contributionIncreaseRate = 0, lumpSums = [], returnModel = 'normal' }) => {
  const meanReturn = rate / 100;
  const stddev = volatility / 100;
  const finalBalances = [];
  // balancesByYear[y] holds every simulation's balance at year y (index 0 = year 0,
  // the starting balance) -- this is what lets the fan chart show the spread widening
  // over time instead of only at the final year.
  const balancesByYear = Array.from({ length: years + 1 }, () => []);

  for (let sim = 0; sim < NUM_SIMULATIONS; sim++) {
    let balance = initial;
    balancesByYear[0].push(balance);
    for (let y = 0; y < years; y++) {
      const annualReturn = returnModel === 'historical'
        // Bootstrap: independently draw a random year's real historical return each
        // simulated year, rather than requiring years <= the dataset's length or
        // replaying one fixed historical sequence.
        ? SP500_ANNUAL_RETURNS[Math.floor(Math.random() * SP500_ANNUAL_RETURNS.length)] / 100
        : Math.max(gaussianRandom(meanReturn, stddev), -0.95);
      const yearMonthly = monthly * Math.pow(1 + contributionIncreaseRate / 100, y);
      const yearLumpSum = lumpSums.filter(l => l.year === y + 1).reduce((s, l) => s + (l.amount || 0), 0);
      balance = Math.max(balance * (1 + annualReturn) + yearMonthly * 12 + yearLumpSum, 0);
      balancesByYear[y + 1].push(balance);
    }
    finalBalances.push(balance);
  }

  finalBalances.sort((a, b) => a - b);
  const successCount = finalBalances.filter(b => b >= goal).length;

  const yearlyPercentiles = balancesByYear.map((yearBalances, year) => {
    const sorted = [...yearBalances].sort((a, b) => a - b);
    return {
      year,
      p10: percentileOf(sorted, 0.10),
      p25: percentileOf(sorted, 0.25),
      p50: percentileOf(sorted, 0.50),
      p75: percentileOf(sorted, 0.75),
      p90: percentileOf(sorted, 0.90)
    };
  });

  return {
    p10: percentileOf(finalBalances, 0.10),
    p25: percentileOf(finalBalances, 0.25),
    p50: percentileOf(finalBalances, 0.50),
    p75: percentileOf(finalBalances, 0.75),
    p90: percentileOf(finalBalances, 0.90),
    min: finalBalances[0],
    max: finalBalances[finalBalances.length - 1],
    probabilityOfGoal: (successCount / finalBalances.length) * 100,
    yearlyPercentiles
  };
};

const MonteCarlo = ({ country, initial, monthly, rate, years, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [] }) => {
  const deterministic = calculateCompoundInterest({ initial, monthly, rate, years, inflation: 0, taxRate: country.taxRate, wrapper: false, compoundFrequency, contributionIncreaseRate: contributionIncrease, lumpSums });

  const [volatility, setVolatility] = useState(15);
  const [goal, setGoal] = useState(deterministic.finalBalance);
  const [returnModel, setReturnModel] = useState('normal');
  const [result, setResult] = useState(null);

  const handleRun = () => {
    setResult(runSimulation({ initial, monthly, rate, years, volatility, goal, contributionIncreaseRate: contributionIncrease, lumpSums, returnModel }));
  };

  return (
    <div className="card monte-carlo">
      <div className="mc-header">
        <h2>🎲 <Term k="monteCarloSimulation">Monte Carlo Simulation</Term></h2>
        <p>{NUM_SIMULATIONS.toLocaleString()} randomized market paths over {years} years -- pre-tax, ignores wrapper effects for simplicity.</p>
      </div>

      <div className="mc-model-toggle">
        <button className={`mc-model-btn ${returnModel === 'normal' ? 'active' : ''}`} onClick={() => setReturnModel('normal')}>
          📊 Statistical (Normal Distribution)
        </button>
        <button className={`mc-model-btn ${returnModel === 'historical' ? 'active' : ''}`} onClick={() => setReturnModel('historical')}>
          📜 Historical (S&amp;P 500 Bootstrap)
        </button>
      </div>

      <div className="mc-form">
        <div className="form-group">
          <label>Expected Annual Return (%)</label>
          <input type="number" value={rate} disabled />
          <small>From your Calculator tab inputs{returnModel === 'historical' ? ' -- ignored in Historical mode' : ''}</small>
        </div>
        {returnModel === 'normal' ? (
          <div className="form-group">
            <label><Term k="volatility">Volatility</Term> / Std. Deviation (%)</label>
            <input type="number" min="0" max="60" step="1" value={volatility} onChange={(e) => setVolatility(Number(e.target.value))} />
          </div>
        ) : (
          <div className="form-group">
            <label>Return Source</label>
            <input type="text" value={`${SP500_ANNUAL_RETURNS.length} yrs of real annual returns`} disabled />
            <small>Illustrative/approximate, not a live feed -- see note below</small>
          </div>
        )}
        <div className="form-group">
          <label>Goal Amount ({country.symbol})</label>
          <input type="number" min="0" step="10000" value={goal} onChange={(e) => setGoal(Number(e.target.value))} />
        </div>
      </div>

      {returnModel === 'historical' && (
        <p className="mc-model-note">
          Each simulated year independently draws one year's real historical S&amp;P 500 total return (bootstrap
          resampling, reordered -- not a replay of any single real period), so crashes, booms, and fat tails come
          from actual market history instead of a smooth bell curve. Figures are illustrative/approximate, not a
          live data feed, and US equity-market history isn't necessarily representative of {country.name} or of
          the future.
        </p>
      )}

      <button className="mc-run-btn" onClick={handleRun}>Run Simulation</button>

      {result && (
        <div className="mc-results">
          <div className="mc-probability">
            <span>Probability of Reaching Your Goal</span>
            <strong className={result.probabilityOfGoal >= 50 ? 'positive' : 'warn'}>{result.probabilityOfGoal.toFixed(1)}%</strong>
          </div>

          <FanChart yearlyPercentiles={result.yearlyPercentiles} symbol={country.symbol} />

          <div className="mc-percentiles">
            <div className="mc-stat"><span><Term k="percentile">10th percentile</Term></span><strong>{country.symbol} {Math.round(result.p10).toLocaleString()}</strong></div>
            <div className="mc-stat"><span>25th percentile</span><strong>{country.symbol} {Math.round(result.p25).toLocaleString()}</strong></div>
            <div className="mc-stat median"><span>Median (50th)</span><strong>{country.symbol} {Math.round(result.p50).toLocaleString()}</strong></div>
            <div className="mc-stat"><span>75th percentile</span><strong>{country.symbol} {Math.round(result.p75).toLocaleString()}</strong></div>
            <div className="mc-stat"><span>90th percentile</span><strong>{country.symbol} {Math.round(result.p90).toLocaleString()}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonteCarlo;
