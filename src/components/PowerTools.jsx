// src/components/PowerTools.jsx
import React, { useState } from 'react';
import './PowerTools.css';
import Term from './Term';
import { MAX_YEARS_TO_SEARCH, yearsToReachTarget, simulateDebtFirst, simulateInvestFirst, simulateDrawdown } from '../powerToolsEngine';
import { savePlanSection } from '../utils/planStorage';
import { calculateCompoundInterest } from '../engine';

const PowerTools = ({ country, initial, monthly, rate, years = 20, inflation, wrapper, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [] }) => {
  const [annualExpenses, setAnnualExpenses] = useState(0);
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const [fireSaved, setFireSaved] = useState(false);

  const [debtAmount, setDebtAmount] = useState(0);
  const [debtRate, setDebtRate] = useState(0);
  const [extraMonthly, setExtraMonthly] = useState(0);

  const [drawdownBalance, setDrawdownBalance] = useState(0);
  const [drawdownWithdrawal, setDrawdownWithdrawal] = useState(0);
  const [drawdownReturn, setDrawdownReturn] = useState(5);
  const [drawdownYears, setDrawdownYears] = useState(30);

  // A lump-sum-only, no-monthly-contribution version of the same compounding engine
  // the rest of the app uses -- the plain "how much interest will a savings account
  // deposit earn" question, without the Calculator tab's country/wrapper/inflation/
  // scenario machinery around it.
  const [savingsDeposit, setSavingsDeposit] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);
  const [savingsYears, setSavingsYears] = useState(1);
  const [savingsFrequency, setSavingsFrequency] = useState(12);

  const safeWithdrawalRate = withdrawalRate > 0 ? withdrawalRate : 0.01;
  const fireNumber = annualExpenses / (safeWithdrawalRate / 100);
  const yearsToFire = yearsToReachTarget({
    initial, monthly, rate, inflation, taxRate: country.taxRate, wrapper, target: fireNumber, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit,
    contributionIncreaseRate: contributionIncrease, lumpSums
  });

  // Tax-aware comparison: a wrapper (or a country with no tax on gains) means the
  // investment side keeps its full nominal return; otherwise only the after-tax return
  // is actually available to compare against the debt's (guaranteed, untaxed) rate.
  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';
  const afterTaxReturn = (wrapper && hasWrapper) ? rate : rate * (1 - country.taxRate / 100);
  const debtIsWorse = debtRate > afterTaxReturn;

  const horizonMonths = Math.max(1, Math.round((years || 20) * 12));
  const debtFirst = simulateDebtFirst({ debtAmount, debtRate, extraMonthly, afterTaxReturn, months: horizonMonths });
  const investFirst = simulateInvestFirst({ debtAmount, debtRate, extraMonthly, afterTaxReturn, months: horizonMonths });
  const netWorthDebtFirst = debtFirst.investment - debtFirst.debtRemaining;
  const netWorthInvestFirst = investFirst.investment - investFirst.debtRemaining;

  const drawdown = simulateDrawdown({
    startingBalance: drawdownBalance, annualWithdrawal: drawdownWithdrawal, returnRate: drawdownReturn,
    inflation: inflation || 0, years: drawdownYears
  });
  const drawdownWithdrawalRate = drawdownBalance > 0 ? (drawdownWithdrawal / drawdownBalance) * 100 : 0;

  // years=0 would make calculateCompoundInterest's loop never run -- clamp only for the
  // calculation, same guard Invest.jsx/Coach.jsx use for the same failure mode.
  const safeSavingsYears = savingsYears > 0 ? savingsYears : 1;
  const savingsBeforeTax = calculateCompoundInterest({
    initial: savingsDeposit, monthly: 0, rate: savingsRate, years: safeSavingsYears, inflation: 0,
    taxRate: 0, wrapper: false, compoundFrequency: savingsFrequency
  });
  const savingsAfterTax = calculateCompoundInterest({
    initial: savingsDeposit, monthly: 0, rate: savingsRate, years: safeSavingsYears, inflation: 0,
    taxRate: country.taxRate, wrapper: false, compoundFrequency: savingsFrequency
  });

  const saveFirePlan = () => {
    savePlanSection('fire', {
      savedAt: new Date().toISOString(),
      annualExpenses,
      withdrawalRate,
      fireNumber,
      yearsToFire
    });
    setFireSaved(true);
    setTimeout(() => setFireSaved(false), 2000);
  };

  return (
    <div className="card power-tools">
      <div className="power-header">
        <h2>🛠️ Power Tools</h2>
        <p>Quick-fire calculators that use your current calculator inputs as the baseline.</p>
      </div>

      <div className="power-tool-card">
        <h3>🔥 <Term k="fireNumber">FIRE Number</Term> Calculator</h3>
        <p className="power-tool-desc">Financial Independence, Retire Early -- how big a pot do you need, and how long until you get there?</p>
        <div className="power-form">
          <div className="form-group">
            <label>Annual Expenses ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={annualExpenses} onChange={(e) => setAnnualExpenses(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="safeWithdrawalRate">Safe Withdrawal Rate</Term> (%)</label>
            <input type="number" min="1" max="10" step="0.1" value={withdrawalRate} onChange={(e) => setWithdrawalRate(Number(e.target.value))} />
          </div>
        </div>
        <div className="power-result">
          <div className="power-stat">
            <span>Your FIRE Number</span>
            <strong>{country.symbol} {Math.round(fireNumber).toLocaleString()}</strong>
          </div>
          <div className="power-stat">
            <span>Years to FIRE at Current Plan</span>
            <strong className={yearsToFire === null ? 'warn' : 'positive'}>
              {yearsToFire === null ? `Not within ${MAX_YEARS_TO_SEARCH} years` : `${yearsToFire} years`}
            </strong>
          </div>
        </div>
        <p className="power-tool-note">
          Assumes your {rate}% return and {annualExpenses.toLocaleString()} expenses stay constant every year
          (no raises, no lifestyle inflation) -- treat this as a rough target, not a guarantee.
        </p>
        {annualExpenses > 0 && (
          <button className="power-save-plan-btn" onClick={saveFirePlan}>
            {fireSaved ? '✓ Saved to My Plan' : '💾 Save This Plan'}
          </button>
        )}
      </div>

      <div className="power-tool-card">
        <h3>⚖️ Debt vs. Investment Showdown</h3>
        <p className="power-tool-desc">Extra cash available each month -- pay down debt, or invest it? Tax-aware verdict, plus a side-by-side {years}-year projection of both paths.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Outstanding Debt ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={debtAmount} onChange={(e) => setDebtAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Debt Interest Rate (%)</label>
            <input type="number" min="0" step="0.1" value={debtRate} onChange={(e) => setDebtRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Extra Cash Available ({country.symbol}/mo)</label>
            <input type="number" min="0" step="50" value={extraMonthly} onChange={(e) => setExtraMonthly(Number(e.target.value))} />
          </div>
        </div>
        <div className={`power-verdict ${debtIsWorse ? 'debt' : 'invest'}`}>
          {debtIsWorse
            ? `Pay off the debt first. At ${debtRate}% interest, clearing it is a guaranteed ${debtRate}% return -- better than the ${afterTaxReturn.toFixed(1)}% your investing actually keeps${wrapper && hasWrapper ? '' : ` after ${country.name}'s ${country.taxRate}% tax on gains`}.`
            : `Investing extra cash looks better here. Your investing keeps ${afterTaxReturn.toFixed(1)}%${wrapper && hasWrapper ? ' (sheltered from tax)' : ` after ${country.name}'s ${country.taxRate}% tax`} -- still ahead of the ${debtRate}% you'd save paying down debt early.`}
        </div>
        {debtAmount > 0 && extraMonthly > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Net worth in {years}yr, debt first</span>
                <strong className="positive">{country.symbol} {Math.round(netWorthDebtFirst).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Net worth in {years}yr, invest instead</span>
                <strong className={netWorthInvestFirst > netWorthDebtFirst ? 'positive' : 'warn'}>{country.symbol} {Math.round(netWorthInvestFirst).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              "Debt first" pays {country.symbol}{extraMonthly.toLocaleString()}/mo onto the debt
              {debtFirst.clearedAtMonth ? ` (clear in ${debtFirst.clearedAtMonth} months)` : ` (not fully cleared within ${years} years at this rate)`},
              then invests the freed-up amount. "Invest instead" is the worst-case contrast -- the debt gets zero payments
              and compounds untouched for the full {years} years while all {country.symbol}{extraMonthly.toLocaleString()}/mo goes into investing.
              Real life is rarely one extreme or the other, but the gap between these two numbers is the real cost of the choice.
            </p>
          </>
        )}
      </div>

      <div className="power-tool-card">
        <h3>🏖️ Retirement Drawdown Simulator</h3>
        <p className="power-tool-desc">Once you stop contributing and start withdrawing, does the pot actually last?</p>
        <div className="power-form">
          <div className="form-group">
            <label>Starting Balance ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={drawdownBalance} onChange={(e) => setDrawdownBalance(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Annual Withdrawal ({country.symbol}, today's money)</label>
            <input type="number" min="0" step="1000" value={drawdownWithdrawal} onChange={(e) => setDrawdownWithdrawal(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Expected Return in Retirement (%)</label>
            <input type="number" step="0.1" value={drawdownReturn} onChange={(e) => setDrawdownReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Retirement Length (years)</label>
            <input type="number" min="1" max="60" value={drawdownYears} onChange={(e) => setDrawdownYears(Number(e.target.value))} />
          </div>
        </div>
        {fireNumber > 0 && (
          <button type="button" className="power-use-fire-btn" onClick={() => setDrawdownBalance(Math.round(fireNumber))}>
            Use my FIRE number above ({country.symbol} {Math.round(fireNumber).toLocaleString()})
          </button>
        )}
        {drawdownBalance > 0 && drawdownWithdrawal > 0 && (
          <>
            <div className={`power-verdict ${drawdown.depleted ? 'danger' : 'invest'}`}>
              {drawdown.depleted
                ? `This runs out after ${drawdown.lastedYears} years -- ${drawdownYears - drawdown.lastedYears} years short of your ${drawdownYears}-year target. Withdrawing ${drawdownWithdrawalRate.toFixed(1)}% of the starting balance in year 1 (escalated ${inflation || 0}%/yr for inflation) is too aggressive at a ${drawdownReturn}% return.`
                : `This lasts the full ${drawdownYears} years, ending with ${country.symbol} ${Math.round(drawdown.endingBalance).toLocaleString()} left over. Starting withdrawal rate: ${drawdownWithdrawalRate.toFixed(1)}%.`}
            </div>
            <p className="power-tool-note">
              Straight-line projection, not a Monte Carlo -- assumes a constant {drawdownReturn}% return every single year in
              retirement with no bad sequence-of-returns years, and withdrawals that grow with inflation ({inflation || 0}%/yr)
              to hold their real spending power. See the Monte Carlo tab for a range of outcomes instead of one number.
            </p>
          </>
        )}
      </div>

      <div className="power-tool-card">
        <h3>🏦 Savings Account Interest Calculator</h3>
        <p className="power-tool-desc">How much interest will a lump sum sitting in a savings account actually earn -- no monthly deposits, just the deposit itself compounding.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Deposit Amount ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={savingsDeposit} onChange={(e) => setSavingsDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Annual Interest Rate (%)</label>
            <input type="number" min="0" step="0.1" value={savingsRate} onChange={(e) => setSavingsRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Term (years)</label>
            <input type="number" min="1" max="50" value={savingsYears} onChange={(e) => setSavingsYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="compoundingFrequency">Compounding Frequency</Term></label>
            <select value={savingsFrequency} onChange={(e) => setSavingsFrequency(Number(e.target.value))}>
              <option value="1">Annually</option>
              <option value="2">Semi-Annually</option>
              <option value="4">Quarterly</option>
              <option value="12">Monthly</option>
              <option value="365">Daily</option>
            </select>
          </div>
        </div>
        {savingsDeposit > 0 && (
          <div className="power-verdict-grid">
            <div className="power-stat">
              <span>Final Balance</span>
              <strong className="positive">{country.symbol} {savingsAfterTax.finalBalance.toLocaleString()}</strong>
            </div>
            <div className="power-stat">
              <span>Interest Earned (before tax)</span>
              <strong>{country.symbol} {savingsBeforeTax.totalInterest.toLocaleString()}</strong>
            </div>
            <div className="power-stat">
              <span>Interest Earned (after {country.name}'s {country.taxRate}% tax)</span>
              <strong className="positive">{country.symbol} {savingsAfterTax.totalInterest.toLocaleString()}</strong>
            </div>
          </div>
        )}
        <p className="power-tool-note">
          A single deposit compounding on its own, with no further contributions -- for a savings plan that also adds
          money every month, use the Calculator tab instead. Assumes a constant {savingsRate}% rate with no volatility,
          and taxes the interest at {country.name}'s flat {country.taxRate}% rate the same way the Calculator tab does
          outside of a {country.wrapperLabel} -- most savings accounts aren't eligible for that shelter.
        </p>
      </div>
    </div>
  );
};

export default PowerTools;
