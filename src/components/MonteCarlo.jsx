// src/components/MonteCarlo.jsx
import React, { useState } from 'react';
import './MonteCarlo.css';
import { calculateCompoundInterest } from '../engine';
import { RETURN_MODELS } from '../data/historicalReturns';
import Term from './Term';
import FanChart from './FanChart';
import { worstHistoricalWindow, projectThroughSequence } from '../worstHistoricalWindow';
import { useLanguage } from '../i18n/LanguageContext';

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
  annualWrapperLimit = null, lifetimeWrapperLimit = null,
  // Optional decumulation phase: after `years` of accumulation, draw down for
  // `retirementYears` more years, withdrawing `annualWithdrawal` (escalated by
  // `withdrawalInflation`% each year) at the start of each year against the same random
  // return model. Reports how often the pot survives the whole retirement.
  retirementYears = 0, annualWithdrawal = 0, withdrawalInflation = 0
}) => {
  // engine.js floors `years` internally; this loop builds a per-year array sized
  // years+1 and writes balancesByYear[y+1], so a fractional years (reachable via a
  // ?y=20.5 share link, which never floors) would leave the array a slot short and
  // throw inside the setTimeout -- leaving the button stuck. Floor it here too.
  years = Math.max(0, Math.floor(years || 0));
  const drawdownYears = Math.max(0, Math.floor(retirementYears || 0));
  const meanReturn = rate / 100;
  const stddev = volatility / 100;
  const finalBalances = [];
  const retirementEndBalances = [];
  const yearsLastedList = [];
  let survivedCount = 0;
  // One random annual return under whichever model is active -- factored out so the
  // drawdown phase draws from the same distribution as accumulation.
  const drawReturn = () => returnModel === 'historical'
    ? historicalSeries[Math.floor(Math.random() * historicalSeries.length)] / 100
    : Math.max(gaussianRandom(meanReturn, stddev), -0.95);
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

    // Decumulation: withdraw at the start of each retirement year, then grow what's
    // left by a fresh random return. The pot "survives" if it's still above zero after
    // the last withdrawal-and-growth year.
    if (drawdownYears > 0) {
      let potInRetirement = balance;
      let thisYearWithdrawal = Math.max(0, annualWithdrawal || 0);
      let yearsLasted = 0;
      for (let ry = 0; ry < drawdownYears; ry++) {
        potInRetirement -= thisYearWithdrawal;
        if (potInRetirement <= 0) { potInRetirement = 0; break; }
        potInRetirement = Math.max(0, potInRetirement * (1 + drawReturn()));
        thisYearWithdrawal *= 1 + (withdrawalInflation || 0) / 100;
        yearsLasted += 1;
      }
      retirementEndBalances.push(potInRetirement);
      yearsLastedList.push(yearsLasted);
      if (potInRetirement > 0 && yearsLasted === drawdownYears) survivedCount += 1;
    }
  }

  finalBalances.sort((a, b) => a - b);
  const successCount = finalBalances.filter(b => b >= goal).length;

  // Probability the balance is already at or above `goal` at a few checkpoint years --
  // "40% chance by year 10, 75% by year 15" -- straight from the per-year snapshots the
  // fan chart already uses. Only the checkpoints that fall within the horizon.
  const goalProbByYear = (goal > 0 ? [5, 10, 15, 20, 25, 30, 40] : [])
    .filter(cy => cy < years)
    .map(cy => ({
      year: cy,
      probability: (balancesByYear[cy].filter(b => b >= goal).length / NUM_SIMULATIONS) * 100
    }));

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

  let drawdown = null;
  if (drawdownYears > 0) {
    const sortedEnds = [...retirementEndBalances].sort((a, b) => a - b);
    const sortedYears = [...yearsLastedList].sort((a, b) => a - b);
    drawdown = {
      retirementYears: drawdownYears,
      survivalRate: (survivedCount / NUM_SIMULATIONS) * 100,
      p10EndBalance: percentileOf(sortedEnds, 0.10),
      p50EndBalance: percentileOf(sortedEnds, 0.50),
      medianYearsLasted: percentileOf(sortedYears, 0.50),
      worstCaseYearsLasted: sortedYears[0]
    };
  }

  // Percentile rank (0-100) of an arbitrary value against this run's sorted final
  // balances -- lets the UI show where a straight-line projection sits in the spread.
  const percentileRankOf = (value) => {
    if (!Number.isFinite(value) || finalBalances.length === 0) return null;
    const below = finalBalances.filter((b) => b <= value).length;
    return (below / finalBalances.length) * 100;
  };

  return {
    p10: percentileOf(finalBalances, 0.10),
    p25: percentileOf(finalBalances, 0.25),
    p50: percentileOf(finalBalances, 0.50),
    p75: percentileOf(finalBalances, 0.75),
    p90: percentileOf(finalBalances, 0.90),
    min: finalBalances[0],
    max: finalBalances[finalBalances.length - 1],
    probabilityOfGoal: (successCount / finalBalances.length) * 100,
    percentileRankOf,
    goalProbByYear,
    yearlyPercentiles,
    drawdown
  };
};

