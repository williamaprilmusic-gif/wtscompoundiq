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

// General strategies that apply regardless of loan type.
const GENERAL_TIPS = [
  {
    title: 'Make sure extra payments hit the principal',
    body: "Many lenders default an extra payment to \"pay ahead\" -- it covers a future instalment instead of reducing what you owe today. Check (or call and ask) that overpayments are applied straight to the principal, or you won't get the interest savings this calculator shows."
  },
  {
    title: 'Throw lump sums at it',
    body: 'A bonus, tax refund, 13th cheque, or inheritance applied directly to the balance skips straight to the "principal paid" column -- no monthly commitment required, and it still compounds into real interest savings for the rest of the term.'
  },
  {
    title: "Don't let a lower rate lower your payment",
    body: 'If your rate drops (or you refinance to a better one), keep paying your old, higher instalment amount instead of "enjoying" the smaller required payment. The difference goes straight to principal -- you keep the discipline you already had.'
  }
];

const TYPE_TIPS = {
  bond: [
    { title: 'Use an access/flexi facility if your bond has one', body: "Extra payments still reduce the interest you owe even if you can withdraw them again later for an emergency -- so there's little downside to overpaying into one versus a regular savings account." },
    { title: 'Round up to a clean number', body: "Rounding R15,739/month up to R16,000 barely registers month to month, but compounded over a 20-year term it's a meaningfully earlier payoff date." }
  ],
  vehicle: [
    { title: 'Put down the biggest deposit you can', body: 'Every rand you put down upfront saves you that same rand plus every month of interest it would have accrued for the entire loan term -- one of the highest-value moves available.' },
    { title: 'Avoid a balloon/residual payment structure', body: "A balloon payment lowers your monthly instalment by leaving a lump sum owed at the very end -- it usually means more total interest, not less, and can leave you owing more than the car is worth." }
  ],
  personal: [
    { title: 'Personal loans are usually your highest-rate debt', body: "If you're also carrying a bond or vehicle loan, extra cash almost always does more good here first -- see the Debt Payoff tab's Avalanche method for the math." },
    { title: "Be careful consolidating it into something else", body: 'Rolling it into a longer-term consolidation loan can lower the monthly payment while quietly increasing total interest paid -- run the new numbers through this calculator before agreeing.' }
  ],
  student: [
    { title: 'Check your loan\'s rules before overpaying', body: "Some income-driven or forgiveness-track student loans (common with US federal loans) can make extra payments pointless, or even reduce a forgiveness benefit you'd otherwise get after a set number of years. Confirm how yours works first." },
    { title: 'On a standard fixed-rate loan, pay extra early', body: "If there's no forgiveness angle, treat it like any other loan -- interest is front-loaded, so extra payments made early in the term save the most." }
  ],
  other: [
    { title: 'Confirm there\'s no early-settlement penalty', body: 'Some loan agreements charge a fee for paying off early -- check the terms before making extra payments so the fee doesn\'t eat the interest you\'re trying to save.' },
    { title: 'Prioritize against your other debts', body: "If you're juggling more than one loan, the Debt Payoff tab's Avalanche/Snowball comparison will tell you exactly which one extra cash should go to first." }
  ]
};

const PLAN_STORAGE_KEY = 'wts_compoundiq_plan_snapshot';

const LoanCalculator = ({ country }) => {
  const [loanType, setLoanType] = useState('bond');
  const [principal, setPrincipal] = useState(0);
  const [annualRate, setAnnualRate] = useState(0);
  const [termYears, setTermYears] = useState(LOAN_TYPES[0].defaultTermYears);
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [saved, setSaved] = useState(false);

  const selectLoanType = (type) => {
    setLoanType(type.key);
    setTermYears(type.defaultTermYears);
  };

  const result = calculateLoanAmortization({ principal, annualRate, termYears, extraMonthly });
  const repaymentMultiple = principal > 0 ? result.totalRepayment / principal : 0;
  const activeType = LOAN_TYPES.find(t => t.key === loanType) || LOAN_TYPES[0];

  // Bi-weekly payments (half the monthly instalment, every 2 weeks) work out to 26
  // half-payments a year -- 13 full monthly-equivalent payments instead of 12. That
  // "extra month" a year is the standard simplified way this trick is explained, so
  // it's modeled the same way here: one extra 1/12th-of-a-payment spread across the
  // year, reusing the exact same engine as the Extra Monthly Payment field above.
  const biweeklyExtra = result.monthlyPayment / 12;
  const biweeklyResult = (principal > 0 && termYears > 0)
    ? calculateLoanAmortization({ principal, annualRate, termYears, extraMonthly: biweeklyExtra })
    : null;

  const exportCSV = () => {
    const header = ['Year', 'Interest Paid', 'Principal Paid', 'Total Paid To Date', 'Remaining Balance'];
    const rows = result.yearlyData.map(r => [r.year, r.interestPaid, r.principalPaid, r.totalPaidToDate, r.balance]);
    downloadCSV(`wts-compoundiq-${loanType}-amortization.csv`, [header, ...rows]);
  };

  const savePlan = () => {
    let existing = {};
    try { existing = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || '{}'); } catch { /* ignore corrupt snapshot, start fresh */ }
    const updated = {
      ...existing,
      loan: {
        savedAt: new Date().toISOString(),
        loanType,
        loanTypeLabel: activeType.label,
        principal,
        annualRate,
        termYears,
        monthlyPayment: result.monthlyPayment,
        payoffMonths: result.payoffMonths,
        totalInterest: result.totalInterest
      }
    };
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

          {biweeklyResult?.extra && (
            <div className="loan-extra-callout biweekly">
              💡 Switching to bi-weekly payments (half your {country.symbol}{result.monthlyPayment.toLocaleString()} instalment, paid every 2
              weeks instead of once a month) works out to one extra payment a year. That alone would clear this {activeType.shortLabel} in{' '}
              <strong>{Math.round(biweeklyResult.extra.payoffMonths / 12 * 10) / 10} years</strong> instead of {(result.payoffMonths / 12).toFixed(1)},
              saving <strong className="positive">{country.symbol} {biweeklyResult.extra.interestSaved.toLocaleString()}</strong> in interest.
              You do pay one extra instalment's worth per year in total -- but if you're paid weekly or bi-weekly yourself, it often lines up
              with your paycheck rhythm instead of feeling like a separate decision (confirm your lender actually applies bi-weekly payments
              this way before switching -- some just bank them and apply monthly anyway, which erases the benefit).
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

          <button className="loan-save-plan-btn" onClick={savePlan}>
            {saved ? '✓ Saved to My Plan' : '💾 Save This Plan'}
          </button>
        </>
      )}

      <div className="loan-tips-section">
        <h3>💡 Ways to Pay {activeType.shortLabel === 'loan' ? 'It' : `Your ${activeType.shortLabel}`} Off Faster</h3>
        <div className="loan-tips-grid">
          {GENERAL_TIPS.map((tip) => (
            <div key={tip.title} className="loan-tip-card">
              <h4>{tip.title}</h4>
              <p>{tip.body}</p>
            </div>
          ))}
          {(TYPE_TIPS[loanType] || []).map((tip) => (
            <div key={tip.title} className="loan-tip-card specific">
              <h4>{tip.title}</h4>
              <p>{tip.body}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="loan-note">
        Standard fixed-rate amortization -- assumes one constant interest rate for the whole term (no rate changes,
        common with variable-rate loans), and doesn't include fees, insurance, rates & taxes, or bond registration
        costs. Educational estimate only, not a loan offer -- confirm actual figures with your lender.
      </p>
    </div>
  );
};

export default LoanCalculator;
