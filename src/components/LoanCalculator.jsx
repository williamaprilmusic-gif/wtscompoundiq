// src/components/LoanCalculator.jsx
// Covers both "how much will my home loan/bond actually cost me" and a general
// fixed-rate loan calculator -- they're the exact same amortization math, so this is
// one calculator with a loan-type selector rather than two near-duplicate tabs.
import React, { useState } from 'react';
import './LoanCalculator.css';
import { calculateLoanAmortization } from '../loanAmortization';
import { downloadCSV } from '../utils/csv';
import { savePlanSection, monthsToYearsLabel } from '../utils/planStorage';
import { usePersistedState } from '../utils/usePersistedState';
import { uniqueId } from '../utils/uniqueId';
import Term from './Term';
import SnapshotChart from './SnapshotChart';
import { useLanguage } from '../i18n/LanguageContext';

// "Clears this loan around March 2029" reads more concretely than "in 41 months" --
// same touch as Debt Payoff's own payoff-date hint and the Calculator tab's
// years-to-grow date.
const monthsFromNowLabel = (months) =>
  new Date(new Date().setMonth(new Date().getMonth() + months)).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });


const INPUTS_KEY = 'wts_compoundiq_loancalc_inputs';
const LUMPSUMS_KEY = 'wts_compoundiq_loancalc_lumpsums';
const DEFAULT_INPUTS = {
  loanType: 'bond', principal: 0, annualRate: 0, termYears: 20, extraMonthly: 0,
  // South African bonds and vehicle finance are commonly quoted as "prime + N%"
  // rather than a flat rate -- lets someone punch in exactly what their offer letter
  // says (e.g. "prime + 1%") instead of doing that addition by hand first. Deliberately
  // starts blank like every other field here, not a guessed "current prime rate" --
  // prime moves with SARB policy and guessing it risks being wrong the moment it's
  // typed, unlike this app's other "illustrative, periodically re-verified" figures.
  quotedAsPrimePlus: false, primeRate: 0, margin: 0
};

// Term is a sensible starting default per type -- not a rate estimate (rates vary too
// much by lender, credit profile, and country to guess responsibly), just how long
// this kind of loan typically runs. Fully editable either way. Labels/tips come from the
// translations (src/i18n/strings/loan.js: type{key}, short{key}, g{n}*, {key}{n}*).
const LOAN_TYPES = [
  { key: 'bond', defaultTermYears: 20 },
  { key: 'vehicle', defaultTermYears: 6 },
  { key: 'personal', defaultTermYears: 3 },
  { key: 'student', defaultTermYears: 10 },
  { key: 'other', defaultTermYears: 5 }
];

// General strategies that apply regardless of loan type (3), plus 2 per type.
const GENERAL_TIP_KEYS = ['g0', 'g1', 'g2'];
const TYPE_TIP_KEYS = ['0', '1'];

