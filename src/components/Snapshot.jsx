// src/components/Snapshot.jsx
import React, { useState, useEffect } from 'react';
import './Snapshot.css';
import { calculateCompoundInterest } from '../engine';

const PLAN_STORAGE_KEY = 'wts_compoundiq_plan_snapshot';

const downloadCSV = (results, country) => {
  const header = ['Year', 'Balance', 'Real Value', 'Deposited', 'Interest', 'Tax Paid'];
  const rows = results.yearlyData.map(r => [r.year, r.balance, r.realValue, r.deposited, r.interest, r.taxPaid]);
  const csv = [header, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wts-compoundiq-${country.code}-projection.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const Snapshot = ({ country, initial, monthly, rate, years, inflation, wrapper, compoundFrequency }) => {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (raw) {
      try { setPlan(JSON.parse(raw)); } catch { /* ignore corrupt snapshot */ }
    }
  }, []);

  const results = calculateCompoundInterest({
    initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit
  });

  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';
  const taxableResults = calculateCompoundInterest({ initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper: false, compoundFrequency });
  const wrapperResults = calculateCompoundInterest({
    initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper: true, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit
  });
  const wrapperBenefit = wrapperResults.finalBalance - taxableResults.finalBalance;

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="card snapshot-page">
      <div className="snapshot-actions no-print">
        <div className="snapshot-actions-text">
          <h2>📄 Financial Snapshot</h2>
          <p>A one-page summary of your current plan -- print it, save it as a PDF, or download the raw numbers.</p>
        </div>
        <div className="snapshot-buttons">
          <button className="snapshot-btn" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
          <button className="snapshot-btn secondary" onClick={() => downloadCSV(results, country)}>⬇️ Download CSV</button>
        </div>
      </div>

      <div className="snapshot-print-area">
        <div className="snapshot-report-header">
          <h1>WTS CompoundIQ -- Financial Snapshot</h1>
          <p>{country.name} · Generated {today}</p>
        </div>

        <section className="snapshot-section">
          <h3>Compound Interest Projection</h3>
          <div className="snapshot-grid">
            <div><span>Initial</span><strong>{country.symbol} {initial.toLocaleString()}</strong></div>
            <div><span>Monthly Contribution</span><strong>{country.symbol} {monthly.toLocaleString()}</strong></div>
            <div><span>Annual Rate</span><strong>{rate}%</strong></div>
            <div><span>Timeframe</span><strong>{years} years</strong></div>
            <div><span>Projected Balance</span><strong>{country.symbol} {results.finalBalance.toLocaleString()}</strong></div>
            <div><span>Total Interest Earned</span><strong>{country.symbol} {results.totalInterest.toLocaleString()}</strong></div>
          </div>
        </section>

        <section className="snapshot-section">
          <h3>Tax Optimization</h3>
          {hasWrapper ? (
            <p>
              Using your {country.wrapperLabel} instead of a taxable account is worth an extra{' '}
              <strong>{country.symbol} {Math.round(wrapperBenefit).toLocaleString()}</strong> over {years} years,
              by avoiding the indicative {country.taxRate}% tax on gains.
              {wrapperResults.wrapperCapExceeded && ' Note: this contribution level exceeds the wrapper\'s real-world limit in at least one year, so the portion over the cap would actually be taxed.'}
            </p>
          ) : (
            <p>{country.name} has no standard tax-free wrapper in this dataset; gains are taxed at an indicative {country.taxRate}%.</p>
          )}
        </section>

        {plan?.emergencyFund && (
          <section className="snapshot-section">
            <h3>Emergency Fund (last saved)</h3>
            <p>
              {country.symbol} {Math.round(plan.emergencyFund.currentSavings).toLocaleString()} saved toward a{' '}
              {country.symbol} {Math.round(plan.emergencyFund.targetAmount).toLocaleString()} target,
              contributing {country.symbol} {plan.emergencyFund.monthlyContribution.toLocaleString()}/month.
            </p>
          </section>
        )}

        {plan?.debt && (
          <section className="snapshot-section">
            <h3>Debt Payoff (last saved)</h3>
            <p>
              {country.symbol} {Math.round(plan.debt.totalBalance).toLocaleString()} total debt,
              paying {country.symbol} {plan.debt.extraMonthly.toLocaleString()}/month extra,
              on pace to be debt-free in {plan.debt.avalancheMonths} months.
            </p>
          </section>
        )}

        <table className="snapshot-table">
          <thead>
            <tr><th>Year</th><th>Balance</th><th>Real Value</th><th>Deposited</th><th>Interest</th><th>Tax Paid</th></tr>
          </thead>
          <tbody>
            {results.yearlyData.map(row => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td>{country.symbol} {row.balance.toLocaleString()}</td>
                <td>{country.symbol} {row.realValue.toLocaleString()}</td>
                <td>{country.symbol} {row.deposited.toLocaleString()}</td>
                <td>{country.symbol} {row.interest.toLocaleString()}</td>
                <td>{country.symbol} {row.taxPaid.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="snapshot-disclaimer">
          WTS CompoundIQ · educational tool · figures are indicative projections, not financial advice. Tax and wrapper
          data is simplified and may drift from current law -- verify with a qualified advisor before acting.
        </p>
      </div>
    </div>
  );
};

export default Snapshot;
