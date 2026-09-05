// src/components/PowerTools.jsx
import React, { useState, useEffect } from 'react';
import './PowerTools.css';
import Term from './Term';
import SubTabs from './SubTabs';
import { MAX_YEARS_TO_SEARCH, yearsToReachTarget, simulateDebtFirst, simulateInvestFirst, simulateDrawdown } from '../powerToolsEngine';
import { savePlanSection, monthsToYearsLabel } from '../utils/planStorage';
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
import { dividendIncome } from '../dividendIncome';
import { carOwnershipCost } from '../carCost';
import { lifetimeRaiseValue } from '../raiseValue';
import { pretaxRetirementBoost } from '../pretaxRetirement';
import { sinkingFundPlan } from '../sinkingFund';
import { emergencyRunway } from '../emergencyRunway';
import { compareCompoundingFrequencies } from '../compoundingComparison';
import { budgetRuleCheck } from '../budgetRule';
import { allocateWindfall } from '../windfallAllocator';
import { marginalTaxAnalysis } from '../marginalTax';
import { rateSensitivity } from '../rateSensitivity';
import { raiseForInflation } from '../raiseForInflation';
import { feeDragAnalysis } from '../feeDrag';
import { nominalToEffective, effectiveToNominal } from '../effectiveRate';
import { leaseVsBuy } from '../leaseVsBuy';
import { baristaFireNumber } from '../baristaFire';
import { retirementIncomeGap, monthsToCloseGap } from '../retirementGap';
import { depositSavingsTimeline } from '../depositTimeline';
import { realReturn } from '../realReturn';
import { compareDebtConsolidation } from '../debtConsolidation';
import { estimateHomePurchaseCosts } from '../homePurchaseCosts';
import { bonusTakeHome } from '../bonusTax';
import { optimiseRaContribution } from '../raOptimizer';
import { analyseSequenceRisk } from '../sequenceRisk';
import { analyseTwoPotWithdrawal } from '../twoPotWithdrawal';
import { sarsTaxYear } from '../sarsTaxYear';
import { compareLoanOffers } from '../loanComparison';
import { subscriptionCost } from '../subscriptionCost';
import { analysePayback } from '../paybackPeriod';
import { compareBuyCashVsFinance } from '../buyCashVsFinance';
import { compareFundFees } from '../fundFeeComparison';
import { contractorRate } from '../contractorRate';
import { addVat, extractVat } from '../vatCalculator';
import { estimateCapitalGainsTax, CGT_ANNUAL_EXCLUSION, CGT_INCLUSION_RATE_INDIVIDUAL } from '../capitalGainsTax';
import { readJSONArray } from '../utils/storage';
import { convertAmount } from '../data/countries';
import { DEBTS_KEY } from './DebtPayoff';
import { HISTORY_KEY as NETWORTH_HISTORY_KEY, isValidNetWorthEntry } from './NetWorth';

// Order here drives the sub-tab bar's order -- keep it matching the order the cards
// appear in below so "next tab" reads the same as "next card" used to.
// tier: 'Ultra' marks the advanced retirement & tax-strategy tools -- these stay
// visible (with a padlock) for Pro users but open the pricing modal instead of the
// calculator. Everything else is included with Pro. ULTRA_SUB_TAB_KEYS is derived
// from this list so the two never drift.
const SUB_TABS = [
  { key: 'fire', label: '🔥 FIRE Number' },
  { key: 'debtVsInvest', label: '⚖️ Debt vs. Invest' },
  { key: 'drawdown', label: '🏖️ Drawdown', tier: 'Ultra' },
  { key: 'savings', label: '🏦 Savings Account' },
  { key: 'education', label: '🎓 Education Savings' },
  { key: 'affordability', label: '🏠 Home Affordability' },
  { key: 'insurance', label: '🛡️ Insurance Needs' },
  { key: 'salary', label: '💰 Take-Home Pay' },
  { key: 'dti', label: '📊 Debt-to-Income' },
  { key: 'rentVsBuy', label: '🏘️ Rent vs. Buy' },
  { key: 'futureCost', label: '📈 Future Cost' },
  { key: 'coastFire', label: '🌴 Coast FIRE', tier: 'Ultra' },
  { key: 'savingsRate', label: '⏱️ Savings Rate' },
  { key: 'cardTrap', label: '💳 Card Min. Trap' },
  { key: 'rule72', label: '⏳ Rule of 72' },
  { key: 'dividend', label: '💵 Dividend Income' },
  { key: 'carCost', label: '🚗 Cost of a Car' },
  { key: 'raiseValue', label: '💹 Value of a Raise' },
  { key: 'pretaxRA', label: '🧾 Pre-Tax Retirement', tier: 'Ultra' },
  { key: 'sinkingFund', label: '🎯 Sinking Fund' },
  { key: 'efRunway', label: '🛟 Fund Runway' },
  { key: 'freqCompare', label: '🔁 Compounding Frequency' },
  { key: 'budgetRule', label: '⚖️ 50/30/20 Check' },
  { key: 'windfall', label: '🎁 Windfall Split' },
  { key: 'marginalTax', label: '🧮 Marginal Tax Rate' },
  { key: 'raiseInflation', label: '🏃 Beat Inflation' },
  { key: 'rateShock', label: '📉 Rate Shock' },
  { key: 'feeDrag', label: '💸 Fee Drag' },
  { key: 'baristaFire', label: '☕ Barista FIRE', tier: 'Ultra' },
  { key: 'effRate', label: '🔢 Effective Rate' },
  { key: 'leaseVsBuy', label: '🚙 Lease vs. Buy' },
  { key: 'retireGap', label: '📊 Retirement Income Gap', tier: 'Ultra' },
  { key: 'depositTimeline', label: '🕐 Deposit Timeline' },
  { key: 'realReturn', label: '📉 Real Return' },
  { key: 'debtConsol', label: '🔗 Debt Consolidation' },
  { key: 'homeCosts', label: '🏦 Home Buying Costs' },
  { key: 'bonusTax', label: '🎉 Bonus Take-Home' },
  { key: 'raOptimizer', label: '🧾 RA Tax Optimizer', tier: 'Ultra' },
  { key: 'seqRisk', label: '🎢 Sequence Risk', tier: 'Ultra' },
  { key: 'twoPot', label: '🫙 Two-Pot Withdrawal', tier: 'Ultra' },
  { key: 'loanCompare', label: '⚖️ Loan Offer Compare' },
  { key: 'subCost', label: '🔁 Subscription Cost' },
  { key: 'payback', label: '☀️ Big-Purchase Payback' },
  { key: 'cashVsFinance', label: '💳 Cash vs. Finance' },
  { key: 'fundFees', label: '⚖️ Fund Fee Face-off' },
  { key: 'contractRate', label: '🧑‍💻 Contractor Rate' },
  { key: 'vat', label: '🧾 VAT Calculator' },
  { key: 'cgt', label: '📑 Capital Gains Tax' }
];

const ULTRA_SUB_TAB_KEYS = new Set(SUB_TABS.filter(t => t.tier === 'Ultra').map(t => t.key));
const EMPTY_SET = new Set();

// Groups the pills above into labelled categories so the bar stays scannable. Every
// key must appear exactly once; any that's missed drops into a "More" catch-all in
// SubTabs rather than vanishing.
const SUB_TAB_GROUPS = [
  { label: 'Retire & Financial Independence', keys: ['fire', 'coastFire', 'baristaFire', 'savingsRate', 'drawdown', 'pretaxRA', 'dividend', 'feeDrag', 'fundFees', 'retireGap', 'seqRisk', 'twoPot'] },
  { label: 'Debt & Credit', keys: ['debtVsInvest', 'dti', 'cardTrap', 'debtConsol', 'loanCompare', 'cashVsFinance'] },
  { label: 'Property & Big Purchases', keys: ['affordability', 'rentVsBuy', 'carCost', 'leaseVsBuy', 'depositTimeline', 'homeCosts', 'payback', 'rateShock'] },
  { label: 'Saving for a Goal', keys: ['savings', 'education', 'sinkingFund', 'efRunway', 'insurance', 'windfall'] },
  { label: 'Income & Tax', keys: ['salary', 'raiseValue', 'bonusTax', 'raOptimizer', 'contractRate', 'cgt', 'budgetRule', 'marginalTax', 'raiseInflation'] },
  { label: 'Money Basics', keys: ['futureCost', 'rule72', 'freqCompare', 'effRate', 'realReturn', 'subCost', 'vat'] }
];

