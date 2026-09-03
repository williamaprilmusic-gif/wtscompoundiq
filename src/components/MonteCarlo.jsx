// src/components/MonteCarlo.jsx
import React, { useState } from 'react';
import './MonteCarlo.css';
import { calculateCompoundInterest } from '../engine';
import { RETURN_MODELS } from '../data/historicalReturns';
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

// taxRate/wrapper/cap params default to "no tax at all" (this simulation's original
// behavior) -- only the wrapper-comparison mode below passes real tax figures in, so
// the plain single-run mode stays exactly as pre-tax as it always was.
export const runSimulation = ({
  initial, monthly, rate, years, volatility, goal, contributionIncreaseRate = 0, lumpSums = [],
  returnModel = 'normal', historicalSeries = [], taxRate = 0, wrapper = false,
  annualWrapperLimit = null, lifetimeWrapperLimit = null
}) => {
  // engine.js floors `years` internally; this loop builds a per-year array sized
  // years+1 and writes balancesByYear[y+1], so a fractional years (reachable via a
  // ?y=20.5 share link, which never floors) would leave the array a slot short and
  // throw inside the setTimeout -- leaving the button stuck. Floor it here too.
  years = Math.max(0, Math.floor(years || 0));
  const meanReturn = rate / 100;
  const stddev = volatility / 100;
  const finalBalances = [];
  // balancesByYear[y] holds every simulation's balance at year y (index 0 = year 0,
  // the starting balance) -- this is what lets the fan chart show the spread widening
  // over time instead of only at the final year.
  const balancesByYear = Array.from({ length: years + 1 }, () => []);

  for (let sim = 0; sim < NUM_SIMULATIONS; sim++) {
    let balance = initial;
    let cumulativeContributions = initial;
    balancesByYear[0].push(balance);
    for (let y = 0; y < years; y++) {
      const annualReturn = returnModel === 'historical'
        // Bootstrap: independently draw a random year's real historical return each
        // simulated year, rather than requiring years <= the dataset's length or
        // replaying one fixed historical sequence.
        ? historicalSeries[Math.floor(Math.random() * historicalSeries.length)] / 100
        : Math.max(gaussianRandom(meanReturn, stddev), -0.95);

      const yearMonthly = monthly * Math.pow(1 + contributionIncreaseRate / 100, y);
      const yearLumpSum = lumpSums.filter(l => l.year === y + 1).reduce((s, l) => s + (l.amount || 0), 0);
      const yearlyContribution = yearMonthly * 12 + yearLumpSum;

      // Same wrapper-cap logic as engine.js's calculateCompoundInterest, so the
      // taxable-vs-wrapper comparison here stays consistent with the deterministic
      // numbers on the Tax Optimizer tab -- just re-evaluated every simulated year
      // against that year's random return instead of one fixed rate.
      const firstYearContribution = y === 0 ? initial + yearlyContribution : yearlyContribution;
      const projectedCumulative = cumulativeContributions + yearlyContribution;
      const breachesAnnualCap = annualWrapperLimit != null && firstYearContribution > annualWrapperLimit;
      const breachesLifetimeCap = lifetimeWrapperLimit != null && projectedCumulative > lifetimeWrapperLimit;
      const yearIsSheltered = wrapper && !breachesAnnualCap && !breachesLifetimeCap;
      cumulativeContributions += yearlyContribution;

      const grown = balance * (1 + annualReturn);
      const gain = grown - balance;
      const taxPaid = (!yearIsSheltered && taxRate > 0) ? gain * (taxRate / 100) : 0;

      balance = Math.max(grown - taxPaid + yearlyContribution, 0);
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
  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';

  const [volatility, setVolatility] = useState(15);
  const [goal, setGoal] = useState(deterministic.finalBalance);
  const [returnModel, setReturnModel] = useState('normal');
  const [historicalModelKey, setHistoricalModelKey] = useState('sp500');
  const [compareWrapper, setCompareWrapper] = useState(false);
  const [result, setResult] = useState(null);
  const [wrapperCompare, setWrapperCompare] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [targetProb, setTargetProb] = useState(90);
  const [solveResult, setSolveResult] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [yearsSolveResult, setYearsSolveResult] = useState(null);
  const [isSolvingYears, setIsSolvingYears] = useState(false);

  const activeHistoricalModel = RETURN_MODELS.find(m => m.key === historicalModelKey) || RETURN_MODELS[0];

  const handleRun = () => {
    // years is capped app-wide (see App.jsx's MAX_YEARS) so 1,000 simulated paths never
    // gets truly heavy, but this still runs synchronously on the main thread -- flip to
    // a "Running..." state and defer the actual work a tick so the button visibly
    // responds to the click instead of looking frozen while it computes.
    setIsRunning(true);
    setTimeout(() => {
      const base = {
        initial, monthly, rate, years, volatility, goal,
        contributionIncreaseRate: contributionIncrease, lumpSums, returnModel,
        historicalSeries: activeHistoricalModel.data
      };
      if (compareWrapper && hasWrapper) {
        setResult(null);
        setWrapperCompare({
          taxable: runSimulation({ ...base, taxRate: country.taxRate, wrapper: false }),
          sheltered: runSimulation({ ...base, taxRate: country.taxRate, wrapper: true, annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit })
        });
      } else {
        setWrapperCompare(null);
        setResult(runSimulation(base)); // no taxRate/wrapper passed -- stays pre-tax, as this mode always has been
      }
      setIsRunning(false);
    }, 20);
  };

  // Ultra-only: binary-search the monthly contribution that lifts the probability of
  // hitting `goal` to at least `targetProb`. ~18 iterations x 1,000 paths each, run off
  // the main thread's paint like handleRun. probabilityOfGoal is noisy at 1,000 sims so
  // the answer is "about this much", not to-the-rand.
  const handleSolve = () => {
    setIsSolving(true);
    setTimeout(() => {
      // No positive goal means "chance of reaching R0", which is always 100% -- the
      // solver would otherwise report "R 0/month gives a 100% chance". Bail cleanly.
      if (!(goal > 0)) {
        setSolveResult(null);
        setIsSolving(false);
        return;
      }
      const base = {
        initial, rate, years, volatility, goal,
        contributionIncreaseRate: contributionIncrease, lumpSums, returnModel,
        historicalSeries: activeHistoricalModel.data
      };
      const probAt = (m) => runSimulation({ ...base, monthly: m }).probabilityOfGoal;
      const wanted = Math.max(1, Math.min(99, targetProb || 90));

      let lo = 0;
      // If zero contribution already clears the bar, there's nothing to search for --
      // check this before spending draws widening `hi`.
      const loProb = probAt(lo);
      if (loProb >= wanted) {
        setSolveResult({ monthly: 0, achievedProb: loProb, wanted, reachable: true });
        setIsSolving(false);
        return;
      }

      let hi = Math.max(5000, (monthly || 0) * 4, Math.round(goal / Math.max(1, years) / 6));
      // widen hi until it clears the bar or we give up
      let hiProb = probAt(hi);
      let guard = 0;
      while (hiProb < wanted && guard < 8) { hi *= 1.8; hiProb = probAt(hi); guard++; }

      if (hiProb < wanted) {
        setSolveResult({ monthly: Math.round(hi), achievedProb: hiProb, wanted, reachable: false });
      } else {
        // Track the probability at the best accepted `hi` so the displayed % is one
        // that actually cleared the bar -- no extra 1,000-path draw after the loop.
        let hiProbFinal = hiProb;
        for (let i = 0; i < 16; i++) {
          const mid = (lo + hi) / 2;
          const pm = probAt(mid);
          if (pm >= wanted) { hi = mid; hiProbFinal = pm; } else lo = mid;
        }
        setSolveResult({ monthly: Math.round(hi), achievedProb: hiProbFinal, wanted, reachable: true });
      }
      setIsSolving(false);
    }, 20);
  };

  // Ultra-only companion to handleSolve: hold the contribution where it is and find how
  // many more years of investing lift the probability of hitting `goal` to `targetProb`.
  // probabilityOfGoal rises monotonically with the horizon, so a short binary search
  // over the extra years works the same way the contribution search does.
  const handleSolveYears = () => {
    setIsSolvingYears(true);
    setTimeout(() => {
      if (!(goal > 0)) {
        setYearsSolveResult(null);
        setIsSolvingYears(false);
        return;
      }
      const base = {
        initial, monthly, rate, volatility, goal,
        contributionIncreaseRate: contributionIncrease, lumpSums, returnModel,
        historicalSeries: activeHistoricalModel.data
      };
      const probAtYears = (y) => runSimulation({ ...base, years: y }).probabilityOfGoal;
      const wanted = Math.max(1, Math.min(99, targetProb || 90));
      const startYears = Math.max(1, Math.floor(years || 1));

      if (probAtYears(startYears) >= wanted) {
        setYearsSolveResult({ years: startYears, extraYears: 0, achievedProb: probAtYears(startYears), wanted, reachable: true });
        setIsSolvingYears(false);
        return;
      }
      // Cap the horizon: MAX_YEARS app-wide is 100, and nobody plans past that.
      let lo = startYears;
      let hi = Math.min(100, startYears + 45);
      let hiProb = probAtYears(hi);
      if (hiProb < wanted) {
        setYearsSolveResult({ years: hi, extraYears: hi - startYears, achievedProb: hiProb, wanted, reachable: false });
        setIsSolvingYears(false);
        return;
      }
      let hiProbFinal = hiProb;
      while (hi - lo > 1) {
        const mid = Math.round((lo + hi) / 2);
        const pm = probAtYears(mid);
        if (pm >= wanted) { hi = mid; hiProbFinal = pm; } else lo = mid;
      }
      setYearsSolveResult({ years: hi, extraYears: hi - startYears, achievedProb: hiProbFinal, wanted, reachable: true });
      setIsSolvingYears(false);
    }, 20);
  };

  return (
    <div className="card monte-carlo">
      <div className="mc-header">
        <h2>🎲 <Term k="monteCarloSimulation">Monte Carlo Simulation</Term></h2>
        <p>{NUM_SIMULATIONS.toLocaleString()} randomized market paths over {years} years{compareWrapper && hasWrapper ? ` -- comparing taxable vs. ${country.wrapperLabel}` : ' -- pre-tax, ignores wrapper effects for simplicity'}.</p>
      </div>

      <div className="mc-model-toggle">
        <button className={`mc-model-btn ${returnModel === 'normal' ? 'active' : ''}`} onClick={() => setReturnModel('normal')}>
          📊 Statistical (Normal Distribution)
        </button>
        <button className={`mc-model-btn ${returnModel === 'historical' ? 'active' : ''}`} onClick={() => setReturnModel('historical')}>
          📜 Historical (Bootstrap)
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
            <label>Historical Benchmark</label>
            <select value={historicalModelKey} onChange={(e) => setHistoricalModelKey(e.target.value)}>
              {RETURN_MODELS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <small>{activeHistoricalModel.data.length} yrs, illustrative/approximate -- see note below</small>
          </div>
        )}
        <div className="form-group">
          <label>Goal Amount ({country.symbol})</label>
          <input type="number" min="0" step="10000" value={goal} onChange={(e) => setGoal(Number(e.target.value))} />
        </div>
      </div>

      {returnModel === 'historical' && (
        <p className="mc-model-note">
          Each simulated year independently draws one year's real historical return from the chosen benchmark
          (bootstrap resampling, reordered -- not a replay of any single real period), so crashes, booms, and fat
          tails come from actual market history instead of a smooth bell curve. Figures are illustrative/approximate,
          not a live data feed, and no single benchmark is necessarily representative of {country.name} or of the future.
        </p>
      )}

      {hasWrapper && (
        <label className="mc-compare-toggle">
          <input type="checkbox" checked={compareWrapper} onChange={(e) => setCompareWrapper(e.target.checked)} />
          Compare taxable vs. {country.wrapperLabel} outcomes (applies {country.taxRate}% tax to the taxable path each simulated year)
        </label>
      )}

      <button className="mc-run-btn" onClick={handleRun} disabled={isRunning}>
        {isRunning ? '⏳ Running…' : 'Run Simulation'}
      </button>

      <div className="mc-solver">
        <div className="mc-solver-row">
          <label>
            Or — find the monthly contribution for a{' '}
            <input
              type="number" min="1" max="99"
              value={Math.max(1, Math.min(99, targetProb || 90))}
              onChange={(e) => setTargetProb(Number(e.target.value))}
            />% chance of reaching {country.symbol}{Math.round(goal).toLocaleString()}
          </label>
          <button className="mc-solver-btn" onClick={handleSolve} disabled={isSolving}>
            {isSolving ? '⏳ Solving…' : 'Find it'}
          </button>
        </div>
        {solveResult && (
          <p className={`mc-solver-result ${solveResult.reachable ? '' : 'warn'}`}>
            {solveResult.reachable
              ? `About ${country.symbol} ${solveResult.monthly.toLocaleString()}/month gives roughly a ${solveResult.achievedProb.toFixed(0)}% chance of hitting the goal (target was ${solveResult.wanted}%). Approximate — the probability is estimated from ${NUM_SIMULATIONS.toLocaleString()} random paths and moves a point or two each run.`
              : `Even ${country.symbol} ${solveResult.monthly.toLocaleString()}/month only reaches about ${solveResult.achievedProb.toFixed(0)}% — the ${solveResult.wanted}% target isn't achievable at this volatility and timeframe. Lower the goal, extend the years, or accept a lower success rate.`}
          </p>
        )}

        <div className="mc-solver-row">
          <label>
            Or — hold the contribution and find how many <strong>years</strong> get you to a{' '}
            <input
              type="number" min="1" max="99"
              value={Math.max(1, Math.min(99, targetProb || 90))}
              onChange={(e) => setTargetProb(Number(e.target.value))}
            />% chance of {country.symbol}{Math.round(goal).toLocaleString()}
          </label>
          <button className="mc-solver-btn" onClick={handleSolveYears} disabled={isSolvingYears}>
            {isSolvingYears ? '⏳ Solving…' : 'Find it'}
          </button>
        </div>
        {yearsSolveResult && (
          <p className={`mc-solver-result ${yearsSolveResult.reachable ? '' : 'warn'}`}>
            {yearsSolveResult.reachable
              ? (yearsSolveResult.extraYears === 0
                  ? `You're already there — at ${yearsSolveResult.years} years the current plan hits about a ${yearsSolveResult.achievedProb.toFixed(0)}% chance (target ${yearsSolveResult.wanted}%).`
                  : `About ${yearsSolveResult.years} years total — ${yearsSolveResult.extraYears} more than your current plan — gets you to roughly ${yearsSolveResult.achievedProb.toFixed(0)}% (target ${yearsSolveResult.wanted}%). Approximate, from ${NUM_SIMULATIONS.toLocaleString()} random paths.`)
              : `Even ${yearsSolveResult.years} years only reaches about ${yearsSolveResult.achievedProb.toFixed(0)}% — the ${yearsSolveResult.wanted}% target needs a higher contribution or a lower goal, not just more time.`}
          </p>
        )}
      </div>

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

      {wrapperCompare && (
        <div className="mc-results mc-wrapper-compare">
          <p className="mc-compare-summary">
            Median outcome with {country.wrapperLabel}: <strong className="positive">{country.symbol} {Math.round(wrapperCompare.sheltered.p50).toLocaleString()}</strong>
            {' '}vs. taxable: <strong>{country.symbol} {Math.round(wrapperCompare.taxable.p50).toLocaleString()}</strong>
            {' '}-- a median gap of <strong className="positive">{country.symbol} {Math.round(wrapperCompare.sheltered.p50 - wrapperCompare.taxable.p50).toLocaleString()}</strong> from tax alone,
            purely from randomness-driven variation on top of your {rate}% expected return.
          </p>

          <div className="mc-compare-grid">
            <div className="mc-compare-col">
              <h3>Taxable Account</h3>
              <div className="mc-probability small">
                <span>Probability of Reaching Goal</span>
                <strong className={wrapperCompare.taxable.probabilityOfGoal >= 50 ? 'positive' : 'warn'}>{wrapperCompare.taxable.probabilityOfGoal.toFixed(1)}%</strong>
              </div>
              <FanChart yearlyPercentiles={wrapperCompare.taxable.yearlyPercentiles} symbol={country.symbol} />
            </div>
            <div className="mc-compare-col">
              <h3>{country.wrapperLabel}</h3>
              <div className="mc-probability small">
                <span>Probability of Reaching Goal</span>
                <strong className={wrapperCompare.sheltered.probabilityOfGoal >= 50 ? 'positive' : 'warn'}>{wrapperCompare.sheltered.probabilityOfGoal.toFixed(1)}%</strong>
              </div>
              <FanChart yearlyPercentiles={wrapperCompare.sheltered.yearlyPercentiles} symbol={country.symbol} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonteCarlo;