const MonteCarlo = ({ country, initial, monthly, rate, years, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [] }) => {
  const { t } = useLanguage();
  const deterministic = calculateCompoundInterest({ initial, monthly, rate, years, inflation: 0, taxRate: country.taxRate, wrapper: false, compoundFrequency, contributionIncreaseRate: contributionIncrease, lumpSums });
  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';

  const [volatility, setVolatility] = useState(15);
  const [goal, setGoal] = useState(deterministic.finalBalance);
  const [returnModel, setReturnModel] = useState('normal');
  const [historicalModelKey, setHistoricalModelKey] = useState('sp500');
  const [compareWrapper, setCompareWrapper] = useState(false);
  const [modelDrawdown, setModelDrawdown] = useState(false);
  const [retirementYears, setRetirementYears] = useState(30);
  const [annualWithdrawal, setAnnualWithdrawal] = useState(Math.round(deterministic.finalBalance * 0.04) || 0);
  const [withdrawalInflation, setWithdrawalInflation] = useState(Math.round(country.typicalInflation || 5));
  const [result, setResult] = useState(null);
  const [wrapperCompare, setWrapperCompare] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [targetProb, setTargetProb] = useState(90);
  const [solveResult, setSolveResult] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [yearsSolveResult, setYearsSolveResult] = useState(null);
  const [isSolvingYears, setIsSolvingYears] = useState(false);
  const [withdrawalSolveResult, setWithdrawalSolveResult] = useState(null);
  const [isSolvingWithdrawal, setIsSolvingWithdrawal] = useState(false);

  const activeHistoricalModel = RETURN_MODELS.find(m => m.key === historicalModelKey) || RETURN_MODELS[0];

  // Historical mode resamples years independently, which shuffles real crash-then-
  // recovery sequences apart. This puts one genuinely bad *ordered* run back in view:
  // the worst contiguous window of the chosen benchmark over the plan's horizon, and
  // what the plan would actually have ended with living through it.
  const worstWindow = returnModel === 'historical'
    ? worstHistoricalWindow(activeHistoricalModel.data, years)
    : null;
  const worstWindowOutcome = worstWindow
    ? projectThroughSequence({
        initial, monthly,
        returnsPct: activeHistoricalModel.data.slice(worstWindow.startIndex, worstWindow.startIndex + worstWindow.windowYears)
      })
    : null;

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
        historicalSeries: activeHistoricalModel.data,
        ...(modelDrawdown ? { retirementYears, annualWithdrawal, withdrawalInflation } : {})
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

  // Ultra-only, drawdown mode: binary-search the largest year-one withdrawal whose pot
  // still survives `targetProb`% of retirements. Survival falls monotonically as the
  // withdrawal rises, so a plain bracketing search works.
  const handleSolveWithdrawal = () => {
    setIsSolvingWithdrawal(true);
    setTimeout(() => {
      const base = {
        initial, monthly, rate, years, volatility, goal,
        contributionIncreaseRate: contributionIncrease, lumpSums, returnModel,
        historicalSeries: activeHistoricalModel.data,
        retirementYears, withdrawalInflation
      };
      const survivalAt = (w) => (runSimulation({ ...base, annualWithdrawal: w }).drawdown || {}).survivalRate ?? 0;
      const wanted = Math.max(1, Math.min(99, targetProb || 90));

      if (survivalAt(0) < wanted) {
        // Even zero withdrawal can't clear the bar (pot too small / horizon too long).
        setWithdrawalSolveResult({ withdrawal: 0, achievedSurvival: survivalAt(0), wanted, reachable: false });
        setIsSolvingWithdrawal(false);
        return;
      }
      // Start the upper bound near a 10%-of-pot draw and widen until survival drops
      // below the target.
      let lo = 0;
      let hi = Math.max(50000, Math.round((deterministic.finalBalance || 1000000) * 0.1));
      let guard = 0;
      while (survivalAt(hi) >= wanted && guard < 8) { hi *= 1.8; guard++; }
      let bestW = lo;
      let bestSurv = survivalAt(lo);
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2;
        const s = survivalAt(mid);
        if (s >= wanted) { lo = mid; bestW = mid; bestSurv = s; } else hi = mid;
      }
      setWithdrawalSolveResult({ withdrawal: Math.round(bestW), achievedSurvival: bestSurv, wanted, reachable: true });
      setIsSolvingWithdrawal(false);
    }, 20);
  };

  return (
    <div className="card monte-carlo">
      <div className="mc-header">
        <h2>🎲 <Term k="monteCarloSimulation">{t('charts.mcTitle')}</Term></h2>
        <p>{t('charts.mcIntro', { sims: NUM_SIMULATIONS.toLocaleString(), years, suffix: compareWrapper && hasWrapper ? t('charts.mcSuffixWrapper', { wrapper: country.wrapperLabel }) : t('charts.mcSuffixPlain') })}</p>
      </div>

      <div className="mc-model-toggle">
        <button className={`mc-model-btn ${returnModel === 'normal' ? 'active' : ''}`} onClick={() => setReturnModel('normal')}>
          {t('charts.mcStatistical')}
        </button>
        <button className={`mc-model-btn ${returnModel === 'historical' ? 'active' : ''}`} onClick={() => setReturnModel('historical')}>
          {t('charts.mcHistorical')}
        </button>
      </div>

      <div className="mc-form">
        <div className="form-group">
          <label>{t('charts.mcExpected')}</label>
          <input type="number" value={rate} disabled />
          <small>{t('charts.mcFromCalc')}{returnModel === 'historical' ? t('charts.mcIgnored') : ''}</small>
        </div>
        {returnModel === 'normal' ? (
          <div className="form-group">
            <label><Term k="volatility">{t('charts.mcVolatility')}</Term>{t('charts.mcStdDev')}</label>
            <input type="number" min="0" max="60" step="1" value={volatility} onChange={(e) => setVolatility(Number(e.target.value))} />
          </div>
        ) : (
          <div className="form-group">
            <label>{t('charts.mcBenchmark')}</label>
            <select value={historicalModelKey} onChange={(e) => setHistoricalModelKey(e.target.value)}>
              {RETURN_MODELS.map(m => <option key={m.key} value={m.key}>{t(`charts.model${m.key}`)}</option>)}
            </select>
            <small>{t('charts.mcYrsNote', { n: activeHistoricalModel.data.length })}</small>
          </div>
        )}
        <div className="form-group">
          <label>{t('charts.mcGoal', { symbol: country.symbol })}</label>
          <input type="number" min="0" step="10000" value={goal} onChange={(e) => setGoal(Number(e.target.value))} />
        </div>
      </div>

      {returnModel === 'historical' && (
        <p className="mc-model-note">{t('charts.mcModelNote', { country: country.name })}</p>
      )}

      {worstWindow && worstWindowOutcome && (
        <div className="mc-worst-window">
          <span className="mc-worst-window-label">{t('charts.worstLabel', { n: worstWindow.windowYears })}</span>
          <p>
            {t('charts.worstBody1', { n: worstWindow.windowYears, model: activeHistoricalModel.label })}{' '}
            <strong>{worstWindow.growthMultiple.toFixed(2)}×</strong> ({t('left.pctYr', { n: worstWindow.annualisedReturnPct.toFixed(1) })}).{' '}
            {t('charts.worstBody2', { contrib: `${country.symbol}${Math.round(worstWindowOutcome.totalContributed).toLocaleString()}` })}{' '}
            <strong>{country.symbol}{Math.round(worstWindowOutcome.finalBalance).toLocaleString()}</strong>.{' '}
            {t('charts.worstBody3')}
          </p>
        </div>
      )}

      {hasWrapper && (
        <label className="mc-compare-toggle">
          <input type="checkbox" checked={compareWrapper} onChange={(e) => setCompareWrapper(e.target.checked)} />
          {t('charts.mcCompareToggle', { wrapper: country.wrapperLabel, rate: country.taxRate })}
        </label>
      )}

      <label className="mc-compare-toggle">
        <input type="checkbox" checked={modelDrawdown} onChange={(e) => setModelDrawdown(e.target.checked)} />
        {t('charts.drawdownToggle')}
      </label>
      {modelDrawdown && (
        <div className="mc-form mc-drawdown-form">
          <div className="form-group">
            <label>{t('charts.retLength')}</label>
            <input type="number" min="1" max="60" step="1" value={retirementYears} onChange={(e) => setRetirementYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('charts.withdrawalYr1', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={annualWithdrawal} onChange={(e) => setAnnualWithdrawal(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('charts.growWithdrawal')}</label>
            <input type="number" min="0" step="0.5" value={withdrawalInflation} onChange={(e) => setWithdrawalInflation(Number(e.target.value))} />
          </div>
        </div>
      )}
      {modelDrawdown && (
        <div className="mc-solver mc-solver-inline">
          <div className="mc-solver-row">
            <label>
              {t('charts.solveWithdrawalPre')}{' '}
              <input
                type="number" min="1" max="99"
                value={Math.max(1, Math.min(99, targetProb || 90))}
                onChange={(e) => setTargetProb(Number(e.target.value))}
              />{t('left.ofTheTime')}
            </label>
            <button className="mc-solver-btn" onClick={handleSolveWithdrawal} disabled={isSolvingWithdrawal}>
              {isSolvingWithdrawal ? t('charts.solving') : t('charts.findIt')}
            </button>
          </div>
          {withdrawalSolveResult && (
            <p className={`mc-solver-result ${withdrawalSolveResult.reachable ? '' : 'warn'}`}>
              {withdrawalSolveResult.reachable
                ? t('charts.wdReachable', { amount: `${country.symbol} ${withdrawalSolveResult.withdrawal.toLocaleString()}`, infl: withdrawalInflation, years: retirementYears, surv: withdrawalSolveResult.achievedSurvival.toFixed(0), wanted: withdrawalSolveResult.wanted, sims: NUM_SIMULATIONS.toLocaleString() })
                : t('charts.wdUnreachable', { years: retirementYears, surv: withdrawalSolveResult.achievedSurvival.toFixed(0), wanted: withdrawalSolveResult.wanted })}
            </p>
          )}
        </div>
      )}

      <button className="mc-run-btn" onClick={handleRun} disabled={isRunning}>
        {isRunning ? t('charts.mcRunning') : t('charts.mcRun')}
      </button>

      <div className="mc-solver">
        <div className="mc-solver-row">
          <label>
            {t('charts.solveMonthlyPre')}{' '}
            <input
              type="number" min="1" max="99"
              value={Math.max(1, Math.min(99, targetProb || 90))}
              onChange={(e) => setTargetProb(Number(e.target.value))}
            />{t('charts.solveMonthlyPost', { goal: `${country.symbol}${Math.round(goal).toLocaleString()}` })}
          </label>
          <button className="mc-solver-btn" onClick={handleSolve} disabled={isSolving}>
            {isSolving ? t('charts.solving') : t('charts.findIt')}
          </button>
        </div>
        {solveResult && (
          <p className={`mc-solver-result ${solveResult.reachable ? '' : 'warn'}`}>
            {solveResult.reachable
              ? t('charts.moReachable', { amount: `${country.symbol} ${solveResult.monthly.toLocaleString()}`, prob: solveResult.achievedProb.toFixed(0), wanted: solveResult.wanted, sims: NUM_SIMULATIONS.toLocaleString() })
              : t('charts.moUnreachable', { amount: `${country.symbol} ${solveResult.monthly.toLocaleString()}`, prob: solveResult.achievedProb.toFixed(0), wanted: solveResult.wanted })}
          </p>
        )}

        <div className="mc-solver-row">
          <label>
            {t('charts.solveYearsPre1')} <strong>{t('charts.solveYearsWord')}</strong> {t('charts.solveYearsPre2')}{' '}
            <input
              type="number" min="1" max="99"
              value={Math.max(1, Math.min(99, targetProb || 90))}
              onChange={(e) => setTargetProb(Number(e.target.value))}
            />{t('charts.solveYearsPost', { goal: `${country.symbol}${Math.round(goal).toLocaleString()}` })}
          </label>
          <button className="mc-solver-btn" onClick={handleSolveYears} disabled={isSolvingYears}>
            {isSolvingYears ? t('charts.solving') : t('charts.findIt')}
          </button>
        </div>
        {yearsSolveResult && (
          <p className={`mc-solver-result ${yearsSolveResult.reachable ? '' : 'warn'}`}>
            {yearsSolveResult.reachable
              ? (yearsSolveResult.extraYears === 0
                  ? t('charts.yrAlready', { years: yearsSolveResult.years, prob: yearsSolveResult.achievedProb.toFixed(0), wanted: yearsSolveResult.wanted })
                  : t('charts.yrMore', { years: yearsSolveResult.years, extra: yearsSolveResult.extraYears, prob: yearsSolveResult.achievedProb.toFixed(0), wanted: yearsSolveResult.wanted, sims: NUM_SIMULATIONS.toLocaleString() }))
              : t('charts.yrUnreachable', { years: yearsSolveResult.years, prob: yearsSolveResult.achievedProb.toFixed(0), wanted: yearsSolveResult.wanted })}
          </p>
        )}
      </div>

      {result && (
        <div className="mc-results">
          <div className="mc-probability">
            <span>{t('charts.mcProbability')}</span>
            <strong className={result.probabilityOfGoal >= 50 ? 'positive' : 'warn'}>{result.probabilityOfGoal.toFixed(1)}%</strong>
          </div>

          {result.goalProbByYear && result.goalProbByYear.length > 0 && (
            <div className="mc-prob-timeline">
              <span className="mc-prob-timeline-label">{t('left.mcChance')}</span>
              <div className="mc-prob-timeline-cells">
                {result.goalProbByYear.map(pt => (
                  <div key={pt.year}>
                    <span>{t('left.yrN', { n: pt.year })}</span>
                    <strong className={pt.probability >= 50 ? 'positive' : ''}>{pt.probability.toFixed(0)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FanChart yearlyPercentiles={result.yearlyPercentiles} symbol={country.symbol} />

          <div className="mc-percentiles">
            <div className="mc-stat"><span><Term k="percentile">{t('charts.mcPct10')}</Term></span><strong>{country.symbol} {Math.round(result.p10).toLocaleString()}</strong></div>
            <div className="mc-stat"><span>{t('charts.mcPct25')}</span><strong>{country.symbol} {Math.round(result.p25).toLocaleString()}</strong></div>
            <div className="mc-stat median"><span>{t('charts.median')}</span><strong>{country.symbol} {Math.round(result.p50).toLocaleString()}</strong></div>
            <div className="mc-stat"><span>{t('charts.mcPct75')}</span><strong>{country.symbol} {Math.round(result.p75).toLocaleString()}</strong></div>
            <div className="mc-stat"><span>{t('charts.mcPct90')}</span><strong>{country.symbol} {Math.round(result.p90).toLocaleString()}</strong></div>
          </div>

          {(() => {
            const rank = result.percentileRankOf(deterministic.finalBalance);
            if (rank == null) return null;
            const optimism = t(rank >= 65 ? 'charts.optimistic' : rank <= 35 ? 'charts.conservative' : 'charts.middle');
            return (
              <p className="mc-model-note">
                {t('charts.modelNote1', { amount: `${country.symbol}${Math.round(deterministic.finalBalance).toLocaleString()}`, rate })}{' '}
                <strong>{t('charts.modelNote2', { n: Math.round(rank) })}</strong> {t('charts.modelNote3', { sims: NUM_SIMULATIONS.toLocaleString(), optimism })} {t(rank >= 65 ? 'charts.modelUnder' : rank <= 35 ? 'charts.modelBeat' : 'charts.modelMedian')}
              </p>
            );
          })()}

          {result.p50 > 0 && (
            <p className="mc-model-note">
              {t('charts.downside1', { p10: `${country.symbol}${Math.round(result.p10).toLocaleString()}` })}{' '}
              <strong>{t('charts.downside2', { gap: `${country.symbol}${Math.round(result.p50 - result.p10).toLocaleString()}` })}</strong>{' '}
              {t('charts.downside3', { pct: Math.round(((result.p50 - result.p10) / result.p50) * 100) })}
            </p>
          )}

          {(() => {
            const rank = result.percentileRankOf(deterministic.totalDeposited);
            if (rank == null) return null;
            const breakEvenProb = 100 - rank;
            return (
              <p className="mc-model-note">
                {t('charts.breakEven1')} <strong>{Math.round(breakEvenProb)}%</strong> {t('charts.breakEven2', { sims: NUM_SIMULATIONS.toLocaleString(), deposited: `${country.symbol}${Math.round(deterministic.totalDeposited).toLocaleString()}`, rest: Math.round(rank) })}
              </p>
            );
          })()}

          {result.p10 > 0 && result.p90 > result.p10 && (
            <p className="mc-model-note">
              {t('charts.luck1', { rate, p90: `${country.symbol}${Math.round(result.p90).toLocaleString()}` })}{' '}
              <strong>{t('charts.luck2', { x: (result.p90 / result.p10).toFixed(1) })}</strong> {t('charts.luck3', { p10: `${country.symbol}${Math.round(result.p10).toLocaleString()}` })}
            </p>
          )}

          {result.drawdown && (
            <div className="mc-drawdown-result">
              <div className="mc-probability">
                <span>{t('charts.potSurvives', { years: result.drawdown.retirementYears })}</span>
                <strong className={result.drawdown.survivalRate >= 85 ? 'positive' : result.drawdown.survivalRate >= 60 ? 'warn' : 'warn'}>
                  {t('charts.ofTheTime', { pct: result.drawdown.survivalRate.toFixed(0) })}
                </strong>
              </div>
              <p className="mc-model-note">
                {t('charts.drawNote', { amount: `${country.symbol}${Math.round(annualWithdrawal).toLocaleString()}`, infl: withdrawalInflation, median: result.drawdown.medianYearsLasted, worst: result.drawdown.worstCaseYearsLasted, left: `${country.symbol}${Math.round(result.drawdown.p50EndBalance).toLocaleString()}` })}
              </p>
            </div>
          )}
        </div>
      )}

      {wrapperCompare && (
        <div className="mc-results mc-wrapper-compare">
          <p className="mc-compare-summary">
            {t('charts.mcCompareSummary1', { wrapper: country.wrapperLabel })} <strong className="positive">{country.symbol} {Math.round(wrapperCompare.sheltered.p50).toLocaleString()}</strong>
            {' '}{t('charts.mcCompareSummary2')} <strong>{country.symbol} {Math.round(wrapperCompare.taxable.p50).toLocaleString()}</strong>
            {' '}{t('charts.mcCompareSummary3')} <strong className="positive">{country.symbol} {Math.round(wrapperCompare.sheltered.p50 - wrapperCompare.taxable.p50).toLocaleString()}</strong> {t('charts.mcCompareSummary4', { rate })}
          </p>

          <div className="mc-compare-grid">
            <div className="mc-compare-col">
              <h3>{t('charts.mcTaxable')}</h3>
              <div className="mc-probability small">
                <span>{t('charts.mcProbShort')}</span>
                <strong className={wrapperCompare.taxable.probabilityOfGoal >= 50 ? 'positive' : 'warn'}>{wrapperCompare.taxable.probabilityOfGoal.toFixed(1)}%</strong>
              </div>
              <FanChart yearlyPercentiles={wrapperCompare.taxable.yearlyPercentiles} symbol={country.symbol} />
            </div>
            <div className="mc-compare-col">
              <h3>{country.wrapperLabel}</h3>
              <div className="mc-probability small">
                <span>{t('charts.mcProbShort')}</span>
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