const PowerTools = ({ country, initial, monthly, rate, years = 20, inflation, wrapper, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [], canUltra = true, onOpenPricing }) => {
  const [activeSubTab, setActiveSubTab] = useState('fire');
  const lockedSubTabs = canUltra ? EMPTY_SET : ULTRA_SUB_TAB_KEYS;
  // If the tier drops while an Ultra-only tool is open, fall back to the default so a
  // downgraded user never keeps a paid calculator on screen.
  useEffect(() => {
    if (lockedSubTabs.has(activeSubTab)) setActiveSubTab('fire');
  }, [lockedSubTabs, activeSubTab]);
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


  const [r72Rate, setR72Rate] = useState(rate || 7);
  const [r72Years, setR72Years] = useState(20);

  const [divTargetIncome, setDivTargetIncome] = useState(0);
  const [divPortfolio, setDivPortfolio] = useState(0);
  const [divYield, setDivYield] = useState(4);

  const [carPrice, setCarPrice] = useState(0);
  const [carDeposit, setCarDeposit] = useState(0);
  const [carFinanceRate, setCarFinanceRate] = useState(country.typicalBankRate ? Math.round(country.typicalBankRate + 2) : 12);
  const [carFinanceTerm, setCarFinanceTerm] = useState(6);
  const [carYearsOwned, setCarYearsOwned] = useState(5);
  const [carDepreciation, setCarDepreciation] = useState(15);
  const [carInsurance, setCarInsurance] = useState(0);
  const [carFuel, setCarFuel] = useState(0);
  const [carMaintenance, setCarMaintenance] = useState(0);

  const [raiseAmount, setRaiseAmount] = useState(0);
  const [raiseAnnualPercent, setRaiseAnnualPercent] = useState(5);
  const [raiseYearsLeft, setRaiseYearsLeft] = useState(25);
  const [raiseTaxRate, setRaiseTaxRate] = useState(country.taxRate);

  const [praContribution, setPraContribution] = useState(0);
  const [praMarginalRate, setPraMarginalRate] = useState(country.taxRate);
  const [praYears, setPraYears] = useState(25);
  const [praReturn, setPraReturn] = useState(rate || 8);

  const [sfTarget, setSfTarget] = useState(0);
  const [sfSaved, setSfSaved] = useState(0);
  const [sfMonths, setSfMonths] = useState(12);
  const [sfRate, setSfRate] = useState(Math.round(country.typicalBankRate || 5));

  const [efrSavings, setEfrSavings] = useState(0);
  const [efrExpenses, setEfrExpenses] = useState(0);
  const [efrRate, setEfrRate] = useState(Math.round(country.typicalBankRate || 5));

  const [fcPrincipal, setFcPrincipal] = useState(0);
  const [fcRate, setFcRate] = useState(rate || 7);
  const [fcYears, setFcYears] = useState(20);

  const [brIncome, setBrIncome] = useState(0);
  const [brNeeds, setBrNeeds] = useState(0);
  const [brWants, setBrWants] = useState(0);
  const [brSavings, setBrSavings] = useState(0);

  const [wfAmount, setWfAmount] = useState(0);
  const [wfEfShortfall, setWfEfShortfall] = useState(0);
  const [wfHighDebt, setWfHighDebt] = useState(0);
  const [wfWrapperRoom, setWfWrapperRoom] = useState(0);

  const [mtIncome, setMtIncome] = useState(0);
  const [mtProgressive, setMtProgressive] = useState(false);
  const [mtDeduction, setMtDeduction] = useState(0);

  const [riInflation, setRiInflation] = useState(Math.round(country.typicalInflation || 5));
  const [riSalary, setRiSalary] = useState(0);
  const [riOffered, setRiOffered] = useState(0);

  const [rsBalance, setRsBalance] = useState(0);
  const [rsRate, setRsRate] = useState(country.typicalBankRate || 11);
  const [rsYearsLeft, setRsYearsLeft] = useState(20);

  const [fdInitial, setFdInitial] = useState(0);
  const [fdMonthly, setFdMonthly] = useState(0);
  const [fdGross, setFdGross] = useState(rate || 9);
  const [fdFee, setFdFee] = useState(1);
  const [fdYears, setFdYears] = useState(30);

  const [bfExpenses, setBfExpenses] = useState(0);
  const [bfIncome, setBfIncome] = useState(0);
  const [bfSwr, setBfSwr] = useState(4);

  const [erRate, setErRate] = useState(0);
  const [erPeriods, setErPeriods] = useState(12);

  const [lvbPrice, setLvbPrice] = useState(0);
  const [lvbDeposit, setLvbDeposit] = useState(0);
  const [lvbFinanceRate, setLvbFinanceRate] = useState(country.typicalBankRate ? Math.round(country.typicalBankRate + 2) : 12);
  const [lvbFinanceTerm, setLvbFinanceTerm] = useState(6);
  const [lvbDepreciation, setLvbDepreciation] = useState(15);
  const [lvbPeriod, setLvbPeriod] = useState(3);
  const [lvbLeaseUpfront, setLvbLeaseUpfront] = useState(0);
  const [lvbLeaseMonthly, setLvbLeaseMonthly] = useState(0);

  const [rgPot, setRgPot] = useState(0);
  const [rgTarget, setRgTarget] = useState(0);
  const [rgSwr, setRgSwr] = useState(4);
  const [rgExtraMonthly, setRgExtraMonthly] = useState(0);
  const [rgCloseRate, setRgCloseRate] = useState(rate);

  const [dtPrice, setDtPrice] = useState(0);
  const [dtPercent, setDtPercent] = useState(10);
  const [dtMonthly, setDtMonthly] = useState(0);
  const [dtSaved, setDtSaved] = useState(0);
  const [dtRate, setDtRate] = useState(Math.round(country.typicalBankRate || 5));

  const [rrNominal, setRrNominal] = useState(rate || 8);
  const [rrInflation, setRrInflation] = useState(Math.round(country.typicalInflation || 5));
  const [rrTax, setRrTax] = useState(country.taxRate);

  const [dcRows, setDcRows] = useState([
    { id: 1, balance: 0, rate: 0, minPayment: 0 },
    { id: 2, balance: 0, rate: 0, minPayment: 0 }
  ]);
  const [dcNewRate, setDcNewRate] = useState(Math.round(country.typicalBankRate || 12));
  const [dcNewTerm, setDcNewTerm] = useState(5);
  const updateDcRow = (id, field, val) =>
    setDcRows(rows => rows.map(r => (r.id === id ? { ...r, [field]: val } : r)));
  const addDcRow = () =>
    setDcRows(rows => (rows.length >= 6 ? rows : [...rows, { id: Math.max(0, ...rows.map(r => r.id)) + 1, balance: 0, rate: 0, minPayment: 0 }]));
  const removeDcRow = (id) => setDcRows(rows => (rows.length <= 1 ? rows : rows.filter(r => r.id !== id)));

  const [hcPrice, setHcPrice] = useState(0);
  const [hcDeposit, setHcDeposit] = useState(0);

  const [btSalary, setBtSalary] = useState(0);
  const [btBonus, setBtBonus] = useState(0);
  const [btProgressive, setBtProgressive] = useState(false);

  const [raIncome, setRaIncome] = useState(0);
  const [raCurrent, setRaCurrent] = useState(0);
  const [raProgressive, setRaProgressive] = useState(false);

  const [sqPot, setSqPot] = useState(0);
  const [sqWithdrawal, setSqWithdrawal] = useState(0);
  const [sqYears, setSqYears] = useState(30);
  const [sqAvgReturn, setSqAvgReturn] = useState(rate || 7);
  const [sqBadReturn, setSqBadReturn] = useState(-8);
  const [sqBadYears, setSqBadYears] = useState(5);
  const [sqInflation, setSqInflation] = useState(Math.round(country.typicalInflation || 5));

  const [tpAmount, setTpAmount] = useState(0);
  const [tpIncome, setTpIncome] = useState(0);
  const [tpYearsToRetire, setTpYearsToRetire] = useState(20);
  const [tpGrowth, setTpGrowth] = useState(rate || 9);
  const [tpProgressive, setTpProgressive] = useState(false);

  const [lcAmount, setLcAmount] = useState(0);
  const [lcaRate, setLcaRate] = useState(Math.round(country.typicalBankRate || 12));
  const [lcaTerm, setLcaTerm] = useState(5);
  const [lcaUpfront, setLcaUpfront] = useState(0);
  const [lcaMonthly, setLcaMonthly] = useState(0);
  const [lcbRate, setLcbRate] = useState(Math.round((country.typicalBankRate || 12) + 2));
  const [lcbTerm, setLcbTerm] = useState(5);
  const [lcbUpfront, setLcbUpfront] = useState(0);
  const [lcbMonthly, setLcbMonthly] = useState(0);

  const [scMonthly, setScMonthly] = useState(0);
  const [scYears, setScYears] = useState(20);
  const [scReturn, setScReturn] = useState(rate || 8);
  const [scIncrease, setScIncrease] = useState(Math.round(country.typicalInflation || 5));

  const [pbCost, setPbCost] = useState(0);
  const [pbSaving, setPbSaving] = useState(0);
  const [pbMaint, setPbMaint] = useState(0);
  const [pbLife, setPbLife] = useState(15);
  const [pbSavingGrowth, setPbSavingGrowth] = useState(Math.round(country.typicalInflation || 5));
  const [pbReturn, setPbReturn] = useState(rate || 8);

  const [cfPrice, setCfPrice] = useState(0);
  const [cfDeposit, setCfDeposit] = useState(0);
  const [cfRate, setCfRate] = useState(country.typicalBankRate ? Math.round(country.typicalBankRate + 2) : 12);
  const [cfTerm, setCfTerm] = useState(5);
  const [cfReturn, setCfReturn] = useState(rate || 8);

  const [ffInitial, setFfInitial] = useState(0);
  const [ffMonthly, setFfMonthly] = useState(0);
  const [ffYears, setFfYears] = useState(30);
  const [ffGrossA, setFfGrossA] = useState(rate || 9);
  const [ffTerA, setFfTerA] = useState(0.5);
  const [ffGrossB, setFfGrossB] = useState(rate || 9);
  const [ffTerB, setFfTerB] = useState(1.5);

  const [crTakeHome, setCrTakeHome] = useState(0);
  const [crTaxRate, setCrTaxRate] = useState(country.taxRate);
  const [crBenefits, setCrBenefits] = useState(12);
  const [crWeeks, setCrWeeks] = useState(46);
  const [crHours, setCrHours] = useState(40);
  const [crUtil, setCrUtil] = useState(80);

  const [vatMode, setVatMode] = useState('add'); // 'add' = exclusive -> inclusive, 'extract' = inclusive -> exclusive
  const [vatAmount, setVatAmount] = useState(0);
  const [vatRate, setVatRate] = useState(15);

  const [cgtProceeds, setCgtProceeds] = useState(0);
  const [cgtBaseCost, setCgtBaseCost] = useState(0);
  const [cgtOtherIncome, setCgtOtherIncome] = useState(0);
  const [cgtProgressive, setCgtProgressive] = useState(false);

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

  const r72 = ruleOf72({ annualRate: r72Rate, years: r72Years });

  const dividend = dividendIncome({ targetMonthlyIncome: divTargetIncome, currentPortfolio: divPortfolio, annualYield: divYield });

  const carCost = carOwnershipCost({
    purchasePrice: carPrice, deposit: carDeposit, financeRate: carFinanceRate, financeTermYears: carFinanceTerm,
    yearsOwned: carYearsOwned, annualDepreciationRate: carDepreciation,
    monthlyInsurance: carInsurance, monthlyFuel: carFuel, monthlyMaintenance: carMaintenance
  });

  const raise = lifetimeRaiseValue({
    raiseAmount, annualRaisePercent: raiseAnnualPercent, yearsRemaining: raiseYearsLeft,
    marginalTaxRate: raiseTaxRate, investReturn: rate
  });

  const pra = pretaxRetirementBoost({
    monthlyContribution: praContribution, marginalTaxRate: praMarginalRate, years: praYears, returnRate: praReturn
  });

  const sinkingFund = sinkingFundPlan({ targetAmount: sfTarget, alreadySaved: sfSaved, months: sfMonths, annualSavingsRate: sfRate });
  const efRunway = emergencyRunway({ savings: efrSavings, monthlyExpenses: efrExpenses, annualSavingsRate: efrRate });
  const freqRows = compareCompoundingFrequencies({ principal: fcPrincipal, annualRate: fcRate, years: fcYears });
  const budgetRule = budgetRuleCheck({ takeHomeIncome: brIncome, needs: brNeeds, wants: brWants, savings: brSavings });

  const windfall = allocateWindfall({ amount: wfAmount, emergencyShortfall: wfEfShortfall, highInterestDebt: wfHighDebt, wrapperRoom: wfWrapperRoom });

  const marginalTax = marginalTaxAnalysis({
    income: mtIncome, taxRate: country.taxRate,
    taxBrackets: (mtProgressive && country.taxBrackets) ? country.taxBrackets : null,
    deltaEarned: 1000, deductionAmount: mtDeduction
  });

  const raiseInflation = raiseForInflation({ currentSalary: riSalary, inflationRate: riInflation, offeredRaisePercent: riOffered });

  const rateShock = rateSensitivity({ balance: rsBalance, currentRate: rsRate, yearsRemaining: rsYearsLeft });

  const feeDrag = feeDragAnalysis({ initial: fdInitial, monthly: fdMonthly, grossReturn: fdGross, feePercent: fdFee, years: fdYears });
  const barista = baristaFireNumber({ annualExpenses: bfExpenses, partTimeIncome: bfIncome, withdrawalRate: bfSwr });
  const effAnnual = nominalToEffective({ nominalRate: erRate, periodsPerYear: erPeriods });
  const nominalEquiv = effectiveToNominal({ effectiveRate: erRate, periodsPerYear: erPeriods });
  const leaseBuy = leaseVsBuy({
    carPrice: lvbPrice, buyDeposit: lvbDeposit, financeRate: lvbFinanceRate, financeTermYears: lvbFinanceTerm,
    annualDepreciationRate: lvbDepreciation, comparePeriodYears: lvbPeriod,
    leaseUpfront: lvbLeaseUpfront, leaseMonthly: lvbLeaseMonthly
  });

  const retireGap = retirementIncomeGap({ projectedPot: rgPot, targetAnnualIncome: rgTarget, withdrawalRate: rgSwr });
  // The engine floors the rate at 0.01% and falls back to 4% for a 0 -- show the rate
  // it actually used, not the raw (possibly cleared/negative) field value.
  const rgSwrShown = Math.max(0.01, rgSwr || 4);
  // "Another 11 years of saving R6,000/month would close it" -- turns the capital gap
  // above into a concrete timeline, the same way Coast FIRE and Sinking Fund give their
  // own shortfalls a horizon instead of leaving it as a bare rand figure.
  const rgCloseGap = (!retireGap.onTrack && retireGap.capitalGap > 0)
    ? monthsToCloseGap({ capitalGap: retireGap.capitalGap, extraMonthly: rgExtraMonthly, rate: rgCloseRate })
    : null;
  const depositTimeline = depositSavingsTimeline({ homePrice: dtPrice, depositPercent: dtPercent, monthlySaving: dtMonthly, alreadySaved: dtSaved, annualSavingsRate: dtRate });
  const realRet = realReturn({ nominalRate: rrNominal, inflationRate: rrInflation, taxRate: rrTax });

  const debtConsol = compareDebtConsolidation({
    debts: dcRows.map(r => ({ balance: r.balance, rate: r.rate, minPayment: r.minPayment })),
    newRate: dcNewRate, newTermYears: dcNewTerm
  });
  const dcHasDebts = dcRows.some(r => r.balance > 0);

  const homeCosts = estimateHomePurchaseCosts({
    purchasePrice: hcPrice, depositAmount: hcDeposit, countryCode: country.code
  });

  const bonusTax = bonusTakeHome({
    annualSalary: btSalary, bonusAmount: btBonus,
    taxRate: country.taxRate,
    taxBrackets: (btProgressive && country.taxBrackets) ? country.taxBrackets : null
  });

  const raResult = optimiseRaContribution({
    taxableIncome: raIncome, currentAnnualContribution: raCurrent,
    taxRate: country.taxRate,
    taxBrackets: (raProgressive && country.taxBrackets) ? country.taxBrackets : null
  });

  const seqResult = analyseSequenceRisk({
    startingPot: sqPot, annualWithdrawal: sqWithdrawal, retirementYears: sqYears,
    averageReturn: sqAvgReturn, badReturn: sqBadReturn, badYears: sqBadYears, inflationPct: sqInflation
  });

  const twoPot = analyseTwoPotWithdrawal({
    withdrawalAmount: tpAmount, annualIncome: tpIncome,
    taxRate: country.taxRate,
    taxBrackets: (tpProgressive && country.taxBrackets) ? country.taxBrackets : null,
    yearsToRetirement: tpYearsToRetire, growthRate: tpGrowth
  });
  // The two-pot rules set a R2,000 minimum per savings-pot withdrawal, and only allow
  // one such withdrawal per tax year -- a real gotcha worth flagging directly against
  // whatever amount is typed in, using the same SARS tax-year cycle the Calculator
  // tab's own reminder is built on.
  const TWO_POT_MIN_WITHDRAWAL = 2000;
  const tpTaxYear = sarsTaxYear();

  const loanCompare = compareLoanOffers({
    amount: lcAmount,
    offerA: { rate: lcaRate, termYears: lcaTerm, upfrontFee: lcaUpfront, monthlyFee: lcaMonthly },
    offerB: { rate: lcbRate, termYears: lcbTerm, upfrontFee: lcbUpfront, monthlyFee: lcbMonthly }
  });

  const subCost = subscriptionCost({
    monthlyAmount: scMonthly, years: scYears, investReturn: scReturn, annualPriceIncrease: scIncrease
  });

  const payback = analysePayback({
    upfrontCost: pbCost, monthlySaving: pbSaving, maintenanceMonthly: pbMaint,
    lifespanYears: pbLife, savingGrowthPct: pbSavingGrowth, investReturnPct: pbReturn
  });

  const cashVsFinance = compareBuyCashVsFinance({
    price: cfPrice, deposit: cfDeposit, financeRate: cfRate, financeTermYears: cfTerm, investReturnPct: cfReturn
  });

  const fundFees = compareFundFees({
    initial: ffInitial, monthly: ffMonthly, years: ffYears, contributionIncreaseRate: contributionIncrease,
    fundA: { grossReturn: ffGrossA, ter: ffTerA },
    fundB: { grossReturn: ffGrossB, ter: ffTerB }
  });

  const contractRate = contractorRate({
    targetAnnualTakeHome: crTakeHome, taxRatePct: crTaxRate, benefitsLoadingPct: crBenefits,
    billableWeeksPerYear: crWeeks, billableHoursPerWeek: crHours, utilisationPct: crUtil
  });

  const vatResult = vatMode === 'add'
    ? addVat({ exclusiveAmount: vatAmount, vatRatePct: vatRate })
    : extractVat({ inclusiveAmount: vatAmount, vatRatePct: vatRate });

  const cgtResult = estimateCapitalGainsTax({
    proceeds: cgtProceeds, baseCost: cgtBaseCost, otherTaxableIncome: cgtOtherIncome,
    taxRate: country.taxRate,
    taxBrackets: (cgtProgressive && country.taxBrackets) ? country.taxBrackets : null
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

      <SubTabs
        tabs={SUB_TABS}
        groups={SUB_TAB_GROUPS}
        active={activeSubTab}
        onChange={setActiveSubTab}
        ariaLabel="Power Tools calculator"
        lockedKeys={lockedSubTabs}
        onLockedClick={() => onOpenPricing && onOpenPricing()}
      />
      {!canUltra && (
        <p className="power-tools-tier-hint">
          🔒 tools are part of the advanced retirement &amp; tax-strategy set on <strong>Ultra</strong> — Drawdown, Coast &amp; Barista FIRE, Pre-Tax &amp; RA Optimizer, Two-Pot, Sequence Risk, Retirement Income Gap.
          {onOpenPricing && <button type="button" className="power-tools-tier-hint-btn" onClick={onOpenPricing}>See Ultra</button>}
        </p>
      )}

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
        <h3>💳 Credit Card Minimum-Payment Trap</h3>
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
                  <strong className="positive">
                    {cardResult.minimumOnly.neverPaysOff
                      ? 'avoids a balance the minimum never clears'
                      : `${country.symbol} ${Math.round(Math.max(0, cardResult.minimumOnly.totalInterest - cardResult.fixed.totalInterest)).toLocaleString()}`}
                  </strong>
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

      {activeSubTab === 'dividend' && (
      <div className="power-tool-card">
        <h3>💵 Dividend / Passive Income Calculator</h3>
        <p className="power-tool-desc">How big a portfolio it takes to live off the yield without ever selling the capital — and what your current holdings already pay.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Target Monthly Income ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={divTargetIncome} onChange={(e) => setDivTargetIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Portfolio You Already Have ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={divPortfolio} onChange={(e) => setDivPortfolio(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Expected Dividend / Interest Yield (%/yr)</label>
            <input type="number" min="0" step="0.1" value={divYield} onChange={(e) => setDivYield(Number(e.target.value))} />
          </div>
        </div>
        {(divTargetIncome > 0 || divPortfolio > 0) && (
          <>
            <div className="power-verdict-grid">
              {divTargetIncome > 0 && (
                <div className="power-stat">
                  <span>Capital Needed at {divYield}% Yield</span>
                  <strong className="warn">{dividend.capitalNeeded == null ? '—' : `${country.symbol} ${Math.round(dividend.capitalNeeded).toLocaleString()}`}</strong>
                </div>
              )}
              {divPortfolio > 0 && (
                <div className="power-stat">
                  <span>Your Portfolio Pays (monthly)</span>
                  <strong className="positive">{country.symbol} {Math.round(dividend.monthlyFromPortfolio).toLocaleString()}</strong>
                </div>
              )}
              {divTargetIncome > 0 && dividend.shortfallCapital != null && (
                <div className="power-stat">
                  <span>Still to Invest</span>
                  <strong className={dividend.shortfallCapital > 0 ? 'warn' : 'positive'}>{country.symbol} {Math.round(dividend.shortfallCapital).toLocaleString()}</strong>
                </div>
              )}
            </div>
            <p className="power-tool-note">
              A yield-only view: the capital stays intact and you spend what it distributes, unlike the FIRE tool's
              4%-rule drawdown which sells units over time. Real dividend yields move, aren't guaranteed, and may be
              taxed — {country.name}'s indicative rate on investment income is {country.taxRate}% outside a
              {country.wrapperLabel && country.wrapperLabel !== 'N/A' ? ` ${country.wrapperLabel}` : ' tax-free wrapper'}.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'carCost' && (
      <div className="power-tool-card">
        <h3>🚗 True Cost of Car Ownership</h3>
        <p className="power-tool-desc">The sticker price is the smallest part. Depreciation, finance interest, and running costs over the years you keep it are the real number.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Purchase Price ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={carPrice} onChange={(e) => setCarPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Deposit / Cash Down ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={carDeposit} onChange={(e) => setCarDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Finance Rate (%)</label>
            <input type="number" min="0" step="0.1" value={carFinanceRate} onChange={(e) => setCarFinanceRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Finance Term (years, 0 = cash)</label>
            <input type="number" min="0" max="10" value={carFinanceTerm} onChange={(e) => setCarFinanceTerm(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years You'll Keep It</label>
            <input type="number" min="1" max="30" value={carYearsOwned} onChange={(e) => setCarYearsOwned(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Depreciation (%/yr of value)</label>
            <input type="number" min="0" max="50" step="0.5" value={carDepreciation} onChange={(e) => setCarDepreciation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Insurance ({country.symbol}/mo)</label>
            <input type="number" min="0" step="100" value={carInsurance} onChange={(e) => setCarInsurance(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Fuel / Charging ({country.symbol}/mo)</label>
            <input type="number" min="0" step="100" value={carFuel} onChange={(e) => setCarFuel(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Maintenance + Licensing ({country.symbol}/mo)</label>
            <input type="number" min="0" step="100" value={carMaintenance} onChange={(e) => setCarMaintenance(Number(e.target.value))} />
          </div>
        </div>
        {carPrice > 0 && carYearsOwned > 0 && (
          <>
            <div className="power-verdict debt">
              Owning this car for {carYearsOwned} years costs about {country.symbol} {Math.round(carCost.totalCost).toLocaleString()} all-in — roughly {country.symbol} {Math.round(carCost.costPerMonth).toLocaleString()}/month. It's worth about {country.symbol} {Math.round(carCost.residualValue).toLocaleString()} at the end.
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Lost to Depreciation</span>
                <strong className="warn">{country.symbol} {Math.round(carCost.depreciation).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Finance Interest</span>
                <strong className="warn">{country.symbol} {Math.round(carCost.financeInterest).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Running Costs ({carYearsOwned}yr)</span>
                <strong className="warn">{country.symbol} {Math.round(carCost.runningTotal).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              Depreciation compounds at {carDepreciation}%/yr off the declining value (steepest early). Finance
              interest is the real interest paid over the years held, from the same amortization math the Loan &amp; Bond
              tab uses. Doesn't model insurance/fuel inflation, tyres and big repairs beyond the monthly figure, or
              resale-vs-trade-in differences.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'raiseValue' && (
      <div className="power-tool-card">
        <h3>💹 Lifetime Value of a Pay Rise</h3>
        <p className="power-tool-desc">A raise now isn't worth "the amount × years left" — every future percentage raise stacks on the higher base, and the after-tax difference can be invested.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Annual Raise Amount ({country.symbol}/yr)</label>
            <input type="number" min="0" step="5000" value={raiseAmount} onChange={(e) => setRaiseAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Future Raises (%/yr on the new base)</label>
            <input type="number" min="0" step="0.5" value={raiseAnnualPercent} onChange={(e) => setRaiseAnnualPercent(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Working Years Remaining</label>
            <input type="number" min="0" max="50" value={raiseYearsLeft} onChange={(e) => setRaiseYearsLeft(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Marginal Tax Rate (%)</label>
            <input type="number" min="0" max="100" step="1" value={raiseTaxRate} onChange={(e) => setRaiseTaxRate(Number(e.target.value))} />
          </div>
        </div>
        {raiseAmount > 0 && raiseYearsLeft > 0 && (
          <>
            <div className="power-verdict invest">
              Over {raiseYearsLeft} years this raise is worth about {country.symbol} {Math.round(raise.cumulativeGross).toLocaleString()} gross ({country.symbol} {Math.round(raise.cumulativeAfterTax).toLocaleString()} after {raiseTaxRate}% tax). Invested at your {rate}% Calculator rate, the after-tax difference grows to {country.symbol} {Math.round(raise.investedValue).toLocaleString()}.
            </div>
            <p className="power-tool-note">
              Assumes each future raise is {raiseAnnualPercent}% of the then-current bump, and that you invest the
              full after-tax difference at the end of every year. A negotiation-context figure, not a promise — raises
              aren't guaranteed and tax brackets shift.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'pretaxRA' && (
      <div className="power-tool-card">
        <h3>🧾 Pre-Tax Retirement Contribution</h3>
        <p className="power-tool-desc">Money into a pre-tax retirement account costs less out of pocket (you get your marginal rate back) and the whole amount compounds — not just the after-tax slice.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Monthly Contribution ({country.symbol})</label>
            <input type="number" min="0" step="500" value={praContribution} onChange={(e) => setPraContribution(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Your Marginal Tax Rate (%)</label>
            <input type="number" min="0" max="100" step="1" value={praMarginalRate} onChange={(e) => setPraMarginalRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years to Retirement</label>
            <input type="number" min="1" max="60" value={praYears} onChange={(e) => setPraYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Expected Return (%)</label>
            <input type="number" step="0.1" value={praReturn} onChange={(e) => setPraReturn(Number(e.target.value))} />
          </div>
        </div>
        {praContribution > 0 && (
          <>
            <div className="power-verdict invest">
              A {country.symbol}{Math.round(praContribution).toLocaleString()}/mo pre-tax contribution costs about {country.symbol} {Math.round(pra.netCost).toLocaleString()}/mo out of pocket after a {country.symbol} {Math.round(pra.annualRefund).toLocaleString()}/yr tax refund, and grows to {country.symbol} {Math.round(pra.pretaxPot).toLocaleString()} in {praYears} years — vs {country.symbol} {Math.round(pra.taxablePot).toLocaleString()} if the same net cost went into a taxable account. Difference: {country.symbol} {Math.round(pra.advantage).toLocaleString()}.
            </div>
            <p className="power-tool-note">
              Doesn't model tax on the pre-tax pot when you eventually draw it down in retirement — most systems tax
              those withdrawals, often at a lower effective rate than working-life income. The figure above is the
              deferral-plus-full-compounding advantage before that, and applies your entered marginal rate
              ({praMarginalRate}%) as the taxable account's drag on gains -- most systems tax investment gains
              lower than income, so the real advantage is likely a little larger than shown. Not tax advice.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'sinkingFund' && (
      <div className="power-tool-card">
        <h3>🎯 Sinking Fund Planner</h3>
        <p className="power-tool-desc">A known expense on a known date — a car, a wedding, next year's school fees. How much a month to have it ready, saving at a modest rate rather than investing.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Amount Needed ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={sfTarget} onChange={(e) => setSfTarget(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Already Set Aside ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={sfSaved} onChange={(e) => setSfSaved(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Months Until You Need It</label>
            <input type="number" min="0" max="120" value={sfMonths} onChange={(e) => setSfMonths(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Savings Account Rate (%/yr)</label>
            <input type="number" min="0" step="0.1" value={sfRate} onChange={(e) => setSfRate(Number(e.target.value))} />
          </div>
        </div>
        {sfTarget > 0 && (
          <>
            <div className="power-verdict invest">
              {sfMonths > 0
                ? `Set aside about ${country.symbol} ${Math.round(sinkingFund.monthlyAmount).toLocaleString()}/month for ${sfMonths} months to have ${country.symbol} ${Math.round(sfTarget).toLocaleString()} ready${sfSaved > 0 ? `, on top of the ${country.symbol} ${Math.round(sfSaved).toLocaleString()} you've already saved` : ''}.`
                : `You need the full ${country.symbol} ${Math.round(Math.max(0, sfTarget - sfSaved)).toLocaleString()} now — set a number of months to spread it into a monthly amount.`}
            </div>
            <p className="power-tool-note">
              Assumes the balance earns {sfRate}% in a savings account ({country.symbol} {Math.round(sinkingFund.interestEarned).toLocaleString()} of the total over the term), not a market return —
              for a goal years out where you're willing to take investment risk, use the Invest tab's goal planner instead.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'efRunway' && (
      <div className="power-tool-card">
        <h3>🛟 Emergency Fund Runway</h3>
        <p className="power-tool-desc">If your income stopped today, how many full months would what you've already saved actually cover?</p>
        <div className="power-form">
          <div className="form-group">
            <label>Emergency Savings ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={efrSavings} onChange={(e) => setEfrSavings(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Essential Monthly Expenses ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={efrExpenses} onChange={(e) => setEfrExpenses(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Interest While It Sits (%/yr)</label>
            <input type="number" min="0" step="0.1" value={efrRate} onChange={(e) => setEfrRate(Number(e.target.value))} />
          </div>
        </div>
        {efrSavings > 0 && efrExpenses > 0 && (
          <>
            <div className={`power-verdict ${efRunway.lastsIndefinitely || efRunway.fullMonths >= 6 ? 'invest' : efRunway.fullMonths >= 3 ? 'debt' : 'danger'}`}>
              {efRunway.lastsIndefinitely
                ? `At ${efrRate}%, the interest alone covers your ${country.symbol}${Math.round(efrExpenses).toLocaleString()}/mo — this fund lasts indefinitely with no income.`
                : `This covers about ${efRunway.fullMonths} full month${efRunway.fullMonths === 1 ? '' : 's'} of essential expenses with no income coming in. ${efRunway.fullMonths >= 6 ? 'A solid buffer.' : efRunway.fullMonths >= 3 ? 'A reasonable minimum — aim for 3–6 months.' : 'Below the usual 3-month floor — worth building up.'}`}
            </div>
            <p className="power-tool-note">
              Burns the balance down by {country.symbol}{Math.round(efrExpenses).toLocaleString()}/month while the rest earns {efrRate}%. "Essential"
              means rent/bond, food, utilities, transport, insurance, minimum debt payments — not discretionary spending
              you'd cut in a real crunch. For building the fund up in the first place, use the Emergency Fund tab.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'freqCompare' && (
      <div className="power-tool-card">
        <h3>🔁 Compounding Frequency Comparison</h3>
        <p className="power-tool-desc">Same money, same rate, same term — how much does it matter whether interest is credited once a year or every day?</p>
        <div className="power-form">
          <div className="form-group">
            <label>Amount ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={fcPrincipal} onChange={(e) => setFcPrincipal(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Annual Rate (%)</label>
            <input type="number" step="0.1" value={fcRate} onChange={(e) => setFcRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years</label>
            <input type="number" min="1" max="60" value={fcYears} onChange={(e) => setFcYears(Number(e.target.value))} />
          </div>
        </div>
        {fcPrincipal > 0 && (
          <>
            <div className="tbl-wrap">
              <table className="power-freq-table">
                <thead>
                  <tr><th>Credited</th><th>Final Balance</th><th>vs. Annually</th></tr>
                </thead>
                <tbody>
                  {freqRows.map(r => (
                    <tr key={r.key}>
                      <td>{r.label}</td>
                      <td>{country.symbol} {Math.round(r.finalBalance).toLocaleString()}</td>
                      <td>{r.extraVsAnnual > 0 ? `+${country.symbol} ${Math.round(r.extraVsAnnual).toLocaleString()}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="power-tool-note">
              More frequent compounding always wins, but the gap between monthly and daily is usually tiny — the
              headline rate and the time invested matter far more. Same engine as the Calculator tab's frequency
              selector, so these match that tab exactly.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'budgetRule' && (
      <div className="power-tool-card">
        <h3>⚖️ 50/30/20 Budget Check</h3>
        <p className="power-tool-desc">The rule of thumb: about half of take-home to needs, a third to wants, a fifth to saving and extra debt paydown. See how your split compares.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Monthly Take-Home Income ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={brIncome} onChange={(e) => setBrIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Needs — rent, food, utilities, transport ({country.symbol})</label>
            <input type="number" min="0" step="500" value={brNeeds} onChange={(e) => setBrNeeds(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Wants — dining out, subscriptions, travel ({country.symbol})</label>
            <input type="number" min="0" step="500" value={brWants} onChange={(e) => setBrWants(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Saving + extra debt paydown ({country.symbol})</label>
            <input type="number" min="0" step="500" value={brSavings} onChange={(e) => setBrSavings(Number(e.target.value))} />
          </div>
        </div>
        {brIncome > 0 && (
          <>
            <div className={`power-verdict ${budgetRule.onTrack ? 'invest' : 'debt'}`}>
              {budgetRule.onTrack
                ? `Roughly on the rule: needs ${budgetRule.actualPct.needs.toFixed(0)}%, wants ${budgetRule.actualPct.wants.toFixed(0)}%, saving ${budgetRule.actualPct.savings.toFixed(0)}%.`
                : `Off the rule: needs ${budgetRule.actualPct.needs.toFixed(0)}% (target ≤50%), wants ${budgetRule.actualPct.wants.toFixed(0)}% (target ~30%), saving ${budgetRule.actualPct.savings.toFixed(0)}% (target ≥20%).`}
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Needs target (50%)</span>
                <strong>{country.symbol} {Math.round(budgetRule.targets.needs).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Wants target (30%)</span>
                <strong>{country.symbol} {Math.round(budgetRule.targets.wants).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Saving target (20%)</span>
                <strong>{country.symbol} {Math.round(budgetRule.targets.savings).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Unallocated</span>
                <strong className={Math.abs(budgetRule.unallocated) < 1 ? '' : budgetRule.unallocated > 0 ? 'positive' : 'warn'}>{country.symbol} {Math.round(budgetRule.unallocated).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              A starting framework, not a law — high-cost-of-living areas often can't get needs under 50%, and someone
              chasing FIRE deliberately pushes saving well past 20%. For a full line-item budget, use the Budget tab.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'windfall' && (
      <div className="power-tool-card">
        <h3>🎁 Windfall / Bonus Split</h3>
        <p className="power-tool-desc">A lump sum — bonus, tax refund, inheritance — split down the conventional priority order: emergency fund, then expensive debt, then tax-advantaged room, then the rest invested.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Windfall Amount ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={wfAmount} onChange={(e) => setWfAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Emergency Fund Shortfall ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={wfEfShortfall} onChange={(e) => setWfEfShortfall(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Debt Above Your Investment Return ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={wfHighDebt} onChange={(e) => setWfHighDebt(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Unused Tax-Advantaged Room This Year ({country.symbol})</label>
            <input type="number" min="0" step="1000" value={wfWrapperRoom} onChange={(e) => setWfWrapperRoom(Number(e.target.value))} />
          </div>
        </div>
        {wfAmount > 0 && (
          <>
            <div className="power-verdict invest">Suggested split of {country.symbol} {Math.round(wfAmount).toLocaleString()}:</div>
            <div className="power-verdict-grid">
              {windfall.steps.map((s, i) => (
                <div className="power-stat" key={i}>
                  <span>{s.label}</span>
                  <strong className={s.label.startsWith('Invest') ? 'positive' : ''}>{country.symbol} {Math.round(s.amount).toLocaleString()}</strong>
                </div>
              ))}
            </div>
            <p className="power-tool-note">
              Rule-based, deterministic priority order — the same logic the Coach uses, not personalised advice. "Debt
              above your investment return" means anything costing more than what investing is expected to keep after
              tax; clearing that first is a guaranteed return. Adjust the inputs to match your own situation.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'marginalTax' && (
      <div className="power-tool-card">
        <h3>🧮 Marginal Tax Rate & Deduction Value</h3>
        <p className="power-tool-desc">What the next rand you earn actually keeps — and what a deductible contribution (retirement annuity, donation) saves you this year.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Annual Taxable Income ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={mtIncome} onChange={(e) => setMtIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Deductible Contribution to Test ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={mtDeduction} onChange={(e) => setMtDeduction(Number(e.target.value))} />
          </div>
          {country.taxBrackets && (
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={mtProgressive} onChange={(e) => setMtProgressive(e.target.checked)} />
                {' '}Use {country.name}'s progressive tax brackets
              </label>
            </div>
          )}
        </div>
        {mtIncome > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Marginal Tax Rate</span>
                <strong className="warn">{marginalTax.marginalRate.toFixed(1)}%</strong>
              </div>
              <div className="power-stat">
                <span>Next {country.symbol}1,000 Earned Keeps</span>
                <strong className="positive">{country.symbol} {Math.round(marginalTax.keepsFromNext).toLocaleString()}</strong>
              </div>
              {mtDeduction > 0 && (
                <div className="power-stat">
                  <span>{country.symbol}{Math.round(mtDeduction).toLocaleString()} Deduction Saves</span>
                  <strong className="positive">{country.symbol} {Math.round(marginalTax.deductionTaxSaved).toLocaleString()}</strong>
                </div>
              )}
              {mtDeduction > 0 && (
                <div className="power-stat">
                  <span>Real Cost of That Contribution</span>
                  <strong>{country.symbol} {Math.round(marginalTax.deductionNetCost).toLocaleString()}</strong>
                </div>
              )}
            </div>
            <p className="power-tool-note">
              {mtProgressive && country.taxBrackets
                ? (country.taxBracketsNote || `${country.name}'s progressive bracket schedule -- illustrative only.`)
                : `Flat ${country.taxRate}% assumed, so that's also the marginal rate.`} Ignores rebates, thresholds,
              and contribution caps (e.g. a country's limit on deductible retirement contributions). Not tax advice.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'raiseInflation' && (
      <div className="power-tool-card">
        <h3>🏃 Raise Needed to Beat Inflation</h3>
        <p className="power-tool-desc">A pay rise below the inflation rate is a pay cut in real terms. See the break-even raise, and what an offer is actually worth.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Current Salary ({country.symbol}/yr)</label>
            <input type="number" min="0" step="10000" value={riSalary} onChange={(e) => setRiSalary(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="inflation">Inflation</Term> Rate (%)</label>
            <input type="number" step="0.1" value={riInflation} onChange={(e) => setRiInflation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Raise You're Offered (%)</label>
            <input type="number" step="0.1" value={riOffered} onChange={(e) => setRiOffered(Number(e.target.value))} />
          </div>
        </div>
        {riSalary > 0 && (
          <>
            <div className={`power-verdict ${riOffered > 0 ? (raiseInflation.matchesInflation ? 'neutral' : raiseInflation.beatsInflation ? 'invest' : 'debt') : 'debt'}`}>
              You need a {raiseInflation.breakEvenRaisePercent.toFixed(1)}% raise ({country.symbol} {Math.round(raiseInflation.breakEvenRaiseAmount).toLocaleString()}) just to hold your ground at {riInflation}% inflation.
              {riOffered > 0 && (raiseInflation.matchesInflation
                ? ` The ${riOffered}% offered just about keeps pace — roughly flat in real terms.`
                : raiseInflation.beatsInflation
                  ? ` The ${riOffered}% offered is a real gain of about ${raiseInflation.realChangePercent.toFixed(1)}%.`
                  : ` The ${riOffered}% offered is a real cut of about ${Math.abs(raiseInflation.realChangePercent).toFixed(1)}%.`)}
            </div>
            <p className="power-tool-note">
              "Real" here means after dividing the new salary back by {riInflation}% inflation — its purchasing power
              next year in today's money. Doesn't model bracket creep (a raise can push part of your income into a
              higher tax band). See the Marginal Tax Rate tool for that.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'rateShock' && (
      <div className="power-tool-card">
        <h3>📉 Interest-Rate Shock on a Bond</h3>
        <p className="power-tool-desc">What your bond repayment does if the rate moves. The Loan &amp; Bond tab models one fixed rate — this is the "what if the central bank hikes" view.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Outstanding Balance ({country.symbol})</label>
            <input type="number" min="0" step="50000" value={rsBalance} onChange={(e) => setRsBalance(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Current Rate (%)</label>
            <input type="number" min="0" step="0.1" value={rsRate} onChange={(e) => setRsRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years Left on the Loan</label>
            <input type="number" min="1" max="30" value={rsYearsLeft} onChange={(e) => setRsYearsLeft(Number(e.target.value))} />
          </div>
        </div>
        {rsBalance > 0 && (
          <>
            <div className="tbl-wrap">
              <table className="power-freq-table">
                <thead>
                  <tr><th>Rate Move</th><th>New Rate</th><th>Monthly Repayment</th><th>vs. Now</th></tr>
                </thead>
                <tbody>
                  {rateShock.map(r => (
                    <tr key={r.shift}>
                      <td>{r.shift > 0 ? `+${r.shift}%` : r.shift < 0 ? `${r.shift}%` : 'no change'}</td>
                      <td>{r.rate.toFixed(2)}%</td>
                      <td>{country.symbol} {Math.round(r.payment).toLocaleString()}</td>
                      <td>{r.shift === 0 ? '—' : `${r.deltaVsNow >= 0 ? '+' : '−'}${country.symbol} ${Math.round(Math.abs(r.deltaVsNow)).toLocaleString()}/mo`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="power-tool-note">
              Reprices the standard installment on the balance over the years left at each rate — it doesn't shorten
              or extend the term. A +3% move on a large balance is a meaningful monthly jump; stress-test your budget
              against the top row, not the bottom.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'feeDrag' && (
      <div className="power-tool-card">
        <h3>💸 Investment Fee Drag</h3>
        <p className="power-tool-desc">A yearly fee sounds small next to a market return — over decades it quietly takes a large slice of the final pot. See how much.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Starting Amount ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={fdInitial} onChange={(e) => setFdInitial(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Monthly Contribution ({country.symbol})</label>
            <input type="number" min="0" step="500" value={fdMonthly} onChange={(e) => setFdMonthly(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Gross Return Before Fees (%)</label>
            <input type="number" step="0.1" value={fdGross} onChange={(e) => setFdGross(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Annual Fee (%)</label>
            <input type="number" min="0" step="0.05" value={fdFee} onChange={(e) => setFdFee(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years Invested</label>
            <input type="number" min="1" max="60" value={fdYears} onChange={(e) => setFdYears(Number(e.target.value))} />
          </div>
        </div>
        {(fdInitial > 0 || fdMonthly > 0) && fdFee > 0 && (
          <>
            <div className="power-verdict debt">
              A {fdFee}% annual fee costs about {country.symbol} {Math.round(feeDrag.lifetimeFeeCost).toLocaleString()} over {fdYears} years — {feeDrag.costAsPercentOfPot.toFixed(0)}% of what the fee-free pot would have been.
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Final Pot — No Fee</span>
                <strong className="positive">{country.symbol} {Math.round(feeDrag.finalNoFee).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Final Pot — After {fdFee}% Fee</span>
                <strong>{country.symbol} {Math.round(feeDrag.finalWithFee).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              Models the fee as a flat reduction to the annual return ({fdGross}% gross → {(fdGross - fdFee).toFixed(2)}% net),
              which is how a percentage-of-assets fee (TER, platform fee, advice fee) compounds against you. Ignores tax and
              assumes the gross return is steady.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'baristaFire' && (
      <div className="power-tool-card">
        <h3>☕ Barista FIRE Number</h3>
        <p className="power-tool-desc">If you'll keep some part-time or lower-stress income, your investments only have to cover the gap — so the pot you need is smaller.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Annual Expenses ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={bfExpenses} onChange={(e) => setBfExpenses(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Part-Time / Ongoing Income ({country.symbol}/yr)</label>
            <input type="number" min="0" step="10000" value={bfIncome} onChange={(e) => setBfIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="safeWithdrawalRate">Safe Withdrawal Rate</Term> (%)</label>
            <input type="number" min="1" max="10" step="0.1" value={bfSwr} onChange={(e) => setBfSwr(Number(e.target.value))} />
          </div>
        </div>
        {bfExpenses > 0 && (
          <>
            <div className={`power-verdict ${barista.coversItself ? 'invest' : 'debt'}`}>
              {barista.coversItself
                ? `Your ${country.symbol}${Math.round(bfIncome).toLocaleString()}/yr income already covers your expenses — no investment pot is strictly required to stop full-time work.`
                : `Barista FIRE number: ${country.symbol} ${Math.round(barista.baristaFireNumber).toLocaleString()} — ${country.symbol} ${Math.round(barista.reduction).toLocaleString()} less than the ${country.symbol} ${Math.round(barista.fullFireNumber).toLocaleString()} full FIRE number, because the pot only has to fund the ${country.symbol} ${Math.round(barista.gap).toLocaleString()}/yr gap.`}
            </div>
            <p className="power-tool-note">
              Same {bfSwr}% withdrawal-rate assumption as the FIRE Number tool, applied only to expenses your ongoing
              income doesn't cover. Assumes that income is durable and roughly keeps pace with inflation — if it's
              likely to stop or shrink, size closer to the full FIRE number.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'effRate' && (
      <div className="power-tool-card">
        <h3>🔢 Nominal vs. Effective Annual Rate</h3>
        <p className="power-tool-desc">A rate quoted "per year, compounded monthly" isn't what you actually earn or pay — the intra-year compounding makes the effective rate higher.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Quoted Rate (%)</label>
            <input type="number" step="0.01" value={erRate} onChange={(e) => setErRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Compounding Periods per Year</label>
            <select value={erPeriods} onChange={(e) => setErPeriods(Number(e.target.value))}>
              <option value="1">1 — Annually</option>
              <option value="2">2 — Semi-annually</option>
              <option value="4">4 — Quarterly</option>
              <option value="12">12 — Monthly</option>
              <option value="52">52 — Weekly</option>
              <option value="365">365 — Daily</option>
            </select>
          </div>
        </div>
        {erRate !== 0 && (
          <div className="power-verdict-grid">
            <div className="power-stat">
              <span>If {erRate}% is the nominal rate, the effective rate is</span>
              <strong className="positive">{effAnnual.toFixed(3)}%</strong>
            </div>
            <div className="power-stat">
              <span>If {erRate}% is the effective rate, the nominal rate is</span>
              <strong>{nominalEquiv.toFixed(3)}%</strong>
            </div>
          </div>
        )}
        <p className="power-tool-note">
          Nominal → effective: (1 + r/n)<sup>n</sup> − 1. Lenders often quote the nominal (lower-sounding) figure;
          the effective rate is the honest cost of a debt or the real yield on savings. This is a rate conversion
          only — it doesn't account for fees.
        </p>
      </div>
      )}

      {activeSubTab === 'leaseVsBuy' && (
      <div className="power-tool-card">
        <h3>🚙 Lease vs. Buy a Car</h3>
        <p className="power-tool-desc">Over the same period: buying costs you depreciation plus finance interest but leaves you owning the residual; leasing costs the payments and leaves you with nothing.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Car Price ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={lvbPrice} onChange={(e) => setLvbPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Deposit if Buying ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={lvbDeposit} onChange={(e) => setLvbDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Finance Rate (%)</label>
            <input type="number" min="0" step="0.1" value={lvbFinanceRate} onChange={(e) => setLvbFinanceRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Finance Term (years, 0 = cash)</label>
            <input type="number" min="0" max="10" value={lvbFinanceTerm} onChange={(e) => setLvbFinanceTerm(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Depreciation (%/yr)</label>
            <input type="number" min="0" max="50" step="0.5" value={lvbDepreciation} onChange={(e) => setLvbDepreciation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Comparison Period (years)</label>
            <input type="number" min="1" max="15" value={lvbPeriod} onChange={(e) => setLvbPeriod(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Lease Upfront ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={lvbLeaseUpfront} onChange={(e) => setLvbLeaseUpfront(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Lease Payment ({country.symbol}/mo)</label>
            <input type="number" min="0" step="500" value={lvbLeaseMonthly} onChange={(e) => setLvbLeaseMonthly(Number(e.target.value))} />
          </div>
        </div>
        {lvbPrice > 0 && lvbLeaseMonthly > 0 && (
          <>
            <div className={`power-verdict ${leaseBuy.buyIsCheaper ? 'invest' : 'debt'}`}>
              Over {lvbPeriod} years, {leaseBuy.buyIsCheaper ? 'buying' : 'leasing'} is cheaper by about {country.symbol} {Math.round(leaseBuy.difference).toLocaleString()}.
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Buy — Net Cost (depreciation + interest)</span>
                <strong className={leaseBuy.buyIsCheaper ? 'positive' : 'warn'}>{country.symbol} {Math.round(leaseBuy.buyNetCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Buy — Car Still Worth</span>
                <strong>{country.symbol} {Math.round(leaseBuy.residualValue).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Lease — Total Cost</span>
                <strong className={!leaseBuy.buyIsCheaper ? 'positive' : 'warn'}>{country.symbol} {Math.round(leaseBuy.leaseCost).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              Buying's "net cost" is what the car loses in value over the period plus finance interest — you still hold
              the residual after. Leasing usually includes maintenance and a warranty that buying doesn't; it also caps
              your mileage and leaves nothing at the end. Insurance and fuel are the same either way and aren't modelled.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'retireGap' && (
      <div className="power-tool-card">
        <h3>📊 Retirement Income Gap</h3>
        <p className="power-tool-desc">You've a number in mind for the pot you'll retire with. At your withdrawal rate, does the income it throws off actually cover what you want to spend?</p>
        <div className="power-form">
          <div className="form-group">
            <label>Projected Pot at Retirement ({country.symbol})</label>
            <input type="number" min="0" step="100000" value={rgPot} onChange={(e) => setRgPot(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Income You Want ({country.symbol}/yr, today's money)</label>
            <input type="number" min="0" step="10000" value={rgTarget} onChange={(e) => setRgTarget(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="safeWithdrawalRate">Safe Withdrawal Rate</Term> (%)</label>
            <input type="number" min="1" max="10" step="0.1" value={rgSwr} onChange={(e) => setRgSwr(Number(e.target.value))} />
          </div>
        </div>
        {rgPot > 0 && rgTarget > 0 && (
          <>
            <div className={`power-verdict ${retireGap.onTrack ? 'invest' : 'debt'}`}>
              {retireGap.onTrack
                ? `On track. At ${rgSwrShown}%, ${country.symbol} ${Math.round(rgPot).toLocaleString()} throws off about ${country.symbol} ${Math.round(retireGap.incomeFromPot).toLocaleString()}/yr — ${country.symbol} ${Math.round(-retireGap.annualGap).toLocaleString()} more than the ${country.symbol} ${Math.round(rgTarget).toLocaleString()} you want.`
                : `Short by about ${country.symbol} ${Math.round(retireGap.annualGap).toLocaleString()}/yr — that pot gives ${country.symbol} ${Math.round(retireGap.incomeFromPot).toLocaleString()}/yr (${retireGap.coverageRatio.toFixed(0)}% of your target). Closing the gap needs roughly ${country.symbol} ${Math.round(retireGap.capitalGap).toLocaleString()} more capital.`}
            </div>
            <p className="power-tool-note">
              Uses the same {rgSwrShown}% rule as the FIRE Number tool. "Projected pot" is your own figure — get it from the
              Calculator tab or the FIRE / Coast FIRE tools. Doesn't model tax on withdrawals or any state/employer
              pension you'll also receive — subtract those from the income you want first.
            </p>

            {!retireGap.onTrack && (
              <div className="power-subsection">
                <h4>How long to close it?</h4>
                <p className="power-tool-desc">If you saved extra on top of what's already projected, growing at some rate, how long until it makes up the {country.symbol} {Math.round(retireGap.capitalGap).toLocaleString()} shortfall?</p>
                <div className="power-form">
                  <div className="form-group">
                    <label>Extra Savings ({country.symbol}/mo)</label>
                    <input type="number" min="0" step="500" value={rgExtraMonthly} onChange={(e) => setRgExtraMonthly(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Growth Rate (%/yr)</label>
                    <input type="number" step="0.1" value={rgCloseRate} onChange={(e) => setRgCloseRate(Number(e.target.value))} />
                  </div>
                </div>
                {rgExtraMonthly > 0 && rgCloseGap && (
                  <div className={`power-verdict ${rgCloseGap.reachable ? 'invest' : 'danger'}`}>
                    {rgCloseGap.reachable
                      ? `About ${monthsToYearsLabel(rgCloseGap.months)} (${rgCloseGap.months} months) of saving an extra ${country.symbol}${rgExtraMonthly.toLocaleString()}/month at ${rgCloseRate}%/yr would close the gap.`
                      : `At ${country.symbol}${rgExtraMonthly.toLocaleString()}/month and ${rgCloseRate}%/yr, this doesn't close the gap within 100 years — a bigger monthly amount, a higher return, or a lower target income is needed.`}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      )}

      {activeSubTab === 'depositTimeline' && (
      <div className="power-tool-card">
        <h3>🕐 Deposit Savings Timeline</h3>
        <p className="power-tool-desc">How long until you've saved a home deposit, given what you can put away each month and a modest savings rate on the balance.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Home Price ({country.symbol})</label>
            <input type="number" min="0" step="50000" value={dtPrice} onChange={(e) => setDtPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Deposit (% of price)</label>
            <input type="number" min="0" max="100" step="1" value={dtPercent} onChange={(e) => setDtPercent(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>You Can Save ({country.symbol}/mo)</label>
            <input type="number" min="0" step="500" value={dtMonthly} onChange={(e) => setDtMonthly(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Already Saved ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={dtSaved} onChange={(e) => setDtSaved(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Savings Account Rate (%/yr)</label>
            <input type="number" min="0" step="0.1" value={dtRate} onChange={(e) => setDtRate(Number(e.target.value))} />
          </div>
        </div>
        {dtPrice > 0 && dtPercent > 0 && (
          <>
            <div className={`power-verdict ${depositTimeline.months === null ? 'danger' : depositTimeline.alreadyThere || depositTimeline.months <= 36 ? 'invest' : 'debt'}`}>
              {depositTimeline.alreadyThere
                ? `You've already got the ${country.symbol} ${Math.round(depositTimeline.targetAmount).toLocaleString()} deposit saved.`
                : depositTimeline.months === null
                  ? `With nothing going in each month, this deposit never gets saved — set a monthly amount.`
                  : `About ${depositTimeline.months} months (${(depositTimeline.months / 12).toFixed(1)} years) to save the ${country.symbol} ${Math.round(depositTimeline.targetAmount).toLocaleString()} deposit (${dtPercent}% of ${country.symbol} ${Math.round(dtPrice).toLocaleString()}).`}
            </div>
            {depositTimeline.months != null && depositTimeline.months > 0 && (
              <p className="power-tool-note">
                The balance earns {dtRate}% along the way ({country.symbol} {Math.round(depositTimeline.interestEarned).toLocaleString()} of the total). House prices move too — a longer timeline is a moving target. To size the
                bond the remaining balance would need, use the Home Affordability tool; to plan a fixed-date goal, use
                the Sinking Fund tool.
              </p>
            )}
          </>
        )}
      </div>
      )}

      {activeSubTab === 'realReturn' && (
      <div className="power-tool-card">
        <h3>📉 Real (After-Tax, After-Inflation) Return</h3>
        <p className="power-tool-desc">A headline return is not what your money actually earns. Take tax off the gains, divide out inflation, and see what's left growing your purchasing power.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Nominal Return (%/yr)</label>
            <input type="number" step="0.1" value={rrNominal} onChange={(e) => setRrNominal(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="inflation">Inflation</Term> (%/yr)</label>
            <input type="number" step="0.1" value={rrInflation} onChange={(e) => setRrInflation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Tax on Gains (%)</label>
            <input type="number" min="0" max="100" step="1" value={rrTax} onChange={(e) => setRrTax(Number(e.target.value))} />
          </div>
        </div>
        {rrNominal !== 0 && (
          <>
            <div className={`power-verdict ${realRet.losesToInflation ? 'danger' : realRet.realRate < 1 ? 'debt' : 'invest'}`}>
              Your {rrNominal}% nominal return is {realRet.afterTaxNominal.toFixed(1)}% after {rrTax}% tax, and about{' '}
              <strong>{realRet.realRate.toFixed(1)}% real</strong> once {rrInflation}% inflation is taken out.
              {realRet.losesToInflation ? ' At this rate your money is losing purchasing power.' : ''}
            </div>
            <p className="power-tool-note">
              Uses the exact (1 + after-tax) ÷ (1 + inflation) − 1 identity. The rough "just subtract" shortcut would
              say {realRet.roughApprox.toFixed(1)}% — it skips the interaction between the two rates (at normal
              positive inflation that makes it slightly optimistic). Inside a {country.wrapperLabel && country.wrapperLabel !== 'N/A' ? country.wrapperLabel : 'tax-free wrapper'} the
              tax line is 0, so set it to 0 to see the sheltered real return.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'debtConsol' && (
      <div className="power-tool-card">
        <h3>🔗 Debt Consolidation</h3>
        <p className="power-tool-desc">Rolling several debts into one loan can lower the rate and free up monthly cash — or just stretch the term and cost more overall. This compares keeping them as they are against one consolidation loan.</p>
        <div className="dc-rows">
          {dcRows.map((r, i) => (
            <div className="dc-row" key={r.id}>
              <span className="dc-row-num">{i + 1}</span>
              <div className="form-group">
                <label>Balance ({country.symbol})</label>
                <input type="number" min="0" step="1000" value={r.balance} onChange={(e) => updateDcRow(r.id, 'balance', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Rate (%/yr)</label>
                <input type="number" min="0" step="0.5" value={r.rate} onChange={(e) => updateDcRow(r.id, 'rate', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>You Pay ({country.symbol}/mo)</label>
                <input type="number" min="0" step="100" value={r.minPayment} onChange={(e) => updateDcRow(r.id, 'minPayment', Number(e.target.value))} />
              </div>
              <button className="dc-row-remove" onClick={() => removeDcRow(r.id)} disabled={dcRows.length <= 1} aria-label={`Remove debt ${i + 1}`}>×</button>
            </div>
          ))}
          {dcRows.length < 6 && <button className="power-use-fire-btn" onClick={addDcRow}>+ Add another debt</button>}
        </div>
        <div className="power-form">
          <div className="form-group">
            <label>Consolidation Loan Rate (%/yr)</label>
            <input type="number" min="0" step="0.5" value={dcNewRate} onChange={(e) => setDcNewRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Consolidation Loan Term (years)</label>
            <input type="number" min="1" max="30" step="1" value={dcNewTerm} onChange={(e) => setDcNewTerm(Number(e.target.value))} />
          </div>
        </div>
        {dcHasDebts && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Combined balance</span>
                <strong>{country.symbol} {Math.round(debtConsol.totalBalance).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>New monthly payment</span>
                <strong>{country.symbol} {Math.round(debtConsol.consolidatedMonthly).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Now paying</span>
                <strong>{country.symbol} {Math.round(debtConsol.currentMonthly).toLocaleString()}/mo</strong>
              </div>
            </div>
            <div className={`power-verdict ${debtConsol.interestSaved == null ? 'neutral' : debtConsol.interestSaved > 0 ? 'invest' : 'debt'}`}>
              {debtConsol.anyNeverPaysOff
                ? `At least one debt's current payment barely covers its interest, so "keeping things as they are" never actually clears — consolidating at ${dcNewRate}% over ${dcNewTerm} years pays it off for about ${country.symbol} ${Math.round(debtConsol.consolidatedMonthly).toLocaleString()}/mo and ${country.symbol} ${Math.round(debtConsol.consolidatedInterest).toLocaleString()} total interest.`
                : debtConsol.interestSaved > 0
                  ? `Consolidating saves about ${country.symbol} ${Math.round(debtConsol.interestSaved).toLocaleString()} in interest${debtConsol.monthsSaved > 0 ? ` and clears the debt ${debtConsol.monthsSaved} months sooner` : ''}${debtConsol.monthlyDifference > 0 ? `, while freeing up about ${country.symbol} ${Math.round(debtConsol.monthlyDifference).toLocaleString()}/mo` : ''}.`
                  : `Consolidating costs about ${country.symbol} ${Math.round(-debtConsol.interestSaved).toLocaleString()} MORE in interest over the life of the loan — the lower monthly payment (${country.symbol} ${Math.round(debtConsol.monthlyDifference).toLocaleString()}/mo freed up) is bought with a longer term. Only worth it if the cash-flow relief matters more than the total cost.`}
            </div>
            <p className="power-tool-note">
              "You Pay" is your current actual monthly payment per debt (for a credit card, roughly its minimum). The current-path figure runs each debt independently at that payment; the consolidation figure is one amortising loan for the combined balance. Doesn't model an origination/initiation fee on the new loan — add that to the balance if it's significant. Not advice.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'homeCosts' && (
      <div className="power-tool-card">
        <h3>🏦 Home Buying — Upfront Costs</h3>
        <p className="power-tool-desc">The cash you need on the day, over and above the deposit: {country.code === 'za' ? 'transfer duty, the transferring and bond attorneys, and the deeds office' : 'purchase tax and professional fees'}. A bond calculator never shows these.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Purchase Price ({country.symbol})</label>
            <input type="number" min="0" step="50000" value={hcPrice} onChange={(e) => setHcPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Deposit ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={hcDeposit} onChange={(e) => setHcDeposit(Number(e.target.value))} />
          </div>
        </div>
        {hcPrice > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{country.code === 'za' ? 'Transfer duty' : 'Purchase tax'}</span>
                <strong>{country.symbol} {Math.round(homeCosts.transferDuty).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{country.code === 'za' ? 'Attorneys + deeds office' : 'Professional fees'}</span>
                <strong>{country.symbol} {Math.round(homeCosts.transferAttorney + homeCosts.bondRegistration + homeCosts.deedsOffice).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Total fees</span>
                <strong className="warn">{country.symbol} {Math.round(homeCosts.totalFees).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Cash needed upfront</span>
                <strong>{country.symbol} {Math.round(homeCosts.cashNeededUpfront).toLocaleString()}</strong>
              </div>
            </div>
            <div className="power-verdict neutral">
              On a {country.symbol} {Math.round(hcPrice).toLocaleString()} home you'd need about <strong>{country.symbol} {Math.round(homeCosts.cashNeededUpfront).toLocaleString()}</strong> in cash on transfer day — the {country.symbol} {Math.round(hcDeposit).toLocaleString()} deposit plus {country.symbol} {Math.round(homeCosts.totalFees).toLocaleString()} of fees ({homeCosts.feesAsPctOfPrice.toFixed(1)}% of the price).
            </div>
            <p className="power-tool-note">
              {country.code === 'za'
                ? 'Transfer duty uses the SARS natural-person brackets (indicative, 2026/27); attorney and deeds-office figures approximate the recommended conveyancing tariff. Not a conveyancer’s quote — bond initiation fees, rates clearance, and levy advances vary. Buying through a company or trust is taxed differently.'
                : 'Outside South Africa this uses a single purchase-tax percentage plus a professional-fee allowance — refine it with your actual local stamp duty / land tax and solicitor quote.'}
              {' '}Pair with the Deposit Timeline tool to see how long the cash takes to save.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'bonusTax' && (
      <div className="power-tool-card">
        <h3>🎉 Bonus / 13th Cheque — Take-Home</h3>
        <p className="power-tool-desc">A bonus sits on top of your salary, so it's taxed entirely at your marginal rate — the rate on your top slice of income. This is how much actually lands in your account.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Annual Salary ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={btSalary} onChange={(e) => setBtSalary(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Bonus Amount ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={btBonus} onChange={(e) => setBtBonus(Number(e.target.value))} />
          </div>
        </div>
        {country.taxBrackets && (
          <label className="mc-compare-toggle">
            <input type="checkbox" checked={btProgressive} onChange={(e) => setBtProgressive(e.target.checked)} />
            Use {country.name}'s progressive brackets instead of the flat {country.taxRate}% estimate
          </label>
        )}
        {btBonus > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Tax on the bonus</span>
                <strong className="warn">{country.symbol} {Math.round(bonusTax.taxOnBonus).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>You actually keep</span>
                <strong className="positive">{country.symbol} {Math.round(bonusTax.netBonus).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Marginal rate</span>
                <strong>{bonusTax.marginalRatePct.toFixed(0)}%</strong>
              </div>
            </div>
            <div className="power-verdict debt">
              Of a {country.symbol} {Math.round(btBonus).toLocaleString()} bonus you keep about <strong>{country.symbol} {Math.round(bonusTax.netBonus).toLocaleString()}</strong> ({bonusTax.keepPct.toFixed(0)}%) — {country.symbol} {Math.round(bonusTax.taxOnBonus).toLocaleString()} goes to tax at an average {bonusTax.averageRateOnBonusPct.toFixed(0)}% across the bonus.
            </div>
            <p className="power-tool-note">
              {btProgressive && country.taxBrackets
                ? (country.taxBracketsNote || `${country.name}'s progressive bracket schedule — illustrative only.`)
                : `Flat ${country.taxRate}% estimate. Turn on progressive brackets above (where available) for a marginal figure.`}
              {' '}Ignores UIF/pension/medical-aid deductions and any employer withholding quirks — it's the income-tax bite only. To invest what's left, drop the net figure into the Windfall Split tool.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'raOptimizer' && (
      <div className="power-tool-card">
        <h3>🧾 Retirement Annuity — Tax Optimizer</h3>
        <p className="power-tool-desc">South Africa lets you deduct retirement-fund contributions up to 27.5% of income, capped at {country.symbol}350,000/yr. This works out how much more you could put in to reach that ceiling — and the tax the fiscus effectively refunds on it.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Taxable Income ({country.symbol}/yr)</label>
            <input type="number" min="0" step="10000" value={raIncome} onChange={(e) => setRaIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>RA / Pension Contributions So Far ({country.symbol}/yr)</label>
            <input type="number" min="0" step="5000" value={raCurrent} onChange={(e) => setRaCurrent(Number(e.target.value))} />
          </div>
        </div>
        {country.taxBrackets && (
          <label className="mc-compare-toggle">
            <input type="checkbox" checked={raProgressive} onChange={(e) => setRaProgressive(e.target.checked)} />
            Use {country.name}'s progressive brackets for the tax-saving figure
          </label>
        )}
        {raIncome > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Deductible ceiling</span>
                <strong>{country.symbol} {Math.round(raResult.maxDeductible).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Room left this year</span>
                <strong className={raResult.roomRemaining > 0 ? 'positive' : ''}>{country.symbol} {Math.round(raResult.roomRemaining).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Tax saved if you max it</span>
                <strong className="positive">{country.symbol} {Math.round(raResult.taxSavingIfMaxed).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${raResult.alreadyOverLimit ? 'neutral' : 'invest'}`}>
              {raResult.alreadyOverLimit
                ? `You're already contributing at or above the ${country.symbol}${Math.round(raResult.maxDeductible).toLocaleString()} deductible limit — extra contributions still grow tax-free but no longer cut this year's tax bill.`
                : `Contributing another ${country.symbol} ${Math.round(raResult.roomRemaining).toLocaleString()} this year gets you to the ceiling and cuts your tax by about ${country.symbol} ${Math.round(raResult.taxSavingIfMaxed).toLocaleString()} — an effective ${raResult.effectiveReliefPct.toFixed(0)}% discount, so the real out-of-pocket cost is about ${country.symbol} ${Math.round(raResult.netCostIfMaxed).toLocaleString()}.`}
            </div>
            <p className="power-tool-note">
              Limit is 27.5% of the greater of taxable income or remuneration, capped at {country.symbol}350,000 — here bound by the {raResult.limitedBy === 'cap' ? `${country.symbol}350k cap` : '27.5% rate'}. Doesn't model the tax on the eventual retirement income (see the Pre-Tax Retirement tool for that side). Not advice.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'seqRisk' && (
      <div className="power-tool-card">
        <h3>🎢 Sequence-of-Returns Risk</h3>
        <p className="power-tool-desc">Two retirees earn the <em>same average return</em>, but one hits a bad run early — while the pot is largest and being drawn down. This shows how much that timing alone changes how long the money lasts.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Starting Pot ({country.symbol})</label>
            <input type="number" min="0" step="100000" value={sqPot} onChange={(e) => setSqPot(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Withdrawal ({country.symbol}/yr, year 1)</label>
            <input type="number" min="0" step="10000" value={sqWithdrawal} onChange={(e) => setSqWithdrawal(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Retirement Length (years)</label>
            <input type="number" min="1" max="60" step="1" value={sqYears} onChange={(e) => setSqYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Average Return (%/yr)</label>
            <input type="number" step="0.5" value={sqAvgReturn} onChange={(e) => setSqAvgReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Bad-Year Return (%/yr)</label>
            <input type="number" step="0.5" value={sqBadReturn} onChange={(e) => setSqBadReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>How Many Bad Years</label>
            <input type="number" min="0" max="20" step="1" value={sqBadYears} onChange={(e) => setSqBadYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="inflation">Inflation</Term> on Withdrawals (%/yr)</label>
            <input type="number" min="0" step="0.5" value={sqInflation} onChange={(e) => setSqInflation(Number(e.target.value))} />
          </div>
        </div>
        {sqPot > 0 && sqWithdrawal > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Bad years FIRST — pot lasts</span>
                <strong className="warn">{seqResult.earlyLosses.yearsLasted} yrs</strong>
              </div>
              <div className="power-stat">
                <span>Bad years LAST — pot lasts</span>
                <strong className="positive">{seqResult.lateLosses.depleted ? `${seqResult.lateLosses.yearsLasted} yrs` : `${seqResult.horizonYears}+ yrs`}</strong>
              </div>
              <div className="power-stat">
                <span>Good-year return (implied)</span>
                <strong>{seqResult.goodYearReturn.toFixed(1)}%</strong>
              </div>
            </div>
            <div className={`power-verdict ${seqResult.bothSurvive ? 'invest' : seqResult.yearsGap >= 3 ? 'danger' : 'debt'}`}>
              {seqResult.bothSurvive
                ? `This pot survives the full ${seqResult.horizonYears} years either way — it's comfortably funded against sequence risk at this withdrawal.`
                : `Same ${sqAvgReturn}% average, but hitting the ${sqBadYears} bad years first drains the pot ${seqResult.yearsGap} year${seqResult.yearsGap === 1 ? '' : 's'} sooner than hitting them last (${seqResult.earlyLosses.yearsLasted} vs ${seqResult.lateLosses.depleted ? seqResult.lateLosses.yearsLasted : `${seqResult.horizonYears}+`} years). That gap is sequence-of-returns risk — an average return figure hides it entirely.`}
            </div>
            <p className="power-tool-note">
              The good years' return is solved so the arithmetic mean across all {seqResult.horizonYears} years equals your {sqAvgReturn}% average — a fair like-for-like. A deterministic illustration of one ordering, not a probability (that's the Monte Carlo tab's drawdown mode). Withdrawals come off at the start of each year, rising {sqInflation}%/yr.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'twoPot' && (
      <div className="power-tool-card">
        <h3>🫙 Two-Pot Retirement — Cost of Withdrawing</h3>
        <p className="power-tool-desc">South Africa's two-pot system lets you dip into the savings pot before retirement. It costs you twice: the withdrawal is taxed at your marginal rate now, and you forfeit everything it would have compounded to by retirement.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Amount to Withdraw ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={tpAmount} onChange={(e) => setTpAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Your Taxable Income ({country.symbol}/yr)</label>
            <input type="number" min="0" step="10000" value={tpIncome} onChange={(e) => setTpIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years Until Retirement</label>
            <input type="number" min="0" max="60" step="1" value={tpYearsToRetire} onChange={(e) => setTpYearsToRetire(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Expected Growth (%/yr)</label>
            <input type="number" step="0.5" value={tpGrowth} onChange={(e) => setTpGrowth(Number(e.target.value))} />
          </div>
        </div>
        {country.taxBrackets && (
          <label className="mc-compare-toggle">
            <input type="checkbox" checked={tpProgressive} onChange={(e) => setTpProgressive(e.target.checked)} />
            Use {country.name}'s progressive brackets for the tax figure
          </label>
        )}
        {tpAmount > 0 && tpAmount < TWO_POT_MIN_WITHDRAWAL && (
          <div className="power-verdict danger">
            ⚠️ Below the R{TWO_POT_MIN_WITHDRAWAL.toLocaleString()} minimum -- the two-pot rules don't allow a savings-pot withdrawal smaller than this.
          </div>
        )}
        {tpAmount >= TWO_POT_MIN_WITHDRAWAL && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Tax on the withdrawal</span>
                <strong className="warn">{country.symbol} {Math.round(twoPot.taxOnWithdrawal).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Cash you actually get</span>
                <strong>{country.symbol} {Math.round(twoPot.netCashNow).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Retirement value given up</span>
                <strong className="warn">{country.symbol} {Math.round(twoPot.futureValueForgone).toLocaleString()}</strong>
              </div>
            </div>
            <div className="power-verdict danger">
              Withdrawing {country.symbol} {Math.round(tpAmount).toLocaleString()} nets you {country.symbol} {Math.round(twoPot.netCashNow).toLocaleString()} after {twoPot.marginalRatePct.toFixed(0)}% tax — but that money would have grown to about <strong>{country.symbol} {Math.round(twoPot.futureValueForgone).toLocaleString()}</strong> by retirement. Every spendable rand today costs roughly {country.symbol}{twoPot.costPerRandTaken.toFixed(2)} of future retirement money.
            </div>
            <p className="power-tool-note">
              SA two-pot rules. Tax is at your marginal rate (the withdrawal stacks on your income), not the retirement lump-sum tables. "Value given up" grows the gross amount at {tpGrowth}%/yr for {Math.round(tpYearsToRetire)} years with no further contributions. Ignores any SARS admin fee on the withdrawal. Only one savings-pot withdrawal is allowed per tax year -- the current one ({tpTaxYear.label}) ends {tpTaxYear.endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}. Not advice — dipping in during genuine hardship can still be the right call.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'loanCompare' && (
      <div className="power-tool-card">
        <h3>⚖️ Loan Offer Comparison</h3>
        <p className="power-tool-desc">Two offers for the same amount, compared on what they actually cost once the term and every fee are counted — not just the headline rate.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Amount to Borrow ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={lcAmount} onChange={(e) => setLcAmount(Number(e.target.value))} />
          </div>
        </div>
        <div className="dc-rows">
          <div className="dc-row">
            <span className="dc-row-num">A</span>
            <div className="form-group"><label>Rate (%/yr)</label><input type="number" step="0.5" value={lcaRate} onChange={(e) => setLcaRate(Number(e.target.value))} /></div>
            <div className="form-group"><label>Term (yrs)</label><input type="number" min="1" max="30" value={lcaTerm} onChange={(e) => setLcaTerm(Number(e.target.value))} /></div>
            <div className="form-group"><label>Upfront fee ({country.symbol})</label><input type="number" min="0" step="500" value={lcaUpfront} onChange={(e) => setLcaUpfront(Number(e.target.value))} /></div>
            <div className="form-group"><label>Monthly fee ({country.symbol})</label><input type="number" min="0" step="10" value={lcaMonthly} onChange={(e) => setLcaMonthly(Number(e.target.value))} /></div>
          </div>
          <div className="dc-row">
            <span className="dc-row-num">B</span>
            <div className="form-group"><label>Rate (%/yr)</label><input type="number" step="0.5" value={lcbRate} onChange={(e) => setLcbRate(Number(e.target.value))} /></div>
            <div className="form-group"><label>Term (yrs)</label><input type="number" min="1" max="30" value={lcbTerm} onChange={(e) => setLcbTerm(Number(e.target.value))} /></div>
            <div className="form-group"><label>Upfront fee ({country.symbol})</label><input type="number" min="0" step="500" value={lcbUpfront} onChange={(e) => setLcbUpfront(Number(e.target.value))} /></div>
            <div className="form-group"><label>Monthly fee ({country.symbol})</label><input type="number" min="0" step="10" value={lcbMonthly} onChange={(e) => setLcbMonthly(Number(e.target.value))} /></div>
          </div>
        </div>
        {lcAmount > 0 && loanCompare.a && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Offer A — total cost</span>
                <strong className={loanCompare.cheaper === 'A' ? 'positive' : ''}>{country.symbol} {Math.round(loanCompare.a.totalCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Offer B — total cost</span>
                <strong className={loanCompare.cheaper === 'B' ? 'positive' : ''}>{country.symbol} {Math.round(loanCompare.b.totalCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Monthly: A vs B</span>
                <strong>{country.symbol} {Math.round(loanCompare.a.monthlyPayment).toLocaleString()} / {Math.round(loanCompare.b.monthlyPayment).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${loanCompare.cheaper === 'tie' ? 'neutral' : 'invest'}`}>
              {loanCompare.cheaper === 'tie'
                ? 'Both offers cost the same all-in. Pick on flexibility, service, or early-settlement terms.'
                : `Offer ${loanCompare.cheaper} is cheaper overall by about ${country.symbol} ${Math.round(loanCompare.totalCostSaving).toLocaleString()} across the life of the loan${loanCompare.monthlyDifference > 1 ? `, though its monthly differs by about ${country.symbol} ${Math.round(loanCompare.monthlyDifference).toLocaleString()}` : ''}.`}
            </div>
            <p className="power-tool-note">
              All-in cost = principal + total interest + every fee. The "all-in %" is a rough comparative rate, not a regulated APR/APRC. Assumes each loan runs its full term with no early settlement.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'subCost' && (
      <div className="power-tool-card">
        <h3>🔁 What a Subscription Really Costs</h3>
        <p className="power-tool-desc">A small monthly charge is an annual cost that creeps up with inflation — and every rand of it is a rand not compounding somewhere else.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Monthly Cost ({country.symbol})</label>
            <input type="number" min="0" step="10" value={scMonthly} onChange={(e) => setScMonthly(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Over How Many Years</label>
            <input type="number" min="1" max="60" step="1" value={scYears} onChange={(e) => setScYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>If Invested Instead (%/yr)</label>
            <input type="number" step="0.5" value={scReturn} onChange={(e) => setScReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Annual Price Increase (%)</label>
            <input type="number" min="0" step="0.5" value={scIncrease} onChange={(e) => setScIncrease(Number(e.target.value))} />
          </div>
        </div>
        {scMonthly > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Costs you now</span>
                <strong>{country.symbol} {Math.round(subCost.annualCostNow).toLocaleString()}/yr</strong>
              </div>
              <div className="power-stat">
                <span>Total paid over {subCost.horizonYears} yrs</span>
                <strong className="warn">{country.symbol} {Math.round(subCost.totalPaid).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>That money invested instead</span>
                <strong className="positive">{country.symbol} {Math.round(subCost.investedInsteadValue).toLocaleString()}</strong>
              </div>
            </div>
            <div className="power-verdict debt">
              {country.symbol}{Math.round(scMonthly).toLocaleString()}/month is {country.symbol}{Math.round(subCost.annualCostNow).toLocaleString()} a year now, about <strong>{country.symbol} {Math.round(subCost.totalPaid).toLocaleString()}</strong> over {subCost.horizonYears} years with {scIncrease}%/yr price rises. Invested at {scReturn}% instead it would be worth {country.symbol} {Math.round(subCost.investedInsteadValue).toLocaleString()} — {country.symbol} {Math.round(subCost.opportunityCost).toLocaleString()} of that is growth you're giving up on top of the cash.
            </div>
            <p className="power-tool-note">
              Worth it or not is your call — this just puts a number on the trade-off. Stack a few subscriptions together to see the real total.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'payback' && (
      <div className="power-tool-card">
        <h3>☀️ Big-Purchase Payback</h3>
        <p className="power-tool-desc">Solar, a heat pump, a borehole, a water tank, a home gym, prepaying an annual plan — a big cost now that saves you money each month. This is when it breaks even, and whether it beats just investing the cash.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Upfront Cost ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={pbCost} onChange={(e) => setPbCost(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Saves You ({country.symbol}/mo)</label>
            <input type="number" min="0" step="100" value={pbSaving} onChange={(e) => setPbSaving(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Upkeep ({country.symbol}/mo)</label>
            <input type="number" min="0" step="50" value={pbMaint} onChange={(e) => setPbMaint(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Useful Life (years)</label>
            <input type="number" min="1" max="50" step="1" value={pbLife} onChange={(e) => setPbLife(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Saving Grows (%/yr)</label>
            <input type="number" step="0.5" value={pbSavingGrowth} onChange={(e) => setPbSavingGrowth(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>If Invested Instead (%/yr)</label>
            <input type="number" step="0.5" value={pbReturn} onChange={(e) => setPbReturn(Number(e.target.value))} />
          </div>
        </div>
        {pbCost > 0 && pbSaving > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Breaks even in</span>
                <strong className={payback.breakEvenMonths ? 'positive' : 'warn'}>
                  {payback.breakEvenMonths ? `${payback.breakEvenYears.toFixed(1)} yrs` : '—'}
                </strong>
              </div>
              <div className="power-stat">
                <span>Net over {Math.round(pbLife)} yrs</span>
                <strong className={payback.lifetimeNet >= 0 ? 'positive' : 'warn'}>{country.symbol} {Math.round(payback.lifetimeNet).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>First-year saving</span>
                <strong>{country.symbol} {Math.round(payback.firstYearSaving).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${payback.neverBreaksEven ? 'danger' : payback.beatsInvesting ? 'invest' : 'debt'}`}>
              {payback.neverBreaksEven
                ? `Upkeep eats the saving — this never pays for itself at these numbers.`
                : payback.breakEvenMonths
                  ? `Pays for itself in about ${payback.breakEvenYears.toFixed(1)} years, then nets roughly ${country.symbol} ${Math.round(payback.lifetimeNet).toLocaleString()} over its ${Math.round(pbLife)}-year life. ${payback.beatsInvesting ? 'It also beats leaving the cash invested at ' + pbReturn + '%.' : 'But leaving the ' + country.symbol + Math.round(pbCost).toLocaleString() + ' invested at ' + pbReturn + '% would have done better — it grows to about ' + country.symbol + Math.round(payback.investedInsteadValue).toLocaleString() + '.'}`
                  : `Doesn't break even within its ${Math.round(pbLife)}-year life at these numbers.`}
            </div>
            <p className="power-tool-note">
              "Breaks even" is the plain cost ÷ net monthly saving. "Beats investing" compounds both the saving stream and the untouched upfront cash at {pbReturn}%/yr and compares — the fair test for a purchase you don't strictly need. Doesn't model resale value, tax, or a finance deal on the purchase itself.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'cashVsFinance' && (
      <div className="power-tool-card">
        <h3>💳 Pay Cash or Finance It?</h3>
        <p className="power-tool-desc">You're buying the thing regardless. Paying cash gives up the growth that cash would have earned; financing costs interest but keeps the cash invested. This compares your wealth at the end of the term either way.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Price ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={cfPrice} onChange={(e) => setCfPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Deposit ({country.symbol})</label>
            <input type="number" min="0" step="5000" value={cfDeposit} onChange={(e) => setCfDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Finance Rate (%/yr)</label>
            <input type="number" step="0.5" value={cfRate} onChange={(e) => setCfRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Finance Term (years)</label>
            <input type="number" min="1" max="10" step="1" value={cfTerm} onChange={(e) => setCfTerm(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Your Invest Return (%/yr)</label>
            <input type="number" step="0.5" value={cfReturn} onChange={(e) => setCfReturn(Number(e.target.value))} />
          </div>
        </div>
        {cfPrice > 0 && cashVsFinance.cheaper && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Finance interest</span>
                <strong className="warn">{country.symbol} {Math.round(cashVsFinance.financeInterest).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Monthly payment</span>
                <strong>{country.symbol} {Math.round(cashVsFinance.monthlyPayment).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Wealth gap after {Math.round(cfTerm)} yrs</span>
                <strong className="positive">{country.symbol} {Math.round(cashVsFinance.gap).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${cashVsFinance.cheaper === 'tie' ? 'neutral' : 'invest'}`}>
              {cashVsFinance.cheaper === 'tie'
                ? `At a ${cfReturn}% return vs a ${cfRate}% finance rate it's basically a wash — decide on cash-flow comfort and flexibility.`
                : cashVsFinance.cheaper === 'cash'
                  ? `Paying cash comes out about ${country.symbol} ${Math.round(cashVsFinance.gap).toLocaleString()} ahead over ${Math.round(cfTerm)} years — your ${cfReturn}% return doesn't beat the ${cfRate}% finance cost, so the interest outweighs the growth you'd keep.`
                  : `Financing and keeping the cash invested comes out about ${country.symbol} ${Math.round(cashVsFinance.gap).toLocaleString()} ahead — your ${cfReturn}% return beats the ${cfRate}% finance rate, so the growth outweighs the interest.`}
            </div>
            <p className="power-tool-note">
              Both paths end owning the same asset, so its value cancels — this compares only the money. Break-even is roughly when your return equals the finance rate ({cashVsFinance.breakEvenReturnApprox}%). Ignores initiation fees and any cash-price discount a dealer might give.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'fundFees' && (
      <div className="power-tool-card">
        <h3>⚖️ Fund Fee Face-off</h3>
        <p className="power-tool-desc">Two funds, head to head, over your contribution schedule. A half-percent of annual fee looks trivial; over decades it quietly compounds into a real gap. Distinct from Fee Drag, which compares one fund against a zero-fee ideal.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Starting Amount ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={ffInitial} onChange={(e) => setFfInitial(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Monthly Contribution ({country.symbol})</label>
            <input type="number" min="0" step="500" value={ffMonthly} onChange={(e) => setFfMonthly(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Years</label>
            <input type="number" min="1" max="60" step="1" value={ffYears} onChange={(e) => setFfYears(Number(e.target.value))} />
          </div>
        </div>
        <div className="dc-rows">
          <div className="dc-row">
            <span className="dc-row-num">A</span>
            <div className="form-group"><label>Gross return (%/yr)</label><input type="number" step="0.1" value={ffGrossA} onChange={(e) => setFfGrossA(Number(e.target.value))} /></div>
            <div className="form-group"><label>Total fee / TER (%/yr)</label><input type="number" min="0" step="0.05" value={ffTerA} onChange={(e) => setFfTerA(Number(e.target.value))} /></div>
          </div>
          <div className="dc-row">
            <span className="dc-row-num">B</span>
            <div className="form-group"><label>Gross return (%/yr)</label><input type="number" step="0.1" value={ffGrossB} onChange={(e) => setFfGrossB(Number(e.target.value))} /></div>
            <div className="form-group"><label>Total fee / TER (%/yr)</label><input type="number" min="0" step="0.05" value={ffTerB} onChange={(e) => setFfTerB(Number(e.target.value))} /></div>
          </div>
        </div>
        {(ffInitial > 0 || ffMonthly > 0) && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Fund A ends with</span>
                <strong className={fundFees.winner === 'A' ? 'positive' : ''}>{country.symbol} {Math.round(fundFees.a.finalBalance).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Fund B ends with</span>
                <strong className={fundFees.winner === 'B' ? 'positive' : ''}>{country.symbol} {Math.round(fundFees.b.finalBalance).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Gap after {Math.round(ffYears)} yrs</span>
                <strong className="warn">{country.symbol} {Math.round(fundFees.endingGap).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${fundFees.winner === 'tie' ? 'neutral' : 'invest'}`}>
              {fundFees.winner === 'tie'
                ? 'The two funds land in the same place — decide on tracking quality, spread, or provider.'
                : `Fund ${fundFees.winner} ends about ${country.symbol} ${Math.round(fundFees.endingGap).toLocaleString()} ahead over ${Math.round(ffYears)} years. Fund A hands over ${country.symbol} ${Math.round(fundFees.a.feeCost).toLocaleString()} in fees along the way vs Fund B's ${country.symbol} ${Math.round(fundFees.b.feeCost).toLocaleString()}.`}
            </div>
            <p className="power-tool-note">
              Net return = gross − TER, run through the app's compounding engine, pre-tax / in a wrapper. "Fee cost" is each fund vs a zero-TER version of itself. Real funds also differ on tracking error, bid-offer spread, and platform fees — fold those into the TER to compare fairly.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'contractRate' && (
      <div className="power-tool-card">
        <h3>🧑‍💻 Contractor / Freelance Rate</h3>
        <p className="power-tool-desc">Thinking of going independent? A contractor gives up paid leave, sick days, and benefits, pays their own tax, and can't bill every hour. This works your target take-home back up into the rate you'd need to charge.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Target Take-Home ({country.symbol}/yr)</label>
            <input type="number" min="0" step="20000" value={crTakeHome} onChange={(e) => setCrTakeHome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Your Tax Rate (%)</label>
            <input type="number" min="0" max="60" step="1" value={crTaxRate} onChange={(e) => setCrTaxRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Benefits to Self-Fund (% of pay)</label>
            <input type="number" min="0" max="50" step="1" value={crBenefits} onChange={(e) => setCrBenefits(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Billable Weeks / Year</label>
            <input type="number" min="1" max="52" step="1" value={crWeeks} onChange={(e) => setCrWeeks(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Hours / Week</label>
            <input type="number" min="1" max="80" step="1" value={crHours} onChange={(e) => setCrHours(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Utilisation (% of hours billed)</label>
            <input type="number" min="1" max="100" step="5" value={crUtil} onChange={(e) => setCrUtil(Number(e.target.value))} />
          </div>
        </div>
        {crTakeHome > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Rate you'd charge</span>
                <strong className="positive">{country.symbol} {Math.round(contractRate.hourlyRate).toLocaleString()}/hr</strong>
              </div>
              <div className="power-stat">
                <span>Roughly per day</span>
                <strong>{country.symbol} {Math.round(contractRate.dailyRate).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Revenue you need</span>
                <strong>{country.symbol} {Math.round(contractRate.grossRevenueNeeded).toLocaleString()}/yr</strong>
              </div>
            </div>
            <div className="power-verdict invest">
              To take home {country.symbol} {Math.round(crTakeHome).toLocaleString()} you'd need to bill about <strong>{country.symbol} {Math.round(contractRate.hourlyRate).toLocaleString()}/hour</strong> ({country.symbol} {Math.round(contractRate.dailyRate).toLocaleString()}/day) across {Math.round(contractRate.billableHoursPerYear).toLocaleString()} billable hours a year — roughly {(contractRate.upliftVsNaive * 100).toFixed(0)}% more than a naive "salary ÷ 2,080 hours" rate, which is the cost of leave, bench time, and self-funded overhead.
            </div>
            <p className="power-tool-note">
              Tax rate is your effective rate on gross (income tax plus any self-paid contributions). Benefits loading covers a pension match, medical subsidy, and insurance you'd now pay yourself. Doesn't model VAT registration, a company structure, or provisional-tax timing. Not advice.
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'vat' && (
      <div className="power-tool-card">
        <h3>🧾 VAT / Sales Tax Calculator</h3>
        <p className="power-tool-desc">Add VAT to a price, or pull it back out of a total that already includes it — the two aren't the same calculation, since the rate applies to the exclusive amount, not the inclusive one.</p>
        <div className="vat-mode-toggle">
          <button className={vatMode === 'add' ? 'active' : ''} onClick={() => setVatMode('add')}>Add VAT (exclusive → inclusive)</button>
          <button className={vatMode === 'extract' ? 'active' : ''} onClick={() => setVatMode('extract')}>Extract VAT (inclusive → exclusive)</button>
        </div>
        <div className="power-form">
          <div className="form-group">
            <label>{vatMode === 'add' ? 'Price excl. VAT' : 'Price incl. VAT'} ({country.symbol})</label>
            <input type="number" min="0" step="10" value={vatAmount} onChange={(e) => setVatAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>VAT Rate (%)</label>
            <input type="number" min="0" max="30" step="0.5" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} />
          </div>
        </div>
        {vatAmount > 0 && (
          <div className="power-verdict-grid">
            <div className="power-stat">
              <span>Excl. VAT</span>
              <strong>{country.symbol} {Math.round(vatResult.exclusiveAmount).toLocaleString()}</strong>
            </div>
            <div className="power-stat">
              <span>VAT ({vatRate}%)</span>
              <strong className="warn">{country.symbol} {Math.round(vatResult.vatAmount).toLocaleString()}</strong>
            </div>
            <div className="power-stat">
              <span>Incl. VAT</span>
              <strong className="positive">{country.symbol} {Math.round(vatResult.inclusiveAmount).toLocaleString()}</strong>
            </div>
          </div>
        )}
      </div>
      )}

      {activeSubTab === 'cgt' && (
      <div className="power-tool-card">
        <h3>📑 Capital Gains Tax</h3>
        <p className="power-tool-desc">In South Africa, the gain on a disposal — less an annual exclusion — gets a 40% inclusion rate, and that "taxable capital gain" is taxed at your normal marginal rate on top of your other income. It's not a separate flat CGT rate.</p>
        <div className="power-form">
          <div className="form-group">
            <label>Sale Proceeds ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={cgtProceeds} onChange={(e) => setCgtProceeds(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Base Cost ({country.symbol})</label>
            <input type="number" min="0" step="10000" value={cgtBaseCost} onChange={(e) => setCgtBaseCost(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Other Taxable Income ({country.symbol}/yr)</label>
            <input type="number" min="0" step="10000" value={cgtOtherIncome} onChange={(e) => setCgtOtherIncome(Number(e.target.value))} />
          </div>
        </div>
        {country.taxBrackets && (
          <label className="mc-compare-toggle">
            <input type="checkbox" checked={cgtProgressive} onChange={(e) => setCgtProgressive(e.target.checked)} />
            Use {country.name}'s progressive brackets for the marginal rate
          </label>
        )}
        {cgtProceeds > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>Gross gain</span>
                <strong>{country.symbol} {Math.round(cgtResult.grossGain).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Taxable capital gain</span>
                <strong>{country.symbol} {Math.round(cgtResult.taxableCapitalGain).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>Tax owed</span>
                <strong className="warn">{country.symbol} {Math.round(cgtResult.taxOnGain).toLocaleString()}</strong>
              </div>
            </div>
            <div className="power-verdict debt">
              A {country.symbol} {Math.round(cgtResult.grossGain).toLocaleString()} gain costs about <strong>{country.symbol} {Math.round(cgtResult.taxOnGain).toLocaleString()}</strong> in tax — {cgtResult.effectiveRateOnGainPct.toFixed(1)}% of the raw gain (your {cgtResult.marginalRatePct.toFixed(0)}% marginal rate applied to just the {country.symbol}{Math.round(cgtResult.taxableCapitalGain).toLocaleString()} that's actually taxable). Net proceeds after tax: {country.symbol} {Math.round(cgtResult.netProceeds).toLocaleString()}.
            </div>
            <p className="power-tool-note">
              SA individual rules: R{CGT_ANNUAL_EXCLUSION.toLocaleString()} annual exclusion, {CGT_INCLUSION_RATE_INDIVIDUAL}% inclusion rate (companies/trusts differ). Primary-residence and other specific exclusions aren't modelled — this is the general disposal case. Indicative, not a return.
            </p>
          </>
        )}
      </div>
      )}
    </div>
  );
};

export default PowerTools;
