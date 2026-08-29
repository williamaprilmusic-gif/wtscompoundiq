// src/components/LoanCalculator.jsx
// Covers both "how much will my home loan/bond actually cost me" and a general
// fixed-rate loan calculator -- they're the exact same amortization math, so this is
// one calculator with a loan-type selector rather than two near-duplicate tabs.
import React, { useState } from 'react';
import './LoanCalculator.css';
import { calculateLoanAmortization } from '../loanAmortization';
import { downloadCSV } from '../utils/csv';
import Term from './Term';

// Term is a sensible starting default per type -- not a rate estimate (rates vary too
// much by lender, credit profile, and country to guess responsibly), just how long
// this kind of loan typically runs. Fully editable either way.
const LOAN_TYPES = [
  { key: 'bond', label: '🏠 Home Loan / Bond', shortLabel: 'home loan', defaultTermYears: 20 },
  { key: 'vehicle', label: '🚗 Vehicle Loan', shortLabel: 'vehicle loan', defaultTermYears: 6 },
  { key: 'personal', label: '💳 Personal Loan', shortLabel: 'loan', defaultTermYears: 3 },
  { key: 'student', label: '🎓 Student Loan', shortLabel: 'student loan', defaultTermYears: 10 },
  { key: 'other', label: '📄 Other Loan', shortLabel: 'loan', defaultTermYears: 5 }
];

const LoanCalculator = ({ country }) => {
  const [loanType, setLoanType] = useState('bond');
  const [principal, setPrincipal] = useState(0);
  const [annualRate, setAnnualRate] = useState(0);
  const [termYears, setTermYears] = useState(LOAN_TYPES[0].defaultTermYears);
  const [extraMonthly, setExtraMonthly] = useState(0);

  const selectLoanType = (type) => {
    setLoanType(type.key);
    setTermYears(type.defaultTermYears);
  };

  const result = calculateLoanAmortization({ principal, annualRate, termYears, extraMonthly });
  const repaymentMultiple = principal > 0 ? result.totalRepayment / principal : 0;
  const activeType = LOAN_TYPES.find(t => t.key === loanType) || LOAN_TYPES[0];

  const exportCSV = () => {
    const header = ['Year', 'Interest Paid', 'Principal Paid', 'Total Paid To Date', 'Remaining Balance'];
    const rows = result.yearlyData.map(r => [r.year, r.interestPaid, r.principalPaid, r.totalPaidToDate, r.balance]);
    downloadCSV(`wts-compoundiq-${loanType}-amortization.csv`, [header, ...rows]);
  };

  return (
    <div className="card loan-calculator">
      <div className="loan-header">
        <h2>🏦 <Term k="amortization">Loan & Bond</Term> Calculator</h2>
        <p>See exactly what a home loan (<Term k="bond">bond</Term>), vehicle loan, or any other fixed-rate loan actually costs you -- monthly installment, total interest, and the full payoff schedule.</p>
      </div>

      <div className="loan-type-presets">
        {LOAN_TYPES.map((type) => (
          <button
            key={type.key}
            className={`loan-type-btn ${loanType === type.key ? 'active' : ''}`}
            onClick={() => selectLoanType(type)}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="loan-form">
        <div className="form-group">
          <label>Loan Amount ({country.symbol})</label>
          <input type="number" min="0" step="10000" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>Interest Rate (% per year)</label>
          <input type="number" min="0" step="0.1" value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>Loan Term (years)</label>
          <input type="number" min="1" max="50" value={termYears} onChange={(e) => setTermYears(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>Extra Monthly Payment ({country.symbol}, optional)</label>
          <input type="number" min="0" step="100" value={extraMonthly} onChange={(e) => setExtraMonthly(Number(e.target.value))} />
        </div>
      </div>

      {principal > 0 && termYears > 0 && (
        <>
          <div className="loan-results">
            <div className="loan-stat">
              <span>Monthly Payment</span>
              <strong>{country.symbol} {result.monthlyPayment.toLocaleString()}</strong>
            </div>
            <div className="loan-stat">
              <span>Total Repayment</span>
              <strong>{country.symbol} {result.totalRepayment.toLocaleString()}</strong>
            </div>
            <div className="loan-stat">
              <span>Total Interest Paid</span>
              <strong className="warn">{country.symbol} {result.totalInterest.toLocaleString()}</strong>
            </div>
            <div className="loan-stat">
              <span>You Repay</span>
              <strong>{repaymentMultiple.toFixed(2)}&times; what you borrowed</strong>
            </div>
          </div>

          {!result.reachable && (
            <p className="loan-warning">
              ⚠️ At this rate, the required monthly payment barely covers (or doesn't cover) the interest --
              this loan wouldn't actually pay itself off within a normal term. Double-check the rate and term.
            </p>
          )}

          {extraMonthly > 0 && result.extra && (
            <div className="loan-extra-callout">
              Paying an extra {country.symbol}{extraMonthly.toLocaleString()}/month clears this {activeType.shortLabel} in{' '}
              <strong>{Math.round(result.extra.payoffMonths / 12 * 10) / 10} years</strong> instead of {(result.payoffMonths / 12).toFixed(1)} --
              saving <strong className="positive">{country.symbol} {result.extra.interestSaved.toLocaleString()}</strong> in interest
              and {Math.floor(result.extra.monthsSaved / 12)} years {result.extra.monthsSaved % 12} months off the term.
            </div>
          )}

          <div className="loan-table-actions">
            <h3>Year-by-Year Payoff Schedule</h3>
            <button className="loan-export-btn" onClick={exportCSV}>⬇️ Export CSV</button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Interest Paid</th>
                  <th>Principal Paid</th>
                  <th>Total Paid To Date</th>
                  <th>Remaining Balance</th>
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
        </>
      )}

      <p className="loan-note">
        Standard fixed-rate amortization -- assumes one constant interest rate for the whole term (no rate changes,
        common with variable-rate loans), and doesn't include fees, insurance, rates & taxes, or bond registration
        costs. Educational estimate only, not a loan offer -- confirm actual figures with your lender.
      </p>
    </div>
  );
};

export default LoanCalculator;
