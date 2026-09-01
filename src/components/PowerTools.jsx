// src/components/PowerTools.jsx
import React, { useState } from 'react';
import './PowerTools.css';
import Term from './Term';
import SubTabs from './SubTabs';
import { MAX_YEARS_TO_SEARCH, yearsToReachTarget, simulateDebtFirst, simulateInvestFirst, simulateDrawdown } from '../powerToolsEngine';
import { savePlanSection } from '../utils/planStorage';
import { calculateCompoundInterest } from '../engine';
import { calculateLoanAmortization } from '../loanAmortization';
import { maxLoanForPayment, estimateZaTransferDuty } from '../homeAffordability';
import { computeCoverGap } from '../insuranceNeeds';
import { projectEducationCost } from '../educationSavings';
import { solveMonthlyForGoal } from '../goalSolver';
import { calculateTakeHomePay } from '../salaryCalculator';
import { calculateDTI } from '../debtToIncome';
import { compareRentVsBuy } from '../rentVsBuy';
import { projectFutureCost, projectPurchasingPower } from '../futureCost';
import { computeCoastFire } from '../coastFire';
import { yearsToFinancialIndependence } from '../savingsRate';
import { analyzeCreditCard } from '../creditCardTrap';
import { ruleOf72 } from '../ruleOf72';
import { readJSONArray } from '../utils/storage';
import { convertAmount, countriesData } from '../data/countries';
import { DEBTS_KEY } from './DebtPayoff';
import { HISTORY_KEY as NETWORTH_HISTORY_KEY, isValidNetWorthEntry } from './NetWorth';

// Order here drives the sub-tab bar's order -- keep it matching the order the cards
// appear in below so "next tab" reads the same as "next card" used to.
const SUB_TABS = [
  { key: 'fire', label: '🔥 FIRE Number' },
  { key: 'debtVsInvest', label: '⚖️ Debt vs. Invest' },
  { key: 'drawdown', label: '🏖️ Drawdown' },
  { key: 'savings', label: '🏦 Savings Account' },
  { key: 'education', label: '🎓 Education Savings' },
  { key: 'affordability', label: '🏠 Home Affordability' },
  { key: 'insurance', label: '🛡️ Insurance Needs' },
  { key: 'salary', label: '💰 Take-Home Pay' },
  { key: 'dti', label: '📊 Debt-to-Income' },
  { key: 'rentVsBuy', label: '🏘️ Rent vs. Buy' },
  { key: 'futureCost', label: '📈 Future Cost' },
  { key: 'coastFire', label: '🌴 Coast FIRE' },
  { key: 'savingsRate', label: '⏱️ Savings Rate' },
  { key: 'cardTrap', label: '🪤 Card Min. Trap' },
  { key: 'fxConvert', label: '💱 Currency Convert' },
  { key: 'rule72', label: '⏳ Rule of 72' }
];