const LoanCalculator = ({ country }) => {
  const { t } = useLanguage();
  const SINGLE_BALANCE_SERIES = [{ key: 'debts', label: t('loan.seriesLoanBalance') }];
  const COMPARISON_BALANCE_SERIES = [{ key: 'standard', label: t('loan.seriesStandard') }, { key: 'plan', label: t('loan.seriesExtra') }];
  const formatYearAxis = (year) => t('loan.yr', { n: year });
  const formatYearTooltip = (year) => t('loan.year', { n: year });
  const [inputs, setInputs] = usePersistedState(INPUTS_KEY, DEFAULT_INPUTS);
  const { loanType, principal, annualRate, termYears, extraMonthly, quotedAsPrimePlus, primeRate, margin } = inputs;
  // The rate actually fed to every calculation below -- prime + margin when quoted that
  // way, otherwise the flat rate typed directly. Toggling the mode doesn't lose either
  // side's numbers; they're both still stored in `inputs`, just not the one in use.
  const effectiveAnnualRate = quotedAsPrimePlus ? (Number(primeRate) || 0) + (Number(margin) || 0) : annualRate;
  const [lumpSums, setLumpSums] = usePersistedState(LUMPSUMS_KEY, []);
  const [saved, setSaved] = useState(false);

  const updateInput = (field, value) => setInputs(prev => ({ ...prev, [field]: Number(value) }));
  const toggleQuotedAsPrimePlus = () => setInputs(prev => ({ ...prev, quotedAsPrimePlus: !prev.quotedAsPrimePlus }));

  const selectLoanType = (type) => {
    setInputs(prev => ({ ...prev, loanType: type.key, termYears: type.defaultTermYears }));
  };

  const addLumpSum = () => setLumpSums(prev => [...prev, { id: uniqueId(), month: 1, amount: 0 }]);
  const updateLumpSum = (id, field, value) => setLumpSums(prev => prev.map(l => l.id === id ? { ...l, [field]: Number(value) } : l));
  const removeLumpSum = (id) => setLumpSums(prev => prev.filter(l => l.id !== id));

  // Guard against a transient/blank "month" value while the user is mid-edit -- same
  // failure mode (and fix) as Debt Payoff's lump sums.
  const safeLumpSums = lumpSums.map(l => ({ ...l, month: l.month > 0 ? l.month : 1 }));

  const result = calculateLoanAmortization({ principal, annualRate: effectiveAnnualRate, termYears, extraMonthly, lumpSums: safeLumpSums });
  const repaymentMultiple = principal > 0 ? result.totalRepayment / principal : 0;
  const activeType = LOAN_TYPES.find(lt => lt.key === loanType) || LOAN_TYPES[0];
  const activeTypeLabel = t(`loan.type${activeType.key}`);
  const activeShortLabel = t(`loan.short${activeType.key}`);

  // Rate-shock table: South African home loans (and most vehicle finance) are
  // variable-rate, prime-linked -- the payment moves whenever the Reserve Bank moves.
  // Same "show the range, don't make them drag a slider" idea as the Calculator's
  // rate-sensitivity band and Net Worth's FX shock table.
  const RATE_SHOCKS = [-1, 0, 1, 2, 3];
  const isVariableRateType = loanType === 'bond' || loanType === 'vehicle';
  const rateShockRows = (isVariableRateType && principal > 0 && termYears > 0)
    ? RATE_SHOCKS.map((delta) => ({
        delta,
        rate: effectiveAnnualRate + delta,
        payment: calculateLoanAmortization({ principal, annualRate: Math.max(0, effectiveAnnualRate + delta), termYears, lumpSums: safeLumpSums }).monthlyPayment
      }))
    : null;

  // Bi-weekly payments (half the monthly instalment, every 2 weeks) work out to 26
  // half-payments a year -- 13 full monthly-equivalent payments instead of 12. That
  // "extra month" a year is the standard simplified way this trick is explained, so
  // it's modeled the same way here: one extra 1/12th-of-a-payment spread across the
  // year, reusing the exact same engine as the Extra Monthly Payment field above.
  const biweeklyExtra = result.monthlyPayment / 12;
  const biweeklyResult = (principal > 0 && termYears > 0)
    ? calculateLoanAmortization({ principal, annualRate: effectiveAnnualRate, termYears, extraMonthly: biweeklyExtra, lumpSums: safeLumpSums })
    : null;

  // Visualizes the same standard-vs-extra comparison as the callout below it, in a
  // chart instead of just the payoff-schedule table. Isolates extraMonthly's own
  // effect the same way that callout does (both schedules include the same lumpSums),
  // rather than a redundant single line when there's nothing to compare against.
  const showComparisonChart = extraMonthly > 0 && !!result.extra;
  const chartYears = showComparisonChart
    ? Math.max(result.yearlyData.length, result.extra.yearlyData.length)
    : result.yearlyData.length;
  // year 0 = the full loan amount, before any payments -- so the line visibly starts
  // at what was actually borrowed, same convention GrowthChart.jsx uses for a plan's
  // starting deposit.
  const balanceChartPoints = [
    showComparisonChart ? { year: 0, standard: principal, plan: principal } : { year: 0, debts: principal },
    ...Array.from({ length: chartYears }, (_, i) => {
      const year = i + 1;
      return showComparisonChart
        ? { year, standard: result.yearlyData[i]?.balance ?? 0, plan: result.extra.yearlyData[i]?.balance ?? 0 }
        : { year, debts: result.yearlyData[i]?.balance ?? 0 };
    })
  ];

  const exportCSV = () => {
    const header = [t('loan.csvYear'), t('loan.csvInterest'), t('loan.csvPrincipal'), t('loan.csvTotal'), t('loan.csvBalance')];
    const rows = result.yearlyData.map(r => [r.year, r.interestPaid, r.principalPaid, r.totalPaidToDate, r.balance]);
    downloadCSV(`wts-compoundiq-${loanType}-amortization.csv`, [header, ...rows]);
  };

  const savePlan = () => {
    // My Plan's check-in math derives an expected-remaining-balance pace from
    // principal / payoffMonths -- if there's an extra monthly payment, that pace has
    // to reflect the faster, extra-adjusted schedule (result.extra), or it silently
    // reverts to the slower standard schedule and understates real progress.
    const effectivePayoffMonths = (extraMonthly > 0 && result.extra) ? result.extra.payoffMonths : result.payoffMonths;
    const effectiveTotalInterest = (extraMonthly > 0 && result.extra) ? result.extra.totalInterest : result.totalInterest;
    savePlanSection('loan', {
      savedAt: new Date().toISOString(),
      loanType,
      loanTypeLabel: activeTypeLabel,
      principal,
      annualRate: effectiveAnnualRate,
      termYears,
      extraMonthly,
      monthlyPayment: result.monthlyPayment,
      payoffMonths: effectivePayoffMonths,
      totalInterest: effectiveTotalInterest
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card loan-calculator">
      <div className="loan-header">
        <h2>🏦 <Term k="amortization">{t('loan.termLabel')}</Term> {t('loan.titleSuffix')}</h2>
        <p>{t('loan.introPre')}<Term k="bond">{t('loan.bondTerm')}</Term>{t('loan.introPost')}</p>
      </div>

      <div className="loan-type-presets">
        {LOAN_TYPES.map((type) => (
          <button
            key={type.key}
            className={`loan-type-btn ${loanType === type.key ? 'active' : ''}`}
            onClick={() => selectLoanType(type)}
          >
            {t(`loan.type${type.key}`)}
          </button>
        ))}
      </div>

      <label className="loan-prime-toggle">
        <input type="checkbox" checked={quotedAsPrimePlus} onChange={toggleQuotedAsPrimePlus} />
        {t('loan.primePlus')}
      </label>

      <div className="loan-form">
        <div className="form-group">
          <label>{t('loan.loanAmount', { symbol: country.symbol })}</label>
          <input type="number" min="0" step="10000" value={principal} onChange={(e) => updateInput('principal', e.target.value)} />
        </div>
        {quotedAsPrimePlus ? (
          <>
            <div className="form-group">
              <label>{t('left.loanPrime')}</label>
              <input type="number" min="0" step="0.1" value={primeRate} onChange={(e) => updateInput('primeRate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('left.loanMargin')}</label>
              <input type="number" step="0.1" value={margin} onChange={(e) => updateInput('margin', e.target.value)} />
              {(primeRate > 0 || margin !== 0) && (
                <span className="loan-prime-effective">{t('left.primeEffective', { rate: effectiveAnnualRate.toFixed(2) })}</span>
              )}
            </div>
          </>
        ) : (
          <div className="form-group">
            <label>{t('loan.interestRate')}</label>
            <input type="number" min="0" step="0.1" value={annualRate} onChange={(e) => updateInput('annualRate', e.target.value)} />
          </div>
        )}
        <div className="form-group">
          <label>{t('loan.loanTerm')}</label>
          <input type="number" min="1" max="50" value={termYears} onChange={(e) => updateInput('termYears', e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t('loan.extraMonthly', { symbol: country.symbol })}</label>
          <input type="number" min="0" step="100" value={extraMonthly} onChange={(e) => updateInput('extraMonthly', e.target.value)} />
        </div>
      </div>

      <div className="loan-lumpsum-section">
        <div className="loan-lumpsum-header">
          <h3>{t('loan.oneOffTitle')}</h3>
          <button className="loan-lumpsum-add-btn" onClick={addLumpSum}>{t('loan.addOneOff')}</button>
        </div>
        {lumpSums.length === 0 ? (
          <p className="loan-lumpsum-empty">{t('loan.oneOffEmpty')}</p>
        ) : (
          <div className="loan-lumpsum-list">
            {lumpSums.map((l) => (
              <div key={l.id} className="loan-lumpsum-row">
                <div className="loan-lumpsum-field">
                  <label>{t('loan.inMonth')}</label>
                  <input type="number" min="1" value={l.month} onChange={(e) => updateLumpSum(l.id, 'month', e.target.value)} />
                </div>
                <div className="loan-lumpsum-field">
                  <label>{t('loan.amount', { symbol: country.symbol })}</label>
                  <input type="number" min="0" step="1000" value={l.amount} onChange={(e) => updateLumpSum(l.id, 'amount', e.target.value)} />
                </div>
                <button className="loan-lumpsum-remove" onClick={() => removeLumpSum(l.id)} aria-label={t('loan.removeOneOff')}>&times;</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {principal > 0 && termYears > 0 && (
        <>
          <div className="loan-results">
            <div className="loan-stat">
              <span>{t('loan.monthlyPayment')}</span>
              <strong>{country.symbol} {result.monthlyPayment.toLocaleString()}</strong>
            </div>
            <div className="loan-stat">
              <span>{t('loan.totalRepayment')}</span>
              <strong>{country.symbol} {result.totalRepayment.toLocaleString()}</strong>
            </div>
            <div className="loan-stat">
              <span>{t('loan.totalInterest')}</span>
              <strong className="warn">{country.symbol} {result.totalInterest.toLocaleString()}</strong>
            </div>
            <div className="loan-stat">
              <span>{t('loan.youRepay')}</span>
              <strong>{repaymentMultiple.toFixed(2)}{t('loan.whatYouBorrowed')}</strong>
            </div>
          </div>

          {!result.reachable && (
            <p className="loan-warning">{t('loan.warning')}</p>
          )}

          {rateShockRows && (
            <div className="loan-rate-shock">
              <h3>{t('left.loanShockTitle')}</h3>
              <div className="loan-rate-shock-grid">
                {rateShockRows.map((row) => (
                  <div key={row.delta} className={`loan-rate-shock-cell ${row.delta === 0 ? 'baseline' : ''} ${row.delta > 0 ? 'up' : ''}`}>
                    <span>{row.delta === 0 ? 'now' : `${row.delta > 0 ? '+' : ''}${row.delta}%`}</span>
                    <strong>{country.symbol} {Math.round(row.payment).toLocaleString()}{t('pt.perMo')}</strong>
                    {row.delta !== 0 && (
                      <span className="loan-rate-shock-diff">
                        {row.payment >= result.monthlyPayment ? '+' : '−'}{country.symbol} {Math.abs(Math.round(row.payment - result.monthlyPayment)).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="loan-note" style={{ marginTop: '8px' }}>
                {activeType.shortLabel === 'home loan' ? t('loan.homeLoans') : t('loan.vehicleFinance')} {t('loan.shockNote', { rate: effectiveAnnualRate.toFixed(2) })}
              </p>
            </div>
          )}

          {extraMonthly > 0 && result.extra && (
            <div className="loan-extra-callout">
              {t('loan.extraCallout1', { amount: `${country.symbol}${extraMonthly.toLocaleString()}`, type: activeType.shortLabel })}{' '}
              <strong>{monthsToYearsLabel(result.extra.payoffMonths)}</strong> {t('loan.extraCallout2', { was: monthsToYearsLabel(result.payoffMonths, t) })}{' '}
              (<span className="loan-result-date">{t('loan.around', { date: monthsFromNowLabel(result.extra.payoffMonths) })}</span>) --{' '}
              {t('loan.extraCallout3')} <strong className="positive">{country.symbol} {result.extra.interestSaved.toLocaleString()}</strong>{' '}
              {t('loan.extraCallout4', { years: Math.floor(result.extra.monthsSaved / 12), months: result.extra.monthsSaved % 12 })}
            </div>
          )}

          {biweeklyResult?.extra && (
            <div className="loan-extra-callout biweekly">
              {t('loan.biweeklyA', { payment: `${country.symbol}${result.monthlyPayment.toLocaleString()}`, type: activeType.shortLabel })}{' '}
              <strong>{monthsToYearsLabel(biweeklyResult.extra.payoffMonths)}</strong> {t('loan.biweeklyB', { was: monthsToYearsLabel(result.payoffMonths, t) })}{' '}
              (<span className="loan-result-date">{t('loan.around', { date: monthsFromNowLabel(biweeklyResult.extra.payoffMonths) })}</span>),{' '}
              {t('loan.extraCallout3')} <strong className="positive">{country.symbol} {biweeklyResult.extra.interestSaved.toLocaleString()}</strong>{t('loan.biweekly3')}</div>
          )}

          {balanceChartPoints.length > 2 && (
            <div className="loan-chart-section">
              <h3>{t('loan.balanceOverTime')}</h3>
              <SnapshotChart
                points={balanceChartPoints}
                series={showComparisonChart ? COMPARISON_BALANCE_SERIES : SINGLE_BALANCE_SERIES}
                symbol={country.symbol}
                xKey="year"
                formatXAxis={formatYearAxis}
                formatXTooltip={formatYearTooltip}
              />
            </div>
          )}

          <div className="loan-table-actions">
            <h3>{t('loan.schedule')}</h3>
            <button className="loan-export-btn" onClick={exportCSV}>{t('loan.exportCsv')}</button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('loan.thYear')}</th>
                  <th>{t('loan.thInterest')}</th>
                  <th>{t('loan.thPrincipal')}</th>
                  <th>{t('loan.thTotalPaid')}</th>
                  <th>{t('loan.thBalance')}</th>
                </tr>
              </thead>
              <tbody>
                {result.yearlyData.map((row) => (
                  <tr key={row.year}>
                    <td>{row.year}</td>
                    <td style={{ color: 'var(--accent-yellow)' }}>{country.symbol} {row.interestPaid.toLocaleString()}</td>
                    <td style={{ color: 'var(--accent-green)' }}>{country.symbol} {row.principalPaid.toLocaleString()}</td>
                    <td>{country.symbol} {row.totalPaidToDate.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{country.symbol} {row.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="loan-save-plan-btn" onClick={savePlan}>
            {saved ? t('loan.savedToPlan') : t('loan.savePlan')}
          </button>
        </>
      )}

      <div className="loan-tips-section">
        <h3>{activeType.key === 'personal' || activeType.key === 'other' ? t('loan.tipsItTitle') : t('loan.tipsTypeTitle', { type: activeShortLabel })}</h3>
        <div className="loan-tips-grid">
          {GENERAL_TIP_KEYS.map((k) => (
            <div key={k} className="loan-tip-card">
              <h4>{t(`loan.${k}Title`)}</h4>
              <p>{t(`loan.${k}Body`)}</p>
            </div>
          ))}
          {TYPE_TIP_KEYS.map((n) => (
            <div key={`${activeType.key}${n}`} className="loan-tip-card specific">
              <h4>{t(`loan.${activeType.key}${n}Title`)}</h4>
              <p>{t(`loan.${activeType.key}${n}Body`)}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="loan-note">{t('loan.note')}</p>
    </div>
  );
};

export default LoanCalculator;
