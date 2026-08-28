// src/components/MonteCarlo.jsx
import React, { useState } from 'react';
import './MonteCarlo.css';
import { calculateCompoundInterest } from '../engine';
import Term from './Term';

const NUM_SIMULATIONS = 1000;

// Box-Muller transform for a normally-distributed random return.
const gaussianRandom = (mean, stddev) => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * stddev;
};

const runSimulation = ({ initial, monthly, rate, years, volatility, goal, contributionIncreaseRate = 0 }) => {
  const meanReturn = rate / 100;
  const stddev = volatility / 100;
  const finalBalances = [];

  for (let sim = 0; sim < NUM_SIMULATIONS; sim++) {
    let balance = initial;
    for (let y = 0; y < years; y++) {
      const annualReturn = Math.max(gaussianRandom(meanReturn, stddev), -0.95);
      const yearMonthly = monthly * Math.pow(1 + contributionIncreaseRate / 100, y);
      balance = balance * (1 + annualReturn) + yearMonthly * 12;
    }
    finalBalances.push(Math.max(balance, 0));
  }

  finalBalances.sort((a, b) => a - b);
  const percentile = (p) => finalBalances[Math.floor(p * (finalBalances.length - 1))];
  const successCount = finalBalances.filter(b => b >= goal).length;

  return {
    p10: percentile(0.10),
    p25: percentile(0.25),
    p50: percentile(0.50),
    p75: percentile(0.75),
    p90: percentile(0.90),
    min: finalBalances[0],
    max: finalBalances[finalBalances.length - 1],
    probabilityOfGoal: (successCount / finalBalances.length) * 100
  };
};

const MonteCarlo = ({ country, initial, monthly, rate, years, compoundFrequency = 12, contributionIncrease = 0 }) => {
  const deterministic = calculateCompoundInterest({ initial, monthly, rate, years, inflation: 0, taxRate: country.taxRate, wrapper: false, compoundFrequency, contributionIncreaseRate: contributionIncrease });

  const [volatility, setVolatility] = useState(15);
  const [goal, setGoal] = useState(deterministic.finalBalance);
  const [result, setResult] = useState(null);

  const handleRun = () => {
    setResult(runSimulation({ initial, monthly, rate, years, volatility, goal, contributionIncreaseRate: contributionIncrease }));
  };

  return (
    <div className="card monte-carlo">
      <div className="mc-header">
        <h2>🎲 <Term k="monteCarloSimulation">Monte Carlo Simulation</Term></h2>
        <p>{NUM_SIMULATIONS.toLocaleString()} randomized market paths over {years} years -- pre-tax, ignores wrapper effects for simplicity.</p>
      </div>

      <div className="mc-form">
        <div className="form-group">
          <label>Expected Annual Return (%)</label>
          <input type="number" value={rate} disabled />
          <small>From your Calculator tab inputs</small>
        </div>
        <div className="form-group">
          <label><Term k="volatility">Volatility</Term> / Std. Deviation (%)</label>
          <input type="number" min="0" max="60" step="1" value={volatility} onChange={(e) => setVolatility(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>Goal Amount ({country.symbol})</label>
          <input type="number" min="0" step="10000" value={goal} onChange={(e) => setGoal(Number(e.target.value))} />
        </div>
      </div>

      <button className="mc-run-btn" onClick={handleRun}>Run Simulation</button>

      {result && (
        <div className="mc-results">
          <div className="mc-probability">
            <span>Probability of Reaching Your Goal</span>
            <strong className={result.probabilityOfGoal >= 50 ? 'positive' : 'warn'}>{result.probabilityOfGoal.toFixed(1)}%</strong>
          </div>

          <div className="mc-spread">
            <div className="mc-spread-bar">
              <div
                className="mc-spread-range"
                style={{
                  left: '0%',
                  width: '100%'
                }}
              />
              <div className="mc-spread-marker p10" style={{ left: '10%' }} title="10th percentile" />
              <div className="mc-spread-marker p50" style={{ left: '50%' }} title="Median" />
              <div className="mc-spread-marker p90" style={{ left: '90%' }} title="90th percentile" />
            </div>
            <div className="mc-spread-labels">
              <span>Worst case</span>
              <span>Median</span>
              <span>Best case</span>
            </div>
          </div>

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