const PowerTools = ({ country, initial, monthly, rate, years = 20, inflation, wrapper, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState('fire');
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

  // country.typicalBankRate seeds a sensible starting guess for a bond rate -- a
  // one-time initializer, same spirit as the Calculator tab seeding its own state from
  // a shared-link URL at mount. Editable afterward like every other field here.
  const [affordIncome, setAffordIncome] = useState(0);
  const [affordExistingDebt, setAffordExistingDebt] = useState(0);
  const [affordDeposit, setAffordDeposit] = useState(0);
  const [affordRate, setAffordRate] = useState(country.typicalBankRate || 10);
  const [affordTermYears, setAffordTermYears] = useState(20);
  const [affordRatio, setAffordRatio] = useState(30);

  const [coverDebts, setCoverDebts] = useState(0);
  const [coverIncome, setCoverIncome] = useState(0);
  const [coverYears, setCoverYears] = useState(10);
  const [coverFinalExpenses, setCoverFinalExpenses] = useState(0);
  const [coverExistingCover, setCoverExistingCover] = useState(0);
  const [coverExistingSavings, setCoverExistingSavings] = useState(0);

  // Education costs have historically outpaced general CPI -- default a few points
  // above this country's typicalInflation as a starting guess, editable afterward.
  const [eduCurrentCost, setEduCurrentCost] = useState(0);
  const [eduYearsUntil, setEduYearsUntil] = useState(10);
  const [eduStudyYears, setEduStudyYears] = useState(4);
  const [eduInflation, setEduInflation] = useState(Math.round((country.typicalInflation || 5) + 3));
  const [eduAlreadySaved, setEduAlreadySaved] = useState(0);

  const [salaryGross, setSalaryGross] = useState(0);
  // Off by default, same reasoning as App.jsx's own progressiveTax toggle: the flat
  // country.taxRate keeps being what's used everywhere else in the app unless a user
  // opts in, and only the handful of countries with real taxBrackets data can use it.
  const [salaryProgressive, setSalaryProgressive] = useState(false);

  const [dtiIncome, setDtiIncome] = useState(0);
  const [dtiDebt, setDtiDebt] = useState(0);

  const [rvbHomePrice, setRvbHomePrice] = useState(0);
  const [rvbDownPayment, setRvbDownPayment] = useState(0);
  const [rvbMortgageRate, setRvbMortgageRate] = useState(country.typicalBankRate || 10);
  const [rvbTermYears, setRvbTermYears] = useState(20);
  const [rvbMonthlyExtras, setRvbMonthlyExtras] = useState(0);
  const [rvbAppreciation, setRvbAppreciation] = useState(Math.round(country.typicalInflation || 5));
  const [rvbMonthlyRent, setRvbMonthlyRent] = useState(0);
  const [rvbRentIncrease, setRvbRentIncrease] = useState(Math.round(country.typicalInflation || 5));

  const [futureCostAmount, setFutureCostAmount] = useState(0);
  const [futureCostYears, setFutureCostYears] = useState(10);
  const [futureCostInflation, setFutureCostInflation] = useState(Math.round(country.typicalInflation || 5));

  const [coastPot, setCoastPot] = useState(0);
  const [coastReturn, setCoastReturn] = useState(rate || 7);
  const [coastYears, setCoastYears] = useState(30);
  const [coastTarget, setCoastTarget] = useState(0); // 0 = fall back to the FIRE Number tab's figure

  const [srIncome, setSrIncome] = useState(0);
  const [srSpending, setSrSpending] = useState(0);
  const [srReturn, setSrReturn] = useState(5);

  const [cardBalance, setCardBalance] = useState(0);
  const [cardApr, setCardApr] = useState(0);
  const [cardMinPercent, setCardMinPercent] = useState(2.5);
  const [cardMinFloor, setCardMinFloor] = useState(0);
  const [cardFixedPayment, setCardFixedPayment] = useState(0);

  const [fxAmount, setFxAmount] = useState(0);
  const [fxFrom, setFxFrom] = useState(country.code);
  const [fxTo, setFxTo] = useState(country.code === 'us' ? 'gb' : 'us');

  const [r72Rate, setR72Rate] = useState(rate || 7);
  const [r72Years, setR72Years] = useState(20);

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

  // Home/Bond Affordability: cap total monthly debt service (bond + whatever's already
  // owed elsewhere) at affordRatio% of gross income -- a common lender guideline -- then
  // solve for the largest bond that payment can service (maxLoanForPayment is the exact
  // inverse of calculateLoanAmortization's forward principal-to-payment formula).
  const maxTotalDebtPayment = affordIncome * (affordRatio / 100);
  const maxBondPayment = Math.max(0, maxTotalDebtPayment - affordExistingDebt);
  const maxBondAmount = maxLoanForPayment({ payment: maxBondPayment, annualRate: affordRate, termYears: affordTermYears });
  const maxHomePrice = maxBondAmount + affordDeposit;
  const affordAmort = calculateLoanAmortization({ principal: maxBondAmount, annualRate: affordRate, termYears: affordTermYears });
  const zaTransferDuty = country.code === 'za' && maxHomePrice > 0 ? estimateZaTransferDuty(maxHomePrice) : null;

  // Total of the minimum monthly repayments across every still-owed debt saved in the
  // Debt Payoff tab -- the figure both the Home Affordability and Debt-to-Income "pull
  // from Debt Payoff" buttons drop in, computed once here rather than fetched and
  // reduced twice.
  const savedDebtMinPaymentTotal = () => Math.round(
    readJSONArray(DEBTS_KEY).filter(d => d.balance > 0).reduce((sum, d) => sum + (d.minPayment || 0), 0)
  );
  const pullExistingDebtPayments = () => setAffordExistingDebt(savedDebtMinPaymentTotal());

  // Insurance Needs (Life Cover Gap): needs-based method -- outstanding debts, a chosen
  // number of years of income replacement, and final expenses, minus cover/savings
  // already in place.
  const coverResult = computeCoverGap({
    outstandingDebts: coverDebts,
    annualIncomeToReplace: coverIncome,
    yearsOfReplacement: coverYears,
    finalExpenses: coverFinalExpenses,
    existingCover: coverExistingCover,
    existingSavings: coverExistingSavings
  });

  const pullOutstandingDebtBalance = () => {
    const debts = readJSONArray(DEBTS_KEY);
    const total = debts.filter(d => d.balance > 0).reduce((sum, d) => sum + (d.balance || 0), 0);
    setCoverDebts(Math.round(total));
  };

  // Uses Net Worth's own last saved snapshot -- converted from whichever currency it
  // was saved in, same as Dashboard.jsx does for the identical stored history, so
  // switching currency doesn't silently mislabel an unconverted figure.
  const pullSavingsFromNetWorth = () => {
    const history = readJSONArray(NETWORTH_HISTORY_KEY).filter(isValidNetWorthEntry);
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const assets = last.totalAssets ?? last.netWorth;
    setCoverExistingSavings(Math.round(convertAmount(assets, last.displayCurrency || country.code, country.code)));
  };

  // Education Savings Goal: inflate the cost of each study year separately (fees due
  // further out have longer to compound), sum to one lump-sum-by-enrollment target,
  // then reuse the same monthly-contribution solver Invest.jsx's goals use. inflation
  // is passed as 0 here (not this.inflation) since the target amount is already a
  // nominal future figure -- goalSolver's own `inflation` param would double-count it.
  const eduProjection = projectEducationCost({
    currentAnnualCost: eduCurrentCost, yearsUntilEnrollment: eduYearsUntil, studyYears: eduStudyYears, educationInflationRate: eduInflation
  });
  const safeEduYearsUntil = eduYearsUntil > 0 ? eduYearsUntil : 1;
  const eduRequiredMonthly = solveMonthlyForGoal({
    startingAmount: eduAlreadySaved, rate, years: safeEduYearsUntil, inflation: 0, taxRate: country.taxRate, wrapper,
    goalAmount: eduProjection.totalFutureCost, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit,
    // Match Invest.jsx's goal solve -- both "monthly needed for a goal" surfaces should
    // honour the Calculator's annual contribution-increase setting the same way.
    contributionIncreaseRate: contributionIncrease
  });

  // Take-Home Pay: reuses engine.js's taxOwedAtBrackets (via salaryCalculator.js) for
  // the few countries with real progressive personal brackets, otherwise the flat
  // country.taxRate every other tool in the app already uses.
  const takeHome = calculateTakeHomePay({
    grossAnnual: salaryGross,
    taxRate: country.taxRate,
    taxBrackets: (salaryProgressive && country.taxBrackets) ? country.taxBrackets : null
  });

  const dti = calculateDTI({ monthlyDebtPayments: dtiDebt, grossMonthlyIncome: dtiIncome });
  const pullDtiDebtPayments = () => setDtiDebt(savedDebtMinPaymentTotal());

  // Rent vs. Buy: defaults the invest-return side to this plan's own Calculator rate
  // and horizon (years) so "invest the difference instead" is compared at the same
  // return the rest of the app already assumes, not a second unrelated guess.
  const rentVsBuy = compareRentVsBuy({
    homePrice: rvbHomePrice, downPayment: rvbDownPayment, mortgageRate: rvbMortgageRate,
    mortgageTermYears: rvbTermYears, monthlyExtras: rvbMonthlyExtras, homeAppreciationRate: rvbAppreciation,
    monthlyRent: rvbMonthlyRent, rentIncreaseRate: rvbRentIncrease, investReturnRate: rate, years
  });

  const futureCost = projectFutureCost({ currentCost: futureCostAmount, years: futureCostYears, inflationRate: futureCostInflation });
  const purchasingPower = projectPurchasingPower({ currentAmount: futureCostAmount, years: futureCostYears, inflationRate: futureCostInflation });

  // Coast FIRE: target defaults to the FIRE Number tab's figure above unless the user
  // types their own, so filling in that tab first carries straight over here.
  const coastTargetEffective = coastTarget > 0 ? coastTarget : fireNumber;
  const coast = computeCoastFire({
    currentPortfolio: coastPot, annualReturn: coastReturn, yearsToRetirement: coastYears, fireNumber: coastTargetEffective
  });

  const savingsRateResult = yearsToFinancialIndependence({ takeHomeIncome: srIncome, annualSpending: srSpending, realReturn: srReturn });

  const cardResult = analyzeCreditCard({
    balance: cardBalance, apr: cardApr, minPercent: cardMinPercent, minFloor: cardMinFloor,
    fixedPayment: cardFixedPayment > 0 ? cardFixedPayment : undefined
  });

  const fxConverted = convertAmount(fxAmount, fxFrom, fxTo);
  const fxSymbol = (code) => (countriesData.find(c => c.code === code) || country).symbol;
  const fxCurrency = (code) => (countriesData.find(c => c.code === code) || country).currency;

  const r72 = ruleOf72({ annualRate: r72Rate, years: r72Years });

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

      <SubTabs tabs={SUB_TABS} active={activeSubTab} onChange={setActiveSubTab} ariaLabel="Power Tools calculator" />

      {activeSubTab === 'fire' && (
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
      )}

      {activeSubTab === 'debtVsInvest' && (
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
      )}

      {activeSubTab === 'drawdown' && (
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
      )}

      {activeSubTab === 'savings' && (
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
      )}

      {activeSubTab === 'education' && (
      <div className="power-tool-card">
        <h3>🎓 Education Savings Goal Calculator</h3>
        <p className="power-tool-desc">Education costs typically rise faster than general inflation -- this projects a realistic future cost across every year of study, then works out what to save monthly to cover it.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Current Annual Cost ({country.symbol}/yr, today's money)</label>
            <input type="number" min="0" step="1000" value={eduCurrentCost} onChange={(e) => setEduCurrentCost(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years Until Enrollment</label>
            <input type="number" min="0" max="30" value={eduYearsUntil} onChange={(e) => setEduYearsUntil(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years of Study</label>
            <input type="number" min="1" max="10" value={eduStudyYears} onChange={(e) => setEduStudyYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Education <Term k="inflation">Inflation</Term> Rate (%/yr)</label>
            <input type="number" min="0" step="0.1" value={eduInflation} onChange={(e) => setEduInflation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Already Saved ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={eduAlreadySaved} onChange={(e) => setEduAlreadySaved(Number(e.target.value))} />
          </div>
        </div>
        {eduCurrentCost > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Total Future Cost ({eduStudyYears}yr of study)</span>
                <strong className="warn">{country.symbol} {Math.round(eduProjection.totalFutureCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                {/* When enrollment is this year (eduYearsUntil === 0), there's no runway left to
                    save monthly -- solveMonthlyForGoal still needs a >0 "years" to converge (see
                    safeEduYearsUntil above), but showing that fudged monthly figure here would
                    understate what's actually needed and imply a full year still exists. Show the
                    honest lump-sum-needed-now figure instead in that case. */}
                <span>{eduYearsUntil > 0 ? 'You Need to Save (per month)' : 'Needed Now (enrollment is this year)'}</span>
                <strong className="positive">
                  {country.symbol} {Math.round(eduYearsUntil > 0 ? eduRequiredMonthly : Math.max(0, eduProjection.totalFutureCost - eduAlreadySaved)).toLocaleString()}
                </strong>
              </div>
            </div>
            <p className="power-tool-note">
              Assumes fees rise {eduInflation}%/yr from today until each year of study is actually due (so later study
              years cost more than the first), and that this amount compounds at your {rate}% return
              {wrapper && hasWrapper ? ` inside a ${country.wrapperLabel}` : ` after ${country.name}'s ${country.taxRate}% tax on gains`} until enrollment. Once
              studying starts, this doesn't model drawing down the pot across those {eduStudyYears} years -- treat the
              total above as the lump sum that needs to be ready by day one.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'affordability' && (
      <div className="power-tool-card">
        <h3>🏠 Home/<Term k="bond">Bond</Term> Affordability Calculator</h3>
        <p className="power-tool-desc">Given your income and what you already pay toward other debt, how much home can you actually afford?</p>
        <div className="power-form">
          <div className="form-group">
            <label>Gross Monthly Income ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={affordIncome} onChange={(e) => setAffordIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Existing Monthly Debt Repayments ({country.symbol})</label>
            <input type="number" min="0" step="100" value={affordExistingDebt} onChange={(e) => setAffordExistingDebt(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Deposit Available ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={affordDeposit} onChange={(e) => setAffordDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Interest Rate (%)</label>
            <input type="number" min="0" step="0.1" value={affordRate} onChange={(e) => setAffordRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Loan Term (years)</label>
            <input type="number" min="1" max="30" value={affordTermYears} onChange={(e) => setAffordTermYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Affordability Ratio (% of gross income)</label>
            <input type="number" min="1" max="50" value={affordRatio} onChange={(e) => setAffordRatio(Number(e.target.value))} />
          </div>
        </div>
        <button type="button" className="power-use-fire-btn" onClick={pullExistingDebtPayments}>
          Pull existing debt repayments from Debt Payoff
        </button>
        {affordIncome > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Max Affordable Bond</span>
                <strong className="positive">{country.symbol} {Math.round(maxBondAmount).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Max Home Price (bond + deposit)</span>
                <strong className="positive">{country.symbol} {Math.round(maxHomePrice).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Monthly Repayment at Max</span>
                <strong>{country.symbol} {Math.round(maxBondPayment).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Total Interest Over {affordTermYears}yr Term</span>
                <strong className="warn">{country.symbol} {affordAmort.totalInterest.toLocaleString()}</strong>
              </div>
              {zaTransferDuty !== null && (
                <div className="power-stat">
                  <span><Term k="transferDuty">Estimated SA Transfer Duty</Term></span>
                  <strong className="warn">{country.symbol} {Math.round(zaTransferDuty).toLocaleString()}</strong>
                </div>
              )}
            </div>
            <p className="power-tool-note">
              Assumes {affordRatio}% of gross monthly income is the most that should go toward all debt repayments
              combined (bond + existing debt) -- a common lender guideline, not a guarantee of approval.{' '}
              {zaTransferDuty !== null
                ? "Transfer duty is on top of the price shown above and is a separate, illustrative estimate -- also budget for bond registration, conveyancing, and homeowner's insurance, none of which are modeled here."
                : "Transfer/stamp duty and other purchase costs vary by country and aren't modeled here -- budget for them separately."}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'insurance' && (
      <div className="power-tool-card">
        <h3>🛡️ Insurance Needs (<Term k="lifeCoverGap">Life Cover Gap</Term>) Calculator</h3>
        <p className="power-tool-desc">A needs-based estimate of how much life cover would actually be needed to protect dependents -- not a quote, just the math behind one.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Outstanding Debts to Clear ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={coverDebts} onChange={(e) => setCoverDebts(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Annual Income to Replace ({country.symbol}/yr)</label>
            <input type="number" min="0" step="1000" value={coverIncome} onChange={(e) => setCoverIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years of Income Replacement</label>
            <input type="number" min="0" max="40" value={coverYears} onChange={(e) => setCoverYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Final Expenses / Other Lump Needs ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={coverFinalExpenses} onChange={(e) => setCoverFinalExpenses(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Existing Life Cover ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={coverExistingCover} onChange={(e) => setCoverExistingCover(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Existing Savings/Investments Available ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={coverExistingSavings} onChange={(e) => setCoverExistingSavings(Number(e.target.value))} />
          </div>
        </div>
        <button type="button" className="power-use-fire-btn" onClick={pullOutstandingDebtBalance}>Pull debts from Debt Payoff</button>{' '}
        <button type="button" className="power-use-fire-btn" onClick={pullSavingsFromNetWorth}>Pull savings from Net Worth</button>
        {(coverDebts > 0 || coverIncome > 0) && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Total Cover Needed</span>
                <strong>{country.symbol} {Math.round(coverResult.totalNeed).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Offset by Existing Cover + Savings</span>
                <strong>{country.symbol} {Math.round(coverResult.offsets).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Recommended Additional Cover</span>
                <strong className={coverResult.coverGap > 0 ? 'warn' : 'positive'}>{country.symbol} {Math.round(coverResult.coverGap).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {coverResult.coverGap > 0
                ? `Based on what's entered, there's a ${country.symbol} ${Math.round(coverResult.coverGap).toLocaleString()} shortfall between what dependents would need and what's already in place.`
                : 'Existing cover and savings already meet the need entered above.'} Needs-based estimate only -- a real
              assessment also weighs age, health, dependents' ages, and future expenses like education, none of which
              are modeled here. Not financial or insurance advice.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'salary' && (
      <div className="power-tool-card">
        <h3>💰 Salary / Take-Home Pay Calculator</h3>
        <p className="power-tool-desc">What a gross annual income actually works out to after tax -- monthly, in your pocket.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Gross Annual Income ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={salaryGross} onChange={(e) => setSalaryGross(Number(e.target.value))} />
          </div>
          {country.taxBrackets && (
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={salaryProgressive} onChange={(e) => setSalaryProgressive(e.target.checked)} />
                {' '}Use {country.name}'s progressive tax brackets
              </label>
            </div>
          )}
        </div>
        {salaryGross > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Net Pay (monthly)</span>
                <strong className="positive">{country.symbol} {Math.round(takeHome.netMonthly).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Net Pay (annual)</span>
                <strong className="positive">{country.symbol} {Math.round(takeHome.netAnnual).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Tax Paid (annual)</span>
                <strong className="warn">{country.symbol} {Math.round(takeHome.tax).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Effective Tax Rate</span>
                <strong>{takeHome.effectiveRate.toFixed(1)}%</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {salaryProgressive && country.taxBrackets
                ? (country.taxBracketsNote || `${country.name}'s progressive bracket schedule -- illustrative only.`)
                : `Flat ${country.taxRate}% assumed on the full gross amount.`} Doesn't model deductions, rebates,
              social security/pension contributions, or medical aid credits -- a real payslip's net figure will
              differ. Not tax advice.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'dti' && (
      <div className="power-tool-card">
        <h3>📊 Debt-to-Income Ratio Calculator</h3>
        <p className="power-tool-desc">The metric a lender actually checks -- how much of gross income already goes toward debt repayments, before any new borrowing.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Gross Monthly Income ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={dtiIncome} onChange={(e) => setDtiIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Total Monthly Debt Repayments ({country.symbol})</label>
            <input type="number" min="0" step="100" value={dtiDebt} onChange={(e) => setDtiDebt(Number(e.target.value))} />
          </div>
        </div>
        <button type="button" className="power-use-fire-btn" onClick={pullDtiDebtPayments}>Pull existing debt repayments from Debt Payoff</button>
        {dtiIncome > 0 && (
          <>
            <div className={`power-verdict ${dti.band === 'healthy' || dti.band === 'manageable' ? 'invest' : 'debt'}`}>
              Debt-to-income ratio: {dti.ratio.toFixed(1)}% -- {dti.bandLabel}.
            </div>
            <p className="power-tool-note">
              Rough banding from common mortgage-lending guidelines: under 20% is considered healthy, 20-36%
              manageable, 36-43% getting stretched, and above 43% is where many lenders decline new credit outright.
              This is one overall ratio, not a lender's actual front-end/back-end underwriting calculation -- treat
              it as a gut-check, not a pre-approval.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'rentVsBuy' && (
      <div className="power-tool-card">
        <h3>🏘️ Rent vs. Buy Calculator</h3>
        <p className="power-tool-desc">Given a specific home, is buying it actually the better move over {years} years compared to renting and investing the difference?</p>
        <div className="power-form">
          <div className="form-group">
            <label>Home Price ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={rvbHomePrice} onChange={(e) => setRvbHomePrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Down Payment ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={rvbDownPayment} onChange={(e) => setRvbDownPayment(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Mortgage Rate (%)</label>
            <input type="number" min="0" step="0.1" value={rvbMortgageRate} onChange={(e) => setRvbMortgageRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Mortgage Term (years)</label>
            <input type="number" min="1" max="30" value={rvbTermYears} onChange={(e) => setRvbTermYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Other Monthly Home Costs ({country.symbol})</label>
            <input type="number" min="0" step="100" value={rvbMonthlyExtras} onChange={(e) => setRvbMonthlyExtras(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Home Appreciation (%/yr)</label>
            <input type="number" step="0.1" value={rvbAppreciation} onChange={(e) => setRvbAppreciation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Comparable Monthly Rent ({country.symbol})</label>
            <input type="number" min="0" step="100" value={rvbMonthlyRent} onChange={(e) => setRvbMonthlyRent(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Rent Increase (%/yr)</label>
            <input type="number" step="0.1" value={rvbRentIncrease} onChange={(e) => setRvbRentIncrease(Number(e.target.value))} />
          </div>
        </div>
        {rvbHomePrice > 0 && rvbMonthlyRent > 0 && (
          <>
            <div className={`power-verdict ${rentVsBuy.buyIsBetter ? 'invest' : 'debt'}`}>
              {rentVsBuy.buyIsBetter
                ? `Buying wins here. After ${years} years, home equity (${country.symbol} ${Math.round(rentVsBuy.finalBuyEquity).toLocaleString()}) beats renting and investing the difference at ${rate}% (${country.symbol} ${Math.round(rentVsBuy.finalRentPortfolio).toLocaleString()}).`
                : `Renting and investing wins here. After ${years} years, that portfolio (${country.symbol} ${Math.round(rentVsBuy.finalRentPortfolio).toLocaleString()}) beats home equity (${country.symbol} ${Math.round(rentVsBuy.finalBuyEquity).toLocaleString()}).`}
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Monthly Cost to Buy (bond + extras)</span>
                <strong>{country.symbol} {Math.round(rentVsBuy.monthlyBuyPayment).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Home Equity after {years}yr</span>
                <strong className={rentVsBuy.buyIsBetter ? 'positive' : ''}>{country.symbol} {Math.round(rentVsBuy.finalBuyEquity).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Rent + Invest Portfolio after {years}yr</span>
                <strong className={!rentVsBuy.buyIsBetter ? 'positive' : ''}>{country.symbol} {Math.round(rentVsBuy.finalRentPortfolio).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              The rent side invests the down payment upfront, then invests the gap whenever buying would cost more
              per month than renting, all at your {rate}% Calculator rate. Doesn't model selling costs, transfer
              duty, maintenance beyond the monthly figure entered, or tax on investment gains outside a wrapper -- a
              rough comparison of the two paths' trajectories, not a purchase recommendation.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'futureCost' && (
      <div className="power-tool-card">
        <h3>📈 Future Cost of Living Calculator</h3>
        <p className="power-tool-desc">What a today's-money cost will actually be after years of inflation -- and what today's money will be worth by comparison.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Cost / Amount Today ({country.symbol})</label>
            <input type="number" min="0" step="100" value={futureCostAmount} onChange={(e) => setFutureCostAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years</label>
            <input type="number" min="0" max="60" value={futureCostYears} onChange={(e) => setFutureCostYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="inflation">Inflation</Term> Rate (%/yr)</label>
            <input type="number" step="0.1" value={futureCostInflation} onChange={(e) => setFutureCostInflation(Number(e.target.value))} />
          </div>
        </div>
        {futureCostAmount > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Future Cost in {futureCostYears}yr</span>
                <strong className="warn">{country.symbol} {Math.round(futureCost.futureCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Increase</span>
                <strong className="warn">+{futureCost.percentIncrease.toFixed(0)}%</strong>
              </div>
              <div className="power-stat">
                <span>Today's {country.symbol}{futureCostAmount.toLocaleString()} in {futureCostYears}yr's real terms</span>
                <strong className="warn">{country.symbol} {Math.round(purchasingPower.realValue).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              Two sides of the same {futureCostInflation}%/yr inflation assumption: the top figure is what this
              cost will actually be charged as in {futureCostYears} years; the bottom is what today's{' '}
              {country.symbol}{futureCostAmount.toLocaleString()} would be worth if it just sat still, in today's
              purchasing power. Same math the Calculator tab's "Real Value" column already applies to your
              investment balance.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'coastFire' && (
      <div className="power-tool-card">
        <h3>🌴 Coast FIRE Calculator</h3>
        <p className="power-tool-desc">Have you already saved enough that you could stop contributing entirely and still hit your retirement number from growth alone?</p>
        <div className="power-form">
          <div className="form-group">
            <label>Current Invested Portfolio ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={coastPot} onChange={(e) => setCoastPot(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Expected Annual Return (%)</label>
            <input type="number" step="0.1" value={coastReturn} onChange={(e) => setCoastReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years Until Retirement</label>
            <input type="number" min="0" max="60" value={coastYears} onChange={(e) => setCoastYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Retirement Target ({country.symbol}){coastTarget === 0 && fireNumber > 0 ? ' — using your FIRE Number' : ''}</label>
            <input type="number" min="0" step="100000" value={coastTarget} onChange={(e) => setCoastTarget(Number(e.target.value))} placeholder={fireNumber > 0 ? Math.round(fireNumber).toLocaleString() : '0'} />
          </div>
        </div>
        {coastPot > 0 && coastTargetEffective > 0 && (
          <>
            <div className={`power-verdict ${coast.hasCoasted ? 'invest' : 'debt'}`}>
              {coast.hasCoasted
                ? `You've hit Coast FIRE. Left untouched at ${coastReturn}%, today's ${country.symbol} ${Math.round(coastPot).toLocaleString()} grows to ${country.symbol} ${Math.round(coast.projectedAtRetirement).toLocaleString()} in ${coastYears} years — ${country.symbol} ${Math.round(coast.surplusAtRetirement).toLocaleString()} past your ${country.symbol} ${Math.round(coastTargetEffective).toLocaleString()} target. Further saving is optional.`
                : `Not there yet. Today's ${country.symbol} ${Math.round(coastPot).toLocaleString()} grows to ${country.symbol} ${Math.round(coast.projectedAtRetirement).toLocaleString()} in ${coastYears} years — you'd need ${country.symbol} ${Math.round(coast.coastNumber).toLocaleString()} invested today to coast, a ${country.symbol} ${Math.round(coast.shortfallToday).toLocaleString()} gap.`}
            </div>
            <p className="power-tool-note">
              Assumes a flat {coastReturn}% return every year with zero further contributions and no tax drag on the way
              — a milestone marker, not a plan to actually stop saving. "Retirement Target" defaults to your FIRE Number
              tab figure; type a number to override it.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'savingsRate' && (
      <div className="power-tool-card">
        <h3>⏱️ Savings Rate → Years to Financial Independence</h3>
        <p className="power-tool-desc">The "shockingly simple math": how many years to FI depends far more on what fraction of your pay you keep than on how much you earn.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Annual Take-Home Income ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={srIncome} onChange={(e) => setSrIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Annual Spending ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={srSpending} onChange={(e) => setSrSpending(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Real (after-inflation) Return (%)</label>
            <input type="number" step="0.1" value={srReturn} onChange={(e) => setSrReturn(Number(e.target.value))} />
          </div>
        </div>
        {srIncome > 0 && srSpending > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Savings Rate</span>
                <strong className={savingsRateResult.savingsRate >= 20 ? 'positive' : 'warn'}>{savingsRateResult.savingsRate.toFixed(0)}%</strong>
              </div>
              <div className="power-stat">
                <span>Years to Financial Independence</span>
                <strong className={savingsRateResult.years === null ? 'warn' : 'positive'}>
                  {savingsRateResult.years === null ? 'Never at this rate' : `${savingsRateResult.years} years`}
                </strong>
              </div>
              <div className="power-stat">
                <span>FI Number (25× spending)</span>
                <strong>{country.symbol} {Math.round(savingsRateResult.fiNumber).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              Starts from zero invested, contributes the {country.symbol} {Math.round(savingsRateResult.annualSaving).toLocaleString()}/yr
              surplus at the end of each year, grows it at {srReturn}% real, and stops when the pot hits 25× your spending
              (the 4% rule). Ignores any portfolio you already have, taxes, and future spending changes — the point is the
              shape of the curve, not a dated forecast.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'cardTrap' && (
      <div className="power-tool-card">
        <h3>🪤 Credit Card Minimum-Payment Trap</h3>
        <p className="power-tool-desc">Paying only the minimum on one card — because the required amount shrinks with the balance — can stretch payoff over decades. See how much, and what a fixed payment does instead.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Card Balance ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={cardBalance} onChange={(e) => setCardBalance(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Annual Interest Rate / APR (%)</label>
            <input type="number" min="0" step="0.1" value={cardApr} onChange={(e) => setCardApr(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Minimum Payment (% of balance)</label>
            <input type="number" min="0.1" step="0.5" value={cardMinPercent} onChange={(e) => setCardMinPercent(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Minimum Payment Floor ({country.symbol})</label>
            <input type="number" min="0" step="50" value={cardMinFloor} onChange={(e) => setCardMinFloor(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Compare: Fixed Payment ({country.symbol}/mo, optional)</label>
            <input type="number" min="0" step="100" value={cardFixedPayment} onChange={(e) => setCardFixedPayment(Number(e.target.value))} />
          </div>
        </div>
        {cardBalance > 0 && cardApr > 0 && (
          <>
            <div className={`power-verdict ${cardResult.minimumOnly?.neverPaysOff ? 'danger' : 'debt'}`}>
              {cardResult.minimumOnly?.neverPaysOff
                ? `At ${cardApr}% APR, the minimum payment here never even covers the monthly interest — the balance grows forever. This is the trap in its worst form.`
                : `Paying only the minimum clears this in ${cardResult.minimumOnly.months} months (${Math.round(cardResult.minimumOnly.months / 12)} years) and costs ${country.symbol} ${Math.round(cardResult.minimumOnly.totalInterest).toLocaleString()} in interest — ${country.symbol} ${Math.round(cardResult.minimumOnly.totalPaid).toLocaleString()} paid on a ${country.symbol} ${Math.round(cardBalance).toLocaleString()} balance.`}
            </div>
            {cardResult.fixed && !cardResult.fixed.neverPaysOff && (
              <div className="power-verdict-grid">
                <div className="power-stat">
                  <span>Fixed {country.symbol}{Math.round(cardFixedPayment).toLocaleString()}/mo — payoff</span>
                  <strong className="positive">{cardResult.fixed.months} months</strong>
                </div>
                <div className="power-stat">
                  <span>Fixed payment — total interest</span>
                  <strong className="positive">{country.symbol} {Math.round(cardResult.fixed.totalInterest).toLocaleString()}</strong>
                </div>
                <div className="power-stat">
                  <span>Interest saved vs. minimum</span>
                  <strong className="positive">{country.symbol} {Math.round(Math.max(0, cardResult.minimumOnly.totalInterest - cardResult.fixed.totalInterest)).toLocaleString()}</strong>
                </div>
              </div>
            )}
            {cardResult.fixed?.neverPaysOff && (
              <p className="power-tool-note">The fixed payment entered doesn't cover the monthly interest either — raise it above {country.symbol} {Math.round(cardBalance * cardApr / 100 / 12).toLocaleString()}/mo to make any progress.</p>
            )}
            <p className="power-tool-note">
              The minimum is modeled as the greater of {cardMinPercent}% of the current balance and the {country.symbol}{Math.round(cardMinFloor).toLocaleString()} floor,
              recalculated every month as the balance falls. Real card terms vary (some add a fixed fee, some a flat
              1% + interest) — check your statement. For juggling several debts at once, use the Debt Payoff tab.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'fxConvert' && (
      <div className="power-tool-card">
        <h3>💱 Currency Converter</h3>
        <p className="power-tool-desc">A quick conversion between any two of the {countriesData.length} currencies this app models — using the same indicative rate table the Net Worth FX tools use.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Amount</label>
            <input type="number" min="0" step="100" value={fxAmount} onChange={(e) => setFxAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>From</label>
            <select value={fxFrom} onChange={(e) => setFxFrom(e.target.value)}>
              {countriesData.map(c => <option key={c.code} value={c.code}>{c.currency} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>To</label>
            <select value={fxTo} onChange={(e) => setFxTo(e.target.value)}>
              {countriesData.map(c => <option key={c.code} value={c.code}>{c.currency} — {c.name}</option>)}
            </select>
          </div>
        </div>
        {fxAmount > 0 && (
          <>
            <div className="power-verdict invest">
              {fxSymbol(fxFrom)}{Math.round(fxAmount).toLocaleString()} {fxCurrency(fxFrom)} ≈ {fxSymbol(fxTo)}{Math.round(fxConverted).toLocaleString()} {fxCurrency(fxTo)}
            </div>
            <p className="power-tool-note">
              Indicative only. The exchange-rate table in this app is spot-checked periodically, not live — FX moves
              constantly, so treat this as an order-of-magnitude comparison, never a dealing rate. Banks and money
              transfer services also add a spread and fees this doesn't model.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'rule72' && (
      <div className="power-tool-card">
        <h3>⏳ Rule of 72 — Doubling Time</h3>
        <p className="power-tool-desc">The mental-math shortcut: divide 72 by your return to estimate how many years an amount takes to double. Shown here against the exact figure.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Annual Return (%)</label>
            <input type="number" step="0.1" value={r72Rate} onChange={(e) => setR72Rate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Over How Many Years</label>
            <input type="number" min="0" max="80" value={r72Years} onChange={(e) => setR72Years(Number(e.target.value))} />
          </div>
        </div>
        {r72Rate > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Rule of 72 estimate</span>
                <strong>{r72.approxDoublingYears.toFixed(1)} years to double</strong>
              </div>
              <div className="power-stat">
                <span>Exact doubling time</span>
                <strong className="positive">{r72.exactDoublingYears.toFixed(1)} years</strong>
              </div>
              <div className="power-stat">
                <span>Growth over {r72Years} years</span>
                <strong className="positive">{r72.growthMultiple.toFixed(1)}× (≈{r72.doublingsOverPeriod.toFixed(1)} doublings)</strong>
              </div>
            </div>
            <p className="power-tool-note">
              The "72" trick is a rough approximation that's closest around 6–10% — the exact answer is
              ln(2) ÷ ln(1 + rate). Growth multiple assumes the return compounds every year with nothing added or
              withdrawn. Nominal figures: at a real (after-inflation) return, the doubling is in purchasing power.
            </p>
          </>
        )}
      </div>
      )}
    </div>
  );
};

export default PowerTools;
