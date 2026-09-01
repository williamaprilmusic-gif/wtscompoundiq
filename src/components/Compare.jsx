// src/components/Compare.jsx
import React, { useState } from 'react';
import './Compare.css';
import { countriesData, convertAmount } from '../data/countries';
import { calculateCompoundInterest } from '../engine';
import { downloadCSV } from '../utils/csv';
import { usePersistedState } from '../utils/usePersistedState';
import Term from './Term';
import CountrySelect from './CountrySelect';

const SCENARIO_A_KEY = 'wts_compoundiq_scenario_a';
const SCENARIO_B_KEY = 'wts_compoundiq_scenario_b';

const Compare = ({ country, initial, monthly, rate, years, inflation, wrapper, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [] }) => {
  const otherDefault = countriesData.find(c => c.code !== country.code) || countriesData[0];
  const [codeA, setCodeA] = useState(country.code);
  const [codeB, setCodeB] = useState(otherDefault.code);

  // 'country': same plan, two countries/tax regimes (below). 'scenario': same country,
  // two independently-editable plans -- e.g. "what if I contributed more" or "what if I
  // waited 5 years to start" -- a different question the country-vs-country cards can't
  // answer since they deliberately hold initial/monthly/rate/years fixed and only vary
  // the country.
  const [mode, setMode] = useState('country');

  // Seeded from the live Calculator inputs on first use only (usePersistedState's
  // default is a one-time initializer) -- same "seed from current context at mount"
  // pattern as PowerTools' affordRate. Plan B starts as a copy of Plan A so both cards
  // read identically until the user changes something, rather than defaulting to zeros.
  // `touched` follows Invest.jsx's own goal-tracking convention (false until the user
  // edits *anything*, `!== false` rather than `=== true` so a scenario saved before
  // this field existed still reads as touched) -- tracked explicitly rather than
  // inferred from initial/monthly being 0, since a deliberately-zeroed plan (comparing
  // pure rate/timeframe/wrapper effects with no starting capital or contribution) is a
  // real, intentional scenario that value-based inference can't tell apart from one
  // nobody's touched yet.
  const [scenarioA, setScenarioA] = usePersistedState(SCENARIO_A_KEY, { name: 'Plan A', initial, monthly, rate, years, inflation, wrapper: !!wrapper, touched: false });
  const [scenarioB, setScenarioB] = usePersistedState(SCENARIO_B_KEY, { name: 'Plan B', initial, monthly, rate, years, inflation, wrapper: !!wrapper, touched: false });

  const updateScenario = (setScenario, field, value) => setScenario(prev => ({ ...prev, [field]: field === 'name' ? value : Number(value), touched: true }));
  const toggleScenarioWrapper = (setScenario) => setScenario(prev => ({ ...prev, wrapper: !prev.wrapper, touched: true }));
  const syncScenarioWithCalculator = (setScenario) => setScenario(prev => ({ ...prev, initial, monthly, rate, years, inflation, wrapper: !!wrapper, touched: true }));

  // Both scenarios seed from the live Calculator inputs on first use (see
  // usePersistedState's default above) -- if a brand-new user opens this tab before
  // ever touching the Calculator tab, that seed is all zeros, and gets persisted as
  // such (usePersistedState debounces/flushes its write regardless of whether the
  // value is "real"). Flagged here so the empty-looking result comes with an
  // explanation instead of just showing R0 with no context.
  const bothScenariosEmpty = scenarioA.touched === false && scenarioB.touched === false;

  const scenarioBase = { taxRate: country.taxRate, compoundFrequency, contributionIncreaseRate: contributionIncrease, annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit };
  const resultsScenarioA = calculateCompoundInterest({ ...scenarioBase, initial: scenarioA.initial, monthly: scenarioA.monthly, rate: scenarioA.rate, years: scenarioA.years, inflation: scenarioA.inflation, wrapper: scenarioA.wrapper });
  const resultsScenarioB = calculateCompoundInterest({ ...scenarioBase, initial: scenarioB.initial, monthly: scenarioB.monthly, rate: scenarioB.rate, years: scenarioB.years, inflation: scenarioB.inflation, wrapper: scenarioB.wrapper });
  // Same currency (same country) on both sides -- a direct balance comparison, no FX
  // conversion needed here (unlike the country-vs-country winner logic below).
  const scenarioWinner = resultsScenarioA.finalBalance === resultsScenarioB.finalBalance ? null : (resultsScenarioA.finalBalance > resultsScenarioB.finalBalance ? 'A' : 'B');
  const scenarioDelta = resultsScenarioB.finalBalance - resultsScenarioA.finalBalance;

  const exportScenarioCSV = () => {
    const header = ['Year', `${scenarioA.name} Balance (${country.currency})`, `${scenarioA.name} Interest`, `${scenarioB.name} Balance (${country.currency})`, `${scenarioB.name} Interest`];
    // Scenario A and B each have their own independently-set Years, so one yearlyData
    // array can be longer than the other -- iterate the longer of the two (not just A's)
    // so a shorter scenario's early rollover-to-empty doesn't silently truncate the
    // longer scenario's remaining years out of the export.
    const rowCount = Math.max(resultsScenarioA.yearlyData.length, resultsScenarioB.yearlyData.length);
    const rows = Array.from({ length: rowCount }, (_, i) => {
      const rowA = resultsScenarioA.yearlyData[i] || {};
      const rowB = resultsScenarioB.yearlyData[i] || {};
      return [rowA.year ?? rowB.year ?? i, rowA.balance ?? '', rowA.interest ?? '', rowB.balance ?? '', rowB.interest ?? ''];
    });
    downloadCSV(`wts-compoundiq-compare-${scenarioA.name || 'plan-a'}-vs-${scenarioB.name || 'plan-b'}.csv`.toLowerCase().replace(/\s+/g, '-'), [header, ...rows]);
  };

  const countryA = countriesData.find(c => c.code === codeA) || country;
  const countryB = countriesData.find(c => c.code === codeB) || otherDefault;

  const base = { initial, monthly, rate, years, inflation, compoundFrequency, contributionIncreaseRate: contributionIncrease, lumpSums };
  const resultsA = calculateCompoundInterest({ ...base, taxRate: countryA.taxRate, wrapper: false });
  const resultsB = calculateCompoundInterest({ ...base, taxRate: countryB.taxRate, wrapper: false });

  // Winner is determined by purchasing-power-equivalent value (via USD), never by
  // comparing raw currency units -- 100,000 ZAR and 100,000 USD are not the same size.
  const balanceA_usd = convertAmount(resultsA.finalBalance, countryA.code, 'us');
  const balanceB_usd = convertAmount(resultsB.finalBalance, countryB.code, 'us');
  const winner = balanceA_usd === balanceB_usd ? null : (balanceA_usd > balanceB_usd ? 'A' : 'B');

  const balanceA_inB = convertAmount(resultsA.finalBalance, countryA.code, countryB.code);
  const balanceB_inA = convertAmount(resultsB.finalBalance, countryB.code, countryA.code);

  const exportCSV = () => {
    const header = ['Year', `${countryA.name} Balance (${countryA.currency})`, `${countryA.name} Interest`, `${countryA.name} Tax Paid`,
      `${countryB.name} Balance (${countryB.currency})`, `${countryB.name} Interest`, `${countryB.name} Tax Paid`];
    const rows = resultsA.yearlyData.map((rowA, i) => {
      const rowB = resultsB.yearlyData[i] || {};
      return [rowA.year, rowA.balance, rowA.interest, rowA.taxPaid, rowB.balance ?? '', rowB.interest ?? '', rowB.taxPaid ?? ''];
    });
    downloadCSV(`wts-compoundiq-compare-${countryA.code}-vs-${countryB.code}.csv`, [header, ...rows]);
  };

  return (
    <div className="card country-compare">
      <div className="compare-header">
        <h2>{mode === 'country' ? '🌍 Compare Countries' : '📊 Compare My Plans'}</h2>
        <p>
          {mode === 'country'
            ? `Same ${initial.toLocaleString()}/${monthly.toLocaleString()}/mo plan at ${rate}% over ${years} years -- different tax regimes.`
            : `Same ${country.name} tax rules -- two independently-editable plans, so you can see what changing the contribution, rate, timeframe, or wrapper actually does.`}
        </p>
      </div>

      <div className="compare-mode-toggle" role="group" aria-label="Comparison mode">
        <button className={mode === 'country' ? 'active' : ''} onClick={() => setMode('country')}>🌍 Compare Countries</button>
        <button className={mode === 'scenario' ? 'active' : ''} onClick={() => setMode('scenario')}>📊 Compare My Plans</button>
      </div>

      {mode === 'country' ? (
        <>
          <div className="compare-pickers">
            <CountrySelect countries={countriesData} value={codeA} onChange={setCodeA} ariaLabel="First country to compare" />
            <span className="compare-vs">vs</span>
            <CountrySelect countries={countriesData} value={codeB} onChange={setCodeB} ariaLabel="Second country to compare" />
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

          <button className="compare-export-btn" onClick={exportCSV}>⬇️ Export Year-by-Year CSV</button>

          <div className="compare-note">
            Converted figures (≈) use an illustrative, approximate exchange rate table (not live rates) so the two plans
            can be compared on the same footing -- the "ahead" highlight is based on this converted value, not the raw
            currency-unit number. Tax rates are simplified single-figure indicators, not full bracket-by-bracket
            calculations.
          </div>
        </>
      ) : (
        <>
          {bothScenariosEmpty && (
            <p className="compare-scenario-empty-hint">
              Both plans start at {country.symbol}0 -- this tab seeds itself from the Calculator tab's inputs the first
              time you open it, so if you haven't entered anything there yet, edit the fields below directly, or fill in
              the Calculator tab first and click "Sync with Calculator" on either plan.
            </p>
          )}
          <div className="compare-grid">
            {[['A', scenarioA, setScenarioA, resultsScenarioA], ['B', scenarioB, setScenarioB, resultsScenarioB]].map(([label, scenario, setScenario, results]) => (
              <div key={label} className={`compare-card ${scenarioWinner === label ? 'winner' : ''}`}>
                <input
                  type="text"
                  className="compare-scenario-name"
                  aria-label={`Plan ${label} name`}
                  value={scenario.name}
                  onChange={(e) => updateScenario(setScenario, 'name', e.target.value)}
                />
                <div className="compare-scenario-form">
                  <div className="form-group">
                    <label>Initial ({country.symbol})</label>
                    <input type="number" min="0" value={scenario.initial} onChange={(e) => updateScenario(setScenario, 'initial', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Monthly ({country.symbol})</label>
                    <input type="number" min="0" value={scenario.monthly} onChange={(e) => updateScenario(setScenario, 'monthly', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Rate (%)</label>
                    <input type="number" step="0.1" value={scenario.rate} onChange={(e) => updateScenario(setScenario, 'rate', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Years</label>
                    <input type="number" min="1" max="80" value={scenario.years} onChange={(e) => updateScenario(setScenario, 'years', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Inflation (%)</label>
                    <input type="number" step="0.1" value={scenario.inflation} onChange={(e) => updateScenario(setScenario, 'inflation', e.target.value)} />
                  </div>
                </div>
                <label className="compare-scenario-wrapper-toggle">
                  <input type="checkbox" checked={!!scenario.wrapper} onChange={() => toggleScenarioWrapper(setScenario)} />
                  Use {country.wrapperLabel}
                </label>
                <button type="button" className="compare-scenario-sync-btn" onClick={() => syncScenarioWithCalculator(setScenario)}>
                  🔄 Sync with Calculator tab
                </button>
                <strong className="compare-value">{country.symbol} {Math.round(results.finalBalance).toLocaleString()}</strong>
                <div className="compare-details">
                  <span>Deposited: {country.symbol} {Math.round(results.totalDeposited).toLocaleString()}</span>
                  <span>Interest: {country.symbol} {Math.round(results.totalInterest).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {scenarioDelta !== 0 && (
            <p className="compare-scenario-verdict">
              {scenarioVerdictLabel(scenarioB, scenarioA, scenarioDelta, country)}
            </p>
          )}

          <button className="compare-export-btn" onClick={exportScenarioCSV}>⬇️ Export Year-by-Year CSV</button>

          <div className="compare-note">
            Both plans use {country.name}'s current tax rules and Calculator-tab compounding frequency/contribution
            growth settings -- only the fields shown above differ between them. Saved in your browser so they're still
            here next time.
          </div>
        </>
      )}
    </div>
  );
};

// Small helper kept outside the component body since it's pure formatting, not
// something that needs to re-close over Compare's state each render.
const scenarioVerdictLabel = (scenarioB, scenarioA, delta, country) =>
  `${scenarioB.name || 'Plan B'} ends up ${country.symbol} ${Math.abs(Math.round(delta)).toLocaleString()} ${delta > 0 ? 'ahead of' : 'behind'} ${scenarioA.name || 'Plan A'} -- driven by whatever's different between the two (contribution, rate, timeframe, or wrapper use).`;

export default Compare;
