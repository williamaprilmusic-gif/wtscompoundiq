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
import { useLanguage } from '../i18n/LanguageContext';

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

// Windfall allocator step labels are English identifiers from windfallAllocator.js; show them translated.
const WINDFALL_LABEL_KEYS = {
  'Top up emergency fund': 'pt.wfTopUp',
  'Clear high-interest debt': 'pt.wfClearDebt',
  'Fill tax-advantaged room': 'pt.wfFillRoom',
  'Invest in a taxable account': 'pt.wfInvest'
};

const ULTRA_SUB_TAB_KEYS = new Set(SUB_TABS.filter(t => t.tier === 'Ultra').map(t => t.key));
const EMPTY_SET = new Set();

// Groups the pills above into labelled categories so the bar stays scannable. Every
// key must appear exactly once; any that's missed drops into a "More" catch-all in
// SubTabs rather than vanishing.
const SUB_TAB_GROUPS = [
  { id: 'retire', label: 'Retire & Financial Independence', keys: ['fire', 'coastFire', 'baristaFire', 'savingsRate', 'drawdown', 'pretaxRA', 'dividend', 'feeDrag', 'fundFees', 'retireGap', 'seqRisk', 'twoPot'] },
  { id: 'debt', label: 'Debt & Credit', keys: ['debtVsInvest', 'dti', 'cardTrap', 'debtConsol', 'loanCompare', 'cashVsFinance'] },
  { id: 'property', label: 'Property & Big Purchases', keys: ['affordability', 'rentVsBuy', 'carCost', 'leaseVsBuy', 'depositTimeline', 'homeCosts', 'payback', 'rateShock'] },
  { id: 'goal', label: 'Saving for a Goal', keys: ['savings', 'education', 'sinkingFund', 'efRunway', 'insurance', 'windfall'] },
  { id: 'income', label: 'Income & Tax', keys: ['salary', 'raiseValue', 'bonusTax', 'raOptimizer', 'contractRate', 'cgt', 'budgetRule', 'marginalTax', 'raiseInflation'] },
  { id: 'basics', label: 'Money Basics', keys: ['futureCost', 'rule72', 'freqCompare', 'effRate', 'realReturn', 'subCost', 'vat'] }
];

const PowerTools = ({ country, initial, monthly, rate, years = 20, inflation, wrapper, compoundFrequency = 12, contributionIncrease = 0, lumpSums = [], canUltra = true, onOpenPricing }) => {
  const { t } = useLanguage();
  // Display labels are translated; keys/ids stay stable identifiers.
  const subTabsT = SUB_TABS.map((x) => ({ ...x, label: t(`pt.tab_${x.key}`) }));
  const groupsT = SUB_TAB_GROUPS.map((g) => ({ ...g, label: t(`pt.group_${g.id}`) }));
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
    taxBrackets: (salaryProgressive && country.taxBrackets) ? country.taxBrackets : null,
    rebate: salaryProgressive ? (country.primaryRebate || 0) : 0
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
    deltaEarned: 1000, deductionAmount: mtDeduction,
    rebate: mtProgressive ? (country.primaryRebate || 0) : 0
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
        <h2>{t('pt.title')}</h2>
        <p>{t('pt.intro')}</p>
      </div>

      <SubTabs
        tabs={subTabsT}
        groups={groupsT}
        active={activeSubTab}
        onChange={setActiveSubTab}
        ariaLabel={t('pt.ariaLabel')}
        lockedKeys={lockedSubTabs}
        onLockedClick={() => onOpenPricing && onOpenPricing()}
      />
      {!canUltra && (
        <p className="power-tools-tier-hint">
          {t('pt.tierHintA')} <strong>Ultra</strong> — {t('pt.tierHintB')}
          {onOpenPricing && <button type="button" className="power-tools-tier-hint-btn" onClick={onOpenPricing}>{t('pt.seeUltra')}</button>}
        </p>
      )}

      {activeSubTab === 'fire' && (
      <div className="power-tool-card">
        <h3>🔥 <Term k="fireNumber">{t('pt.fireTerm')}</Term> {t('pt.fireSuffix')}</h3>
        <p className="power-tool-desc">{t('pt.fireDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.annualExpenses', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={annualExpenses} onChange={(e) => setAnnualExpenses(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="safeWithdrawalRate">{t('pt.swrTerm')}</Term> (%)</label>
            <input type="number" min="1" max="10" step="0.1" value={withdrawalRate} onChange={(e) => setWithdrawalRate(Number(e.target.value))} />
          </div>
        </div>
        <div className="power-result">
          <div className="power-stat">
            <span>{t('pt.yourFire')}</span>
            <strong>{country.symbol} {Math.round(fireNumber).toLocaleString()}</strong>
          </div>
          <div className="power-stat">
            <span>{t('pt.yearsToFire')}</span>
            <strong className={yearsToFire === null ? 'warn' : 'positive'}>
              {yearsToFire === null ? t('pt.notWithin', { n: MAX_YEARS_TO_SEARCH }) : t('pt.yearsN', { n: yearsToFire })}
            </strong>
          </div>
        </div>
        <p className="power-tool-note">{t('pt.fireNote', { rate, expenses: annualExpenses.toLocaleString() })}</p>
        {annualExpenses > 0 && (
          <button className="power-save-plan-btn" onClick={saveFirePlan}>
            {fireSaved ? t('pt.savedToPlan') : t('pt.savePlan')}
          </button>
        )}
      </div>
      )}

      {activeSubTab === 'debtVsInvest' && (
      <div className="power-tool-card">
        <h3>{t('pt.dviTitle')}</h3>
        <p className="power-tool-desc">{t('pt.dviDesc', { years })}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.outstandingDebt', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={debtAmount} onChange={(e) => setDebtAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.debtRate')}</label>
            <input type="number" min="0" step="0.1" value={debtRate} onChange={(e) => setDebtRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.extraCash', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="50" value={extraMonthly} onChange={(e) => setExtraMonthly(Number(e.target.value))} />
          </div>
        </div>
        <div className={`power-verdict ${debtIsWorse ? 'debt' : 'invest'}`}>
          {debtIsWorse
            ? t(wrapper && hasWrapper ? 'pt.verdictDebtSheltered' : 'pt.verdictDebtTaxed', { debtRate, after: afterTaxReturn.toFixed(1), country: country.name, tax: country.taxRate })
            : t(wrapper && hasWrapper ? 'pt.verdictInvestSheltered' : 'pt.verdictInvestTaxed', { debtRate, after: afterTaxReturn.toFixed(1), country: country.name, tax: country.taxRate })}
        </div>
        {debtAmount > 0 && extraMonthly > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.nwDebtFirst', { years })}</span>
                <strong className="positive">{country.symbol} {Math.round(netWorthDebtFirst).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.nwInvest', { years })}</span>
                <strong className={netWorthInvestFirst > netWorthDebtFirst ? 'positive' : 'warn'}>{country.symbol} {Math.round(netWorthInvestFirst).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.dviNote1', {
                extra: `${country.symbol}${extraMonthly.toLocaleString()}`,
                years,
                cleared: debtFirst.clearedAtMonth ? t('pt.dviNoteCleared', { n: debtFirst.clearedAtMonth }) : t('pt.dviNoteNotCleared', { years })
              })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'drawdown' && (
      <div className="power-tool-card">
        <h3>{t('pt.ddTitle')}</h3>
        <p className="power-tool-desc">{t('pt.ddDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.ddBalance', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={drawdownBalance} onChange={(e) => setDrawdownBalance(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.ddWithdrawal', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={drawdownWithdrawal} onChange={(e) => setDrawdownWithdrawal(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.ddReturn')}</label>
            <input type="number" step="0.1" value={drawdownReturn} onChange={(e) => setDrawdownReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.ddLength')}</label>
            <input type="number" min="1" max="60" value={drawdownYears} onChange={(e) => setDrawdownYears(Number(e.target.value))} />
          </div>
        </div>
        {fireNumber > 0 && (
          <button type="button" className="power-use-fire-btn" onClick={() => setDrawdownBalance(Math.round(fireNumber))}>
            {t('pt.useFire', { amount: `${country.symbol} ${Math.round(fireNumber).toLocaleString()}` })}
          </button>
        )}
        {drawdownBalance > 0 && drawdownWithdrawal > 0 && (
          <>
            <div className={`power-verdict ${drawdown.depleted ? 'danger' : 'invest'}`}>
              {drawdown.depleted
                ? t('pt.ddDepleted', { lasted: drawdown.lastedYears, short: drawdownYears - drawdown.lastedYears, target: drawdownYears, pct: drawdownWithdrawalRate.toFixed(1), inflation: inflation || 0, ret: drawdownReturn })
                : t('pt.ddLasts', { years: drawdownYears, ending: `${country.symbol} ${Math.round(drawdown.endingBalance).toLocaleString()}`, pct: drawdownWithdrawalRate.toFixed(1) })}
            </div>
            <p className="power-tool-note">{t('pt.ddNote', { ret: drawdownReturn, inflation: inflation || 0 })}</p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'savings' && (
      <div className="power-tool-card">
        <h3>{t('pt.svTitle')}</h3>
        <p className="power-tool-desc">{t('pt.svDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.svDeposit', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={savingsDeposit} onChange={(e) => setSavingsDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.svRate')}</label>
            <input type="number" min="0" step="0.1" value={savingsRate} onChange={(e) => setSavingsRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.svTerm')}</label>
            <input type="number" min="1" max="50" value={savingsYears} onChange={(e) => setSavingsYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="compoundingFrequency">{t('pt.svFreq')}</Term></label>
            <select value={savingsFrequency} onChange={(e) => setSavingsFrequency(Number(e.target.value))}>
              <option value="1">{t('pt.freqAnnually')}</option>
              <option value="2">{t('pt.freqSemi')}</option>
              <option value="4">{t('pt.freqQuarterly')}</option>
              <option value="12">{t('pt.freqMonthly')}</option>
              <option value="365">{t('pt.freqDaily')}</option>
            </select>
          </div>
        </div>
        {savingsDeposit > 0 && (
          <div className="power-verdict-grid">
            <div className="power-stat">
              <span>{t('pt.svFinal')}</span>
              <strong className="positive">{country.symbol} {savingsAfterTax.finalBalance.toLocaleString()}</strong>
            </div>
            <div className="power-stat">
              <span>{t('pt.svBeforeTax')}</span>
              <strong>{country.symbol} {savingsBeforeTax.totalInterest.toLocaleString()}</strong>
            </div>
            <div className="power-stat">
              <span>{t('pt.svAfterTax', { country: country.name, tax: country.taxRate })}</span>
              <strong className="positive">{country.symbol} {savingsAfterTax.totalInterest.toLocaleString()}</strong>
            </div>
          </div>
        )}
        <p className="power-tool-note">{t('pt.svNote', { rate: savingsRate, country: country.name, tax: country.taxRate, wrapper: country.wrapperLabel })}</p>
      </div>
      )}

      {activeSubTab === 'education' && (
      <div className="power-tool-card">
        <h3>{t('pt.edTitle')}</h3>
        <p className="power-tool-desc">{t('pt.edDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.edCost', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={eduCurrentCost} onChange={(e) => setEduCurrentCost(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.edUntil')}</label>
            <input type="number" min="0" max="30" value={eduYearsUntil} onChange={(e) => setEduYearsUntil(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.edStudy')}</label>
            <input type="number" min="1" max="10" value={eduStudyYears} onChange={(e) => setEduStudyYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.edInflationPre')} <Term k="inflation">{t('pt.edInflationTerm')}</Term> {t('pt.edInflationPost')}</label>
            <input type="number" min="0" step="0.1" value={eduInflation} onChange={(e) => setEduInflation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.edSaved', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={eduAlreadySaved} onChange={(e) => setEduAlreadySaved(Number(e.target.value))} />
          </div>
        </div>
        {eduCurrentCost > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.edTotal', { n: eduStudyYears })}</span>
                <strong className="warn">{country.symbol} {Math.round(eduProjection.totalFutureCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                {/* When enrollment is this year (eduYearsUntil === 0), there's no runway left to
                    save monthly -- solveMonthlyForGoal still needs a >0 "years" to converge (see
                    safeEduYearsUntil above), but showing that fudged monthly figure here would
                    understate what's actually needed and imply a full year still exists. Show the
                    honest lump-sum-needed-now figure instead in that case. */}
                <span>{eduYearsUntil > 0 ? t('pt.edNeedMonthly') : t('pt.edNeedNow')}</span>
                <strong className="positive">
                  {country.symbol} {Math.round(eduYearsUntil > 0 ? eduRequiredMonthly : Math.max(0, eduProjection.totalFutureCost - eduAlreadySaved)).toLocaleString()}
                </strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.edNote', {
                infl: eduInflation, rate, study: eduStudyYears,
                where: wrapper && hasWrapper ? t('pt.edNoteWrapper', { wrapper: country.wrapperLabel }) : t('pt.edNoteTax', { country: country.name, tax: country.taxRate })
              })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'affordability' && (
      <div className="power-tool-card">
        <h3>{t('pt.haTitlePre')}<Term k="bond">{t('pt.haTitleTerm')}</Term> {t('pt.haTitlePost')}</h3>
        <p className="power-tool-desc">{t('pt.haDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.haIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={affordIncome} onChange={(e) => setAffordIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.haExisting', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={affordExistingDebt} onChange={(e) => setAffordExistingDebt(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.haDeposit', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={affordDeposit} onChange={(e) => setAffordDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.haRate')}</label>
            <input type="number" min="0" step="0.1" value={affordRate} onChange={(e) => setAffordRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.haTerm')}</label>
            <input type="number" min="1" max="30" value={affordTermYears} onChange={(e) => setAffordTermYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.haRatio')}</label>
            <input type="number" min="1" max="50" value={affordRatio} onChange={(e) => setAffordRatio(Number(e.target.value))} />
          </div>
        </div>
        <button type="button" className="power-use-fire-btn" onClick={pullExistingDebtPayments}>
          {t('pt.haPull')}
        </button>
        {affordIncome > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.haMaxBond')}</span>
                <strong className="positive">{country.symbol} {Math.round(maxBondAmount).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.haMaxPrice')}</span>
                <strong className="positive">{country.symbol} {Math.round(maxHomePrice).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.haRepay')}</span>
                <strong>{country.symbol} {Math.round(maxBondPayment).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.haInterest', { n: affordTermYears })}</span>
                <strong className="warn">{country.symbol} {affordAmort.totalInterest.toLocaleString()}</strong>
              </div>
              {zaTransferDuty !== null && (
                <div className="power-stat">
                  <span><Term k="transferDuty">{t('pt.haDuty')}</Term></span>
                  <strong className="warn">{country.symbol} {Math.round(zaTransferDuty).toLocaleString()}</strong>
                </div>
              )}
            </div>
            <p className="power-tool-note">
              {t('pt.haNote', { ratio: affordRatio })}{' '}
              {zaTransferDuty !== null ? t('pt.haNoteZa') : t('pt.haNoteOther')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'insurance' && (
      <div className="power-tool-card">
        <h3>{t('pt.inTitlePre')}<Term k="lifeCoverGap">{t('pt.inTitleTerm')}</Term>{t('pt.inTitlePost')}</h3>
        <p className="power-tool-desc">{t('pt.inDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.inDebts', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={coverDebts} onChange={(e) => setCoverDebts(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.inIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={coverIncome} onChange={(e) => setCoverIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.inYears')}</label>
            <input type="number" min="0" max="40" value={coverYears} onChange={(e) => setCoverYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.inFinal', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={coverFinalExpenses} onChange={(e) => setCoverFinalExpenses(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.inCover', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={coverExistingCover} onChange={(e) => setCoverExistingCover(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.inSavings', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={coverExistingSavings} onChange={(e) => setCoverExistingSavings(Number(e.target.value))} />
          </div>
        </div>
        <button type="button" className="power-use-fire-btn" onClick={pullOutstandingDebtBalance}>{t('pt.inPullDebts')}</button>{' '}
        <button type="button" className="power-use-fire-btn" onClick={pullSavingsFromNetWorth}>{t('pt.inPullSavings')}</button>
        {(coverDebts > 0 || coverIncome > 0) && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.inTotal')}</span>
                <strong>{country.symbol} {Math.round(coverResult.totalNeed).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.inOffsets')}</span>
                <strong>{country.symbol} {Math.round(coverResult.offsets).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.inGap')}</span>
                <strong className={coverResult.coverGap > 0 ? 'warn' : 'positive'}>{country.symbol} {Math.round(coverResult.coverGap).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {coverResult.coverGap > 0
                ? t('pt.inShortfall', { amount: `${country.symbol} ${Math.round(coverResult.coverGap).toLocaleString()}` })
                : t('pt.inMet')}{t('pt.inNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'salary' && (
      <div className="power-tool-card">
        <h3>{t('pt.salTitle')}</h3>
        <p className="power-tool-desc">{t('pt.salDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.salGross', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={salaryGross} onChange={(e) => setSalaryGross(Number(e.target.value))} />
          </div>
          {country.taxBrackets && (
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={salaryProgressive} onChange={(e) => setSalaryProgressive(e.target.checked)} />
                {' '}{t('pt.salBrackets', { country: country.name })}
              </label>
            </div>
          )}
        </div>
        {salaryGross > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.salNetM')}</span>
                <strong className="positive">{country.symbol} {Math.round(takeHome.netMonthly).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.salNetA')}</span>
                <strong className="positive">{country.symbol} {Math.round(takeHome.netAnnual).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.salTax')}</span>
                <strong className="warn">{country.symbol} {Math.round(takeHome.tax).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.salEff')}</span>
                <strong>{takeHome.effectiveRate.toFixed(1)}%</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {salaryProgressive && country.taxBrackets
                ? (country.taxBracketsNote || t('pt.salNoteBrackets', { country: country.name }))
                : t('pt.salNoteFlat', { rate: country.taxRate })}{' '}
              {t('pt.salNoteTail')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'dti' && (
      <div className="power-tool-card">
        <h3>{t('pt.dtiTitle')}</h3>
        <p className="power-tool-desc">{t('pt.dtiDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.dtiIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={dtiIncome} onChange={(e) => setDtiIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.dtiDebt', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={dtiDebt} onChange={(e) => setDtiDebt(Number(e.target.value))} />
          </div>
        </div>
        <button type="button" className="power-use-fire-btn" onClick={pullDtiDebtPayments}>{t('pt.haPull')}</button>
        {dtiIncome > 0 && (
          <>
            <div className={`power-verdict ${dti.band === 'healthy' || dti.band === 'manageable' ? 'invest' : 'debt'}`}>
              {t('pt.dtiVerdict', { ratio: dti.ratio.toFixed(1), band: t(`pt.dtiBand_${dti.band}`) })}
            </div>
            <p className="power-tool-note">
              {t('pt.dtiNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'rentVsBuy' && (
      <div className="power-tool-card">
        <h3>{t('pt.rvbTitle')}</h3>
        <p className="power-tool-desc">{t('pt.rvbDesc', { years })}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.rvbPrice', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={rvbHomePrice} onChange={(e) => setRvbHomePrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvbDown', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={rvbDownPayment} onChange={(e) => setRvbDownPayment(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvbRate')}</label>
            <input type="number" min="0" step="0.1" value={rvbMortgageRate} onChange={(e) => setRvbMortgageRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvbTerm')}</label>
            <input type="number" min="1" max="30" value={rvbTermYears} onChange={(e) => setRvbTermYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvbOther', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={rvbMonthlyExtras} onChange={(e) => setRvbMonthlyExtras(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvbAppr')}</label>
            <input type="number" step="0.1" value={rvbAppreciation} onChange={(e) => setRvbAppreciation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvbRent', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={rvbMonthlyRent} onChange={(e) => setRvbMonthlyRent(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvbRentUp')}</label>
            <input type="number" step="0.1" value={rvbRentIncrease} onChange={(e) => setRvbRentIncrease(Number(e.target.value))} />
          </div>
        </div>
        {rvbHomePrice > 0 && rvbMonthlyRent > 0 && (
          <>
            <div className={`power-verdict ${rentVsBuy.buyIsBetter ? 'invest' : 'debt'}`}>
              {rentVsBuy.buyIsBetter
                ? t('pt.rvbBuyWins', { years, equity: `${country.symbol} ${Math.round(rentVsBuy.finalBuyEquity).toLocaleString()}`, rate, portfolio: `${country.symbol} ${Math.round(rentVsBuy.finalRentPortfolio).toLocaleString()}` })
                : t('pt.rvbRentWins', { years, portfolio: `${country.symbol} ${Math.round(rentVsBuy.finalRentPortfolio).toLocaleString()}`, equity: `${country.symbol} ${Math.round(rentVsBuy.finalBuyEquity).toLocaleString()}` })}
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.rvbMonthly')}</span>
                <strong>{country.symbol} {Math.round(rentVsBuy.monthlyBuyPayment).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.rvbEquity', { years })}</span>
                <strong className={rentVsBuy.buyIsBetter ? 'positive' : ''}>{country.symbol} {Math.round(rentVsBuy.finalBuyEquity).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.rvbPortfolio', { years })}</span>
                <strong className={!rentVsBuy.buyIsBetter ? 'positive' : ''}>{country.symbol} {Math.round(rentVsBuy.finalRentPortfolio).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.rvbNote', { rate })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'futureCost' && (
      <div className="power-tool-card">
        <h3>{t('pt.fcTitle')}</h3>
        <p className="power-tool-desc">{t('pt.fcDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.fcAmount', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={futureCostAmount} onChange={(e) => setFutureCostAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('app.csvYears')}</label>
            <input type="number" min="0" max="60" value={futureCostYears} onChange={(e) => setFutureCostYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="inflation">{t('calculator.inflation')}</Term>{t('pt.edInflationPost')}</label>
            <input type="number" step="0.1" value={futureCostInflation} onChange={(e) => setFutureCostInflation(Number(e.target.value))} />
          </div>
        </div>
        {futureCostAmount > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.fcFuture', { years: futureCostYears })}</span>
                <strong className="warn">{country.symbol} {Math.round(futureCost.futureCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.fcIncrease')}</span>
                <strong className="warn">+{futureCost.percentIncrease.toFixed(0)}%</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.fcToday', { amount: `${country.symbol}${futureCostAmount.toLocaleString()}`, years: futureCostYears })}</span>
                <strong className="warn">{country.symbol} {Math.round(purchasingPower.realValue).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.fcNote', { rate: futureCostInflation, years: futureCostYears, amount: `${country.symbol}${futureCostAmount.toLocaleString()}` })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'coastFire' && (
      <div className="power-tool-card">
        <h3>{t('pt.cfTitle')}</h3>
        <p className="power-tool-desc">{t('pt.cfDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.cfPot', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={coastPot} onChange={(e) => setCoastPot(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('charts.mcExpected')}</label>
            <input type="number" step="0.1" value={coastReturn} onChange={(e) => setCoastReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.cfYears')}</label>
            <input type="number" min="0" max="60" value={coastYears} onChange={(e) => setCoastYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.cfTarget', { symbol: country.symbol })}{coastTarget === 0 && fireNumber > 0 ? t('pt.cfUsingFire') : ''}</label>
            <input type="number" min="0" step="100000" value={coastTarget} onChange={(e) => setCoastTarget(Number(e.target.value))} placeholder={fireNumber > 0 ? Math.round(fireNumber).toLocaleString() : '0'} />
          </div>
        </div>
        {coastPot > 0 && coastTargetEffective > 0 && (
          <>
            <div className={`power-verdict ${coast.hasCoasted ? 'invest' : 'debt'}`}>
              {coast.hasCoasted
                ? t('pt.cfHit', { rate: coastReturn, today: `${country.symbol} ${Math.round(coastPot).toLocaleString()}`, future: `${country.symbol} ${Math.round(coast.projectedAtRetirement).toLocaleString()}`, years: coastYears, surplus: `${country.symbol} ${Math.round(coast.surplusAtRetirement).toLocaleString()}`, target: `${country.symbol} ${Math.round(coastTargetEffective).toLocaleString()}` })
                : t('pt.cfNot', { today: `${country.symbol} ${Math.round(coastPot).toLocaleString()}`, future: `${country.symbol} ${Math.round(coast.projectedAtRetirement).toLocaleString()}`, years: coastYears, need: `${country.symbol} ${Math.round(coast.coastNumber).toLocaleString()}`, gap: `${country.symbol} ${Math.round(coast.shortfallToday).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.cfNote', { rate: coastReturn })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'savingsRate' && (
      <div className="power-tool-card">
        <h3>{t('pt.srTitle')}</h3>
        <p className="power-tool-desc">{t('pt.srDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.srIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={srIncome} onChange={(e) => setSrIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.srSpend', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={srSpending} onChange={(e) => setSrSpending(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.srReal')}</label>
            <input type="number" step="0.1" value={srReturn} onChange={(e) => setSrReturn(Number(e.target.value))} />
          </div>
        </div>
        {srIncome > 0 && srSpending > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.srRate')}</span>
                <strong className={savingsRateResult.savingsRate >= 20 ? 'positive' : 'warn'}>{savingsRateResult.savingsRate.toFixed(0)}%</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.srYears')}</span>
                <strong className={savingsRateResult.years === null ? 'warn' : 'positive'}>
                  {savingsRateResult.years === null ? t('pt.srNever') : t('pt.yearsN', { n: savingsRateResult.years })}
                </strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.srFi')}</span>
                <strong>{country.symbol} {Math.round(savingsRateResult.fiNumber).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.srNote', { saving: `${country.symbol} ${Math.round(savingsRateResult.annualSaving).toLocaleString()}`, rate: srReturn })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'cardTrap' && (
      <div className="power-tool-card">
        <h3>{t('pt.ctTitle')}</h3>
        <p className="power-tool-desc">{t('pt.ctDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.ctBalance', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={cardBalance} onChange={(e) => setCardBalance(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.ctApr')}</label>
            <input type="number" min="0" step="0.1" value={cardApr} onChange={(e) => setCardApr(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.ctMinPct')}</label>
            <input type="number" min="0.1" step="0.5" value={cardMinPercent} onChange={(e) => setCardMinPercent(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.ctFloor', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="50" value={cardMinFloor} onChange={(e) => setCardMinFloor(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.ctFixed', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={cardFixedPayment} onChange={(e) => setCardFixedPayment(Number(e.target.value))} />
          </div>
        </div>
        {cardBalance > 0 && cardApr > 0 && (
          <>
            <div className={`power-verdict ${cardResult.minimumOnly?.neverPaysOff ? 'danger' : 'debt'}`}>
              {cardResult.minimumOnly?.neverPaysOff
                ? t('pt.ctNever', { apr: cardApr })
                : t('pt.ctMin', { months: cardResult.minimumOnly.months, years: Math.round(cardResult.minimumOnly.months / 12), interest: `${country.symbol} ${Math.round(cardResult.minimumOnly.totalInterest).toLocaleString()}`, paid: `${country.symbol} ${Math.round(cardResult.minimumOnly.totalPaid).toLocaleString()}`, balance: `${country.symbol} ${Math.round(cardBalance).toLocaleString()}` })}
            </div>
            {cardResult.fixed && !cardResult.fixed.neverPaysOff && (
              <div className="power-verdict-grid">
                <div className="power-stat">
                  <span>{t('pt.ctFixedPayoff', { amount: `${country.symbol}${Math.round(cardFixedPayment).toLocaleString()}` })}</span>
                  <strong className="positive">{t('pt.monthsN', { n: cardResult.fixed.months })}</strong>
                </div>
                <div className="power-stat">
                  <span>{t('pt.ctFixedInt')}</span>
                  <strong className="positive">{country.symbol} {Math.round(cardResult.fixed.totalInterest).toLocaleString()}</strong>
                </div>
                <div className="power-stat">
                  <span>{t('pt.ctSaved')}</span>
                  <strong className="positive">
                    {cardResult.minimumOnly.neverPaysOff
                      ? t('pt.ctAvoids')
                      : `${country.symbol} ${Math.round(Math.max(0, cardResult.minimumOnly.totalInterest - cardResult.fixed.totalInterest)).toLocaleString()}`}
                  </strong>
                </div>
              </div>
            )}
            {cardResult.fixed?.neverPaysOff && (
              <p className="power-tool-note">{t('pt.ctFixedNo', { min: `${country.symbol} ${Math.round(cardBalance * cardApr / 100 / 12).toLocaleString()}` })}</p>
            )}
            <p className="power-tool-note">
              {t('pt.ctNote', { pct: cardMinPercent, floor: `${country.symbol}${Math.round(cardMinFloor).toLocaleString()}` })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'rule72' && (
      <div className="power-tool-card">
        <h3>{t('pt.r72Title')}</h3>
        <p className="power-tool-desc">{t('pt.r72Desc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.r72Return')}</label>
            <input type="number" step="0.1" value={r72Rate} onChange={(e) => setR72Rate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.r72Over')}</label>
            <input type="number" min="0" max="80" value={r72Years} onChange={(e) => setR72Years(Number(e.target.value))} />
          </div>
        </div>
        {r72Rate > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.r72Est')}</span>
                <strong>{t('pt.r72ToDouble', { n: r72.approxDoublingYears.toFixed(1) })}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.r72Exact')}</span>
                <strong className="positive">{t('pt.yearsN', { n: r72.exactDoublingYears.toFixed(1) })}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.r72Growth', { years: r72Years })}</span>
                <strong className="positive">{t('pt.r72Mult', { x: r72.growthMultiple.toFixed(1), n: r72.doublingsOverPeriod.toFixed(1) })}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.r72Note')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'dividend' && (
      <div className="power-tool-card">
        <h3>{t('pt.divTitle')}</h3>
        <p className="power-tool-desc">{t('pt.divDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.divTarget', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={divTargetIncome} onChange={(e) => setDivTargetIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.divPortfolio', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={divPortfolio} onChange={(e) => setDivPortfolio(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.divYield')}</label>
            <input type="number" min="0" step="0.1" value={divYield} onChange={(e) => setDivYield(Number(e.target.value))} />
          </div>
        </div>
        {(divTargetIncome > 0 || divPortfolio > 0) && (
          <>
            <div className="power-verdict-grid">
              {divTargetIncome > 0 && (
                <div className="power-stat">
                  <span>{t('pt.divNeeded', { yield: divYield })}</span>
                  <strong className="warn">{dividend.capitalNeeded == null ? '—' : `${country.symbol} ${Math.round(dividend.capitalNeeded).toLocaleString()}`}</strong>
                </div>
              )}
              {divPortfolio > 0 && (
                <div className="power-stat">
                  <span>{t('pt.divPays')}</span>
                  <strong className="positive">{country.symbol} {Math.round(dividend.monthlyFromPortfolio).toLocaleString()}</strong>
                </div>
              )}
              {divTargetIncome > 0 && dividend.shortfallCapital != null && (
                <div className="power-stat">
                  <span>{t('pt.divStill')}</span>
                  <strong className={dividend.shortfallCapital > 0 ? 'warn' : 'positive'}>{country.symbol} {Math.round(dividend.shortfallCapital).toLocaleString()}</strong>
                </div>
              )}
            </div>
            <p className="power-tool-note">
              {t('pt.divNote', { country: country.name, rate: country.taxRate, wrapper: country.wrapperLabel && country.wrapperLabel !== 'N/A' ? country.wrapperLabel : t('pt.taxFreeWrapper') })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'carCost' && (
      <div className="power-tool-card">
        <h3>{t('pt.carTitle')}</h3>
        <p className="power-tool-desc">{t('pt.carDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.carPrice', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={carPrice} onChange={(e) => setCarPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carDeposit', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={carDeposit} onChange={(e) => setCarDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carRate')}</label>
            <input type="number" min="0" step="0.1" value={carFinanceRate} onChange={(e) => setCarFinanceRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carTerm')}</label>
            <input type="number" min="0" max="10" value={carFinanceTerm} onChange={(e) => setCarFinanceTerm(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carYears')}</label>
            <input type="number" min="1" max="30" value={carYearsOwned} onChange={(e) => setCarYearsOwned(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carDepr')}</label>
            <input type="number" min="0" max="50" step="0.5" value={carDepreciation} onChange={(e) => setCarDepreciation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carInsurance', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={carInsurance} onChange={(e) => setCarInsurance(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carFuel', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={carFuel} onChange={(e) => setCarFuel(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carMaint', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={carMaintenance} onChange={(e) => setCarMaintenance(Number(e.target.value))} />
          </div>
        </div>
        {carPrice > 0 && carYearsOwned > 0 && (
          <>
            <div className="power-verdict debt">
              {t('pt.carVerdict', { years: carYearsOwned, total: `${country.symbol} ${Math.round(carCost.totalCost).toLocaleString()}`, perMonth: `${country.symbol} ${Math.round(carCost.costPerMonth).toLocaleString()}`, residual: `${country.symbol} ${Math.round(carCost.residualValue).toLocaleString()}` })}
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.carDepSpan')}</span>
                <strong className="warn">{country.symbol} {Math.round(carCost.depreciation).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.carFinSpan')}</span>
                <strong className="warn">{country.symbol} {Math.round(carCost.financeInterest).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.carRunning', { years: carYearsOwned })}</span>
                <strong className="warn">{country.symbol} {Math.round(carCost.runningTotal).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.carNote', { rate: carDepreciation })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'raiseValue' && (
      <div className="power-tool-card">
        <h3>{t('pt.rvTitle')}</h3>
        <p className="power-tool-desc">{t('pt.rvDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.rvAmount', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={raiseAmount} onChange={(e) => setRaiseAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvFuture')}</label>
            <input type="number" min="0" step="0.5" value={raiseAnnualPercent} onChange={(e) => setRaiseAnnualPercent(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvYears')}</label>
            <input type="number" min="0" max="50" value={raiseYearsLeft} onChange={(e) => setRaiseYearsLeft(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rvTax')}</label>
            <input type="number" min="0" max="100" step="1" value={raiseTaxRate} onChange={(e) => setRaiseTaxRate(Number(e.target.value))} />
          </div>
        </div>
        {raiseAmount > 0 && raiseYearsLeft > 0 && (
          <>
            <div className="power-verdict invest">
              {t('pt.rvVerdict', { years: raiseYearsLeft, gross: `${country.symbol} ${Math.round(raise.cumulativeGross).toLocaleString()}`, net: `${country.symbol} ${Math.round(raise.cumulativeAfterTax).toLocaleString()}`, tax: raiseTaxRate, rate, invested: `${country.symbol} ${Math.round(raise.investedValue).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.rvNote', { pct: raiseAnnualPercent })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'pretaxRA' && (
      <div className="power-tool-card">
        <h3>{t('pt.praTitle')}</h3>
        <p className="power-tool-desc">{t('pt.praDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.praMonthly', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="500" value={praContribution} onChange={(e) => setPraContribution(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.praMarginal')}</label>
            <input type="number" min="0" max="100" step="1" value={praMarginalRate} onChange={(e) => setPraMarginalRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.praYears')}</label>
            <input type="number" min="1" max="60" value={praYears} onChange={(e) => setPraYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.praReturn')}</label>
            <input type="number" step="0.1" value={praReturn} onChange={(e) => setPraReturn(Number(e.target.value))} />
          </div>
        </div>
        {praContribution > 0 && (
          <>
            <div className="power-verdict invest">
              {t('pt.praVerdict', { contrib: `${country.symbol}${Math.round(praContribution).toLocaleString()}`, net: `${country.symbol} ${Math.round(pra.netCost).toLocaleString()}`, refund: `${country.symbol} ${Math.round(pra.annualRefund).toLocaleString()}`, pot: `${country.symbol} ${Math.round(pra.pretaxPot).toLocaleString()}`, years: praYears, taxable: `${country.symbol} ${Math.round(pra.taxablePot).toLocaleString()}`, diff: `${country.symbol} ${Math.round(pra.advantage).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.praNote', { rate: praMarginalRate })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'sinkingFund' && (
      <div className="power-tool-card">
        <h3>{t('pt.sfTitle')}</h3>
        <p className="power-tool-desc">{t('pt.sfDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.sfAmount', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={sfTarget} onChange={(e) => setSfTarget(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.sfSaved', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={sfSaved} onChange={(e) => setSfSaved(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.sfMonths')}</label>
            <input type="number" min="0" max="120" value={sfMonths} onChange={(e) => setSfMonths(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.sfRate')}</label>
            <input type="number" min="0" step="0.1" value={sfRate} onChange={(e) => setSfRate(Number(e.target.value))} />
          </div>
        </div>
        {sfTarget > 0 && (
          <>
            <div className="power-verdict invest">
              {sfMonths > 0
                ? t('pt.sfSet', { monthly: `${country.symbol} ${Math.round(sinkingFund.monthlyAmount).toLocaleString()}`, months: sfMonths, target: `${country.symbol} ${Math.round(sfTarget).toLocaleString()}`, extra: sfSaved > 0 ? t('pt.sfExtra', { saved: `${country.symbol} ${Math.round(sfSaved).toLocaleString()}` }) : '' })
                : t('pt.sfNow', { amount: `${country.symbol} ${Math.round(Math.max(0, sfTarget - sfSaved)).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.sfNote', { rate: sfRate, interest: `${country.symbol} ${Math.round(sinkingFund.interestEarned).toLocaleString()}` })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'efRunway' && (
      <div className="power-tool-card">
        <h3>{t('pt.efrTitle')}</h3>
        <p className="power-tool-desc">{t('pt.efrDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.efrSavings', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={efrSavings} onChange={(e) => setEfrSavings(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.efrExpenses', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={efrExpenses} onChange={(e) => setEfrExpenses(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.efrInterest')}</label>
            <input type="number" min="0" step="0.1" value={efrRate} onChange={(e) => setEfrRate(Number(e.target.value))} />
          </div>
        </div>
        {efrSavings > 0 && efrExpenses > 0 && (
          <>
            <div className={`power-verdict ${efRunway.lastsIndefinitely || efRunway.fullMonths >= 6 ? 'invest' : efRunway.fullMonths >= 3 ? 'debt' : 'danger'}`}>
              {efRunway.lastsIndefinitely
                ? t('pt.efrIndef', { rate: efrRate, expenses: `${country.symbol}${Math.round(efrExpenses).toLocaleString()}` })
                : t('pt.efrCovers', { n: efRunway.fullMonths, unit: t(efRunway.fullMonths === 1 ? 'pt.unitMonth' : 'pt.unitMonths'), verdict: t(efRunway.fullMonths >= 6 ? 'pt.efrSolid' : efRunway.fullMonths >= 3 ? 'pt.efrReasonable' : 'pt.efrLow') })}
            </div>
            <p className="power-tool-note">
              {t('pt.efrNote', { expenses: `${country.symbol}${Math.round(efrExpenses).toLocaleString()}`, rate: efrRate })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'freqCompare' && (
      <div className="power-tool-card">
        <h3>{t('pt.fqTitle')}</h3>
        <p className="power-tool-desc">{t('pt.fqDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.fqAmount', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={fcPrincipal} onChange={(e) => setFcPrincipal(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('calculator.annualRate')}</label>
            <input type="number" step="0.1" value={fcRate} onChange={(e) => setFcRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('app.csvYears')}</label>
            <input type="number" min="1" max="60" value={fcYears} onChange={(e) => setFcYears(Number(e.target.value))} />
          </div>
        </div>
        {fcPrincipal > 0 && (
          <>
            <div className="tbl-wrap">
              <table className="power-freq-table">
                <thead>
                  <tr><th>{t('pt.fqCredited')}</th><th>{t('app.csvFinal')}</th><th>{t('pt.fqVsAnnual')}</th></tr>
                </thead>
                <tbody>
                  {freqRows.map(r => (
                    <tr key={r.key}>
                      <td>{t(`pt.freq_${r.key}`)}</td>
                      <td>{country.symbol} {Math.round(r.finalBalance).toLocaleString()}</td>
                      <td>{r.extraVsAnnual > 0 ? `+${country.symbol} ${Math.round(r.extraVsAnnual).toLocaleString()}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="power-tool-note">
              {t('pt.fqNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'budgetRule' && (
      <div className="power-tool-card">
        <h3>{t('pt.brTitle')}</h3>
        <p className="power-tool-desc">{t('pt.brDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.brIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={brIncome} onChange={(e) => setBrIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.brNeeds', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="500" value={brNeeds} onChange={(e) => setBrNeeds(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.brWants', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="500" value={brWants} onChange={(e) => setBrWants(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.brSaving', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="500" value={brSavings} onChange={(e) => setBrSavings(Number(e.target.value))} />
          </div>
        </div>
        {brIncome > 0 && (
          <>
            <div className={`power-verdict ${budgetRule.onTrack ? 'invest' : 'debt'}`}>
              {budgetRule.onTrack
                ? t('pt.brOn', { needs: budgetRule.actualPct.needs.toFixed(0), wants: budgetRule.actualPct.wants.toFixed(0), saving: budgetRule.actualPct.savings.toFixed(0) })
                : t('pt.brOff', { needs: budgetRule.actualPct.needs.toFixed(0), wants: budgetRule.actualPct.wants.toFixed(0), saving: budgetRule.actualPct.savings.toFixed(0) })}
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.brNeedsT')}</span>
                <strong>{country.symbol} {Math.round(budgetRule.targets.needs).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.brWantsT')}</span>
                <strong>{country.symbol} {Math.round(budgetRule.targets.wants).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.brSavingT')}</span>
                <strong>{country.symbol} {Math.round(budgetRule.targets.savings).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.brUnalloc')}</span>
                <strong className={Math.abs(budgetRule.unallocated) < 1 ? '' : budgetRule.unallocated > 0 ? 'positive' : 'warn'}>{country.symbol} {Math.round(budgetRule.unallocated).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.brNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'windfall' && (
      <div className="power-tool-card">
        <h3>{t('pt.wfTitle')}</h3>
        <p className="power-tool-desc">{t('pt.wfDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.wfAmount', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={wfAmount} onChange={(e) => setWfAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.wfEf', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={wfEfShortfall} onChange={(e) => setWfEfShortfall(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.wfDebt', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={wfHighDebt} onChange={(e) => setWfHighDebt(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.wfRoom', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="1000" value={wfWrapperRoom} onChange={(e) => setWfWrapperRoom(Number(e.target.value))} />
          </div>
        </div>
        {wfAmount > 0 && (
          <>
            <div className="power-verdict invest">{t('pt.wfSplit', { amount: `${country.symbol} ${Math.round(wfAmount).toLocaleString()}` })}</div>
            <div className="power-verdict-grid">
              {windfall.steps.map((s, i) => (
                <div className="power-stat" key={i}>
                  <span>{t(WINDFALL_LABEL_KEYS[s.label] || 'pt.wfInvest')}</span>
                  <strong className={s.label.startsWith('Invest') ? 'positive' : ''}>{country.symbol} {Math.round(s.amount).toLocaleString()}</strong>
                </div>
              ))}
            </div>
            <p className="power-tool-note">
              {t('pt.wfNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'marginalTax' && (
      <div className="power-tool-card">
        <h3>{t('pt.mtTitle')}</h3>
        <p className="power-tool-desc">{t('pt.mtDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.mtIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={mtIncome} onChange={(e) => setMtIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.mtDeduct', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={mtDeduction} onChange={(e) => setMtDeduction(Number(e.target.value))} />
          </div>
          {country.taxBrackets && (
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={mtProgressive} onChange={(e) => setMtProgressive(e.target.checked)} />
                {' '}{t('pt.salBrackets', { country: country.name })}
              </label>
            </div>
          )}
        </div>
        {mtIncome > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.mtRate')}</span>
                <strong className="warn">{marginalTax.marginalRate.toFixed(1)}%</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.mtKeeps', { amount: `${country.symbol}1,000` })}</span>
                <strong className="positive">{country.symbol} {Math.round(marginalTax.keepsFromNext).toLocaleString()}</strong>
              </div>
              {mtDeduction > 0 && (
                <div className="power-stat">
                  <span>{t('pt.mtSaves', { amount: `${country.symbol}${Math.round(mtDeduction).toLocaleString()}` })}</span>
                  <strong className="positive">{country.symbol} {Math.round(marginalTax.deductionTaxSaved).toLocaleString()}</strong>
                </div>
              )}
              {mtDeduction > 0 && (
                <div className="power-stat">
                  <span>{t('pt.mtCost')}</span>
                  <strong>{country.symbol} {Math.round(marginalTax.deductionNetCost).toLocaleString()}</strong>
                </div>
              )}
            </div>
            <p className="power-tool-note">
              {mtProgressive && country.taxBrackets
                ? (country.taxBracketsNote || t('pt.salNoteBrackets', { country: country.name }))
                : t('pt.mtNoteFlat', { rate: country.taxRate })} {t('pt.mtNoteTail')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'raiseInflation' && (
      <div className="power-tool-card">
        <h3>{t('pt.riTitle')}</h3>
        <p className="power-tool-desc">{t('pt.riDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.riSalary', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={riSalary} onChange={(e) => setRiSalary(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="inflation">{t('calculator.inflation')}</Term>{t('debt.rate')}</label>
            <input type="number" step="0.1" value={riInflation} onChange={(e) => setRiInflation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.riOffered')}</label>
            <input type="number" step="0.1" value={riOffered} onChange={(e) => setRiOffered(Number(e.target.value))} />
          </div>
        </div>
        {riSalary > 0 && (
          <>
            <div className={`power-verdict ${riOffered > 0 ? (raiseInflation.matchesInflation ? 'neutral' : raiseInflation.beatsInflation ? 'invest' : 'debt') : 'debt'}`}>
              {t('pt.riNeed', { pct: raiseInflation.breakEvenRaisePercent.toFixed(1), amount: `${country.symbol} ${Math.round(raiseInflation.breakEvenRaiseAmount).toLocaleString()}`, infl: riInflation })}
              {riOffered > 0 && ' ' + (raiseInflation.matchesInflation
                ? t('pt.riFlat', { offered: riOffered })
                : raiseInflation.beatsInflation
                  ? t('pt.riGain', { offered: riOffered, pct: raiseInflation.realChangePercent.toFixed(1) })
                  : t('pt.riCut', { offered: riOffered, pct: Math.abs(raiseInflation.realChangePercent).toFixed(1) }))}
            </div>
            <p className="power-tool-note">
              {t('pt.riNote', { infl: riInflation })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'rateShock' && (
      <div className="power-tool-card">
        <h3>{t('pt.rsTitle')}</h3>
        <p className="power-tool-desc">{t('pt.rsDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.rsBalance', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="50000" value={rsBalance} onChange={(e) => setRsBalance(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rsRate')}</label>
            <input type="number" min="0" step="0.1" value={rsRate} onChange={(e) => setRsRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rsYears')}</label>
            <input type="number" min="1" max="30" value={rsYearsLeft} onChange={(e) => setRsYearsLeft(Number(e.target.value))} />
          </div>
        </div>
        {rsBalance > 0 && (
          <>
            <div className="tbl-wrap">
              <table className="power-freq-table">
                <thead>
                  <tr><th>{t('pt.rsMove')}</th><th>{t('pt.rsNew')}</th><th>{t('pt.rsRepay')}</th><th>{t('pt.rsVsNow')}</th></tr>
                </thead>
                <tbody>
                  {rateShock.map(r => (
                    <tr key={r.shift}>
                      <td>{r.shift > 0 ? `+${r.shift}%` : r.shift < 0 ? `${r.shift}%` : t('pt.rsNoChange')}</td>
                      <td>{r.rate.toFixed(2)}%</td>
                      <td>{country.symbol} {Math.round(r.payment).toLocaleString()}</td>
                      <td>{r.shift === 0 ? '—' : `${r.deltaVsNow >= 0 ? '+' : '−'}${country.symbol} ${Math.round(Math.abs(r.deltaVsNow)).toLocaleString()}/mo`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="power-tool-note">
              {t('pt.rsNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'feeDrag' && (
      <div className="power-tool-card">
        <h3>{t('pt.fdTitle')}</h3>
        <p className="power-tool-desc">{t('pt.fdDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.fdStart', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={fdInitial} onChange={(e) => setFdInitial(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.fdMonthly', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="500" value={fdMonthly} onChange={(e) => setFdMonthly(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.fdGross')}</label>
            <input type="number" step="0.1" value={fdGross} onChange={(e) => setFdGross(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.fdFee')}</label>
            <input type="number" min="0" step="0.05" value={fdFee} onChange={(e) => setFdFee(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.fdYears')}</label>
            <input type="number" min="1" max="60" value={fdYears} onChange={(e) => setFdYears(Number(e.target.value))} />
          </div>
        </div>
        {(fdInitial > 0 || fdMonthly > 0) && fdFee > 0 && (
          <>
            <div className="power-verdict debt">
              {t('pt.fdVerdict', { fee: fdFee, cost: `${country.symbol} ${Math.round(feeDrag.lifetimeFeeCost).toLocaleString()}`, years: fdYears, pct: feeDrag.costAsPercentOfPot.toFixed(0) })}
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.fdNoFee')}</span>
                <strong className="positive">{country.symbol} {Math.round(feeDrag.finalNoFee).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.fdAfter', { fee: fdFee })}</span>
                <strong>{country.symbol} {Math.round(feeDrag.finalWithFee).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.fdNote', { gross: fdGross, net: (fdGross - fdFee).toFixed(2) })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'baristaFire' && (
      <div className="power-tool-card">
        <h3>{t('pt.bfTitle')}</h3>
        <p className="power-tool-desc">{t('pt.bfDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.bfExpenses', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={bfExpenses} onChange={(e) => setBfExpenses(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.bfIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={bfIncome} onChange={(e) => setBfIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="safeWithdrawalRate">{t('pt.swrTerm')}</Term> (%)</label>
            <input type="number" min="1" max="10" step="0.1" value={bfSwr} onChange={(e) => setBfSwr(Number(e.target.value))} />
          </div>
        </div>
        {bfExpenses > 0 && (
          <>
            <div className={`power-verdict ${barista.coversItself ? 'invest' : 'debt'}`}>
              {barista.coversItself
                ? t('pt.bfCovers', { income: `${country.symbol}${Math.round(bfIncome).toLocaleString()}` })
                : t('pt.bfNumber', { number: `${country.symbol} ${Math.round(barista.baristaFireNumber).toLocaleString()}`, reduction: `${country.symbol} ${Math.round(barista.reduction).toLocaleString()}`, full: `${country.symbol} ${Math.round(barista.fullFireNumber).toLocaleString()}`, gap: `${country.symbol} ${Math.round(barista.gap).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.bfNote', { swr: bfSwr })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'effRate' && (
      <div className="power-tool-card">
        <h3>{t('pt.erTitle')}</h3>
        <p className="power-tool-desc">{t('pt.erDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.erQuoted')}</label>
            <input type="number" step="0.01" value={erRate} onChange={(e) => setErRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.erPeriods')}</label>
            <select value={erPeriods} onChange={(e) => setErPeriods(Number(e.target.value))}>
              <option value="1">{t('pt.erP1')}</option>
              <option value="2">{t('pt.erP2')}</option>
              <option value="4">{t('pt.erP4')}</option>
              <option value="12">{t('pt.erP12')}</option>
              <option value="52">{t('pt.erP52')}</option>
              <option value="365">{t('pt.erP365')}</option>
            </select>
          </div>
        </div>
        {erRate !== 0 && (
          <div className="power-verdict-grid">
            <div className="power-stat">
              <span>{t('pt.erIfNominal', { rate: erRate })}</span>
              <strong className="positive">{effAnnual.toFixed(3)}%</strong>
            </div>
            <div className="power-stat">
              <span>{t('pt.erIfEffective', { rate: erRate })}</span>
              <strong>{nominalEquiv.toFixed(3)}%</strong>
            </div>
          </div>
        )}
        <p className="power-tool-note">
          {t('pt.erFormula')} (1 + r/n)<sup>n</sup> − 1. {t('pt.erNote')}
        </p>
      </div>
      )}

      {activeSubTab === 'leaseVsBuy' && (
      <div className="power-tool-card">
        <h3>{t('pt.lvTitle')}</h3>
        <p className="power-tool-desc">{t('pt.lvDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.lvPrice', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={lvbPrice} onChange={(e) => setLvbPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.lvDeposit', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={lvbDeposit} onChange={(e) => setLvbDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carRate')}</label>
            <input type="number" min="0" step="0.1" value={lvbFinanceRate} onChange={(e) => setLvbFinanceRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.carTerm')}</label>
            <input type="number" min="0" max="10" value={lvbFinanceTerm} onChange={(e) => setLvbFinanceTerm(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.lvDepr')}</label>
            <input type="number" min="0" max="50" step="0.5" value={lvbDepreciation} onChange={(e) => setLvbDepreciation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.lvPeriod')}</label>
            <input type="number" min="1" max="15" value={lvbPeriod} onChange={(e) => setLvbPeriod(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.lvUpfront', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={lvbLeaseUpfront} onChange={(e) => setLvbLeaseUpfront(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.lvPayment', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="500" value={lvbLeaseMonthly} onChange={(e) => setLvbLeaseMonthly(Number(e.target.value))} />
          </div>
        </div>
        {lvbPrice > 0 && lvbLeaseMonthly > 0 && (
          <>
            <div className={`power-verdict ${leaseBuy.buyIsCheaper ? 'invest' : 'debt'}`}>
              {t(leaseBuy.buyIsCheaper ? 'pt.lvBuyCheaper' : 'pt.lvLeaseCheaper', { years: lvbPeriod, amount: `${country.symbol} ${Math.round(leaseBuy.difference).toLocaleString()}` })}
            </div>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.lvBuyNet')}</span>
                <strong className={leaseBuy.buyIsCheaper ? 'positive' : 'warn'}>{country.symbol} {Math.round(leaseBuy.buyNetCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.lvBuyWorth')}</span>
                <strong>{country.symbol} {Math.round(leaseBuy.residualValue).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.lvLeaseTotal')}</span>
                <strong className={!leaseBuy.buyIsCheaper ? 'positive' : 'warn'}>{country.symbol} {Math.round(leaseBuy.leaseCost).toLocaleString()}</strong>
              </div>
            </div>
            <p className="power-tool-note">
              {t('pt.lvNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'retireGap' && (
      <div className="power-tool-card">
        <h3>{t('pt.rgTitle')}</h3>
        <p className="power-tool-desc">{t('pt.rgDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.rgPot', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100000" value={rgPot} onChange={(e) => setRgPot(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rgIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={rgTarget} onChange={(e) => setRgTarget(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="safeWithdrawalRate">{t('pt.swrTerm')}</Term> (%)</label>
            <input type="number" min="1" max="10" step="0.1" value={rgSwr} onChange={(e) => setRgSwr(Number(e.target.value))} />
          </div>
        </div>
        {rgPot > 0 && rgTarget > 0 && (
          <>
            <div className={`power-verdict ${retireGap.onTrack ? 'invest' : 'debt'}`}>
              {retireGap.onTrack
                ? t('pt.rgOn', { swr: rgSwrShown, pot: `${country.symbol} ${Math.round(rgPot).toLocaleString()}`, income: `${country.symbol} ${Math.round(retireGap.incomeFromPot).toLocaleString()}`, more: `${country.symbol} ${Math.round(-retireGap.annualGap).toLocaleString()}`, target: `${country.symbol} ${Math.round(rgTarget).toLocaleString()}` })
                : t('pt.rgShort', { gap: `${country.symbol} ${Math.round(retireGap.annualGap).toLocaleString()}`, income: `${country.symbol} ${Math.round(retireGap.incomeFromPot).toLocaleString()}`, pct: retireGap.coverageRatio.toFixed(0), capital: `${country.symbol} ${Math.round(retireGap.capitalGap).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.rgNote', { swr: rgSwrShown })}
            </p>

            {!retireGap.onTrack && (
              <div className="power-subsection">
                <h4>{t('pt.rgCloseTitle')}</h4>
                <p className="power-tool-desc">{t('pt.rgCloseDesc', { gap: `${country.symbol} ${Math.round(retireGap.capitalGap).toLocaleString()}` })}</p>
                <div className="power-form">
                  <div className="form-group">
                    <label>{t('pt.rgExtra', { symbol: country.symbol })}</label>
                    <input type="number" min="0" step="500" value={rgExtraMonthly} onChange={(e) => setRgExtraMonthly(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>{t('pt.rgGrowth')}</label>
                    <input type="number" step="0.1" value={rgCloseRate} onChange={(e) => setRgCloseRate(Number(e.target.value))} />
                  </div>
                </div>
                {rgExtraMonthly > 0 && rgCloseGap && (
                  <div className={`power-verdict ${rgCloseGap.reachable ? 'invest' : 'danger'}`}>
                    {rgCloseGap.reachable
                      ? t('pt.rgCloseYes', { when: monthsToYearsLabel(rgCloseGap.months), months: rgCloseGap.months, extra: `${country.symbol}${rgExtraMonthly.toLocaleString()}`, rate: rgCloseRate })
                      : t('pt.rgCloseNo', { extra: `${country.symbol}${rgExtraMonthly.toLocaleString()}`, rate: rgCloseRate })}
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
        <h3>{t('pt.dtTitle')}</h3>
        <p className="power-tool-desc">{t('pt.dtDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.dtPrice', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="50000" value={dtPrice} onChange={(e) => setDtPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.dtPercent')}</label>
            <input type="number" min="0" max="100" step="1" value={dtPercent} onChange={(e) => setDtPercent(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.dtSave', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="500" value={dtMonthly} onChange={(e) => setDtMonthly(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.dtSaved', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={dtSaved} onChange={(e) => setDtSaved(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.sfRate')}</label>
            <input type="number" min="0" step="0.1" value={dtRate} onChange={(e) => setDtRate(Number(e.target.value))} />
          </div>
        </div>
        {dtPrice > 0 && dtPercent > 0 && (
          <>
            <div className={`power-verdict ${depositTimeline.months === null ? 'danger' : depositTimeline.alreadyThere || depositTimeline.months <= 36 ? 'invest' : 'debt'}`}>
              {depositTimeline.alreadyThere
                ? t('pt.dtDone', { amount: `${country.symbol} ${Math.round(depositTimeline.targetAmount).toLocaleString()}` })
                : depositTimeline.months === null
                  ? t('pt.dtNever')
                  : t('pt.dtAbout', { months: depositTimeline.months, years: (depositTimeline.months / 12).toFixed(1), amount: `${country.symbol} ${Math.round(depositTimeline.targetAmount).toLocaleString()}`, pct: dtPercent, price: `${country.symbol} ${Math.round(dtPrice).toLocaleString()}` })}
            </div>
            {depositTimeline.months != null && depositTimeline.months > 0 && (
              <p className="power-tool-note">
                {t('pt.dtNote', { rate: dtRate, interest: `${country.symbol} ${Math.round(depositTimeline.interestEarned).toLocaleString()}` })}
              </p>
            )}
          </>
        )}
      </div>
      )}

      {activeSubTab === 'realReturn' && (
      <div className="power-tool-card">
        <h3>{t('pt.rrTitle')}</h3>
        <p className="power-tool-desc">{t('pt.rrDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.rrNominal')}</label>
            <input type="number" step="0.1" value={rrNominal} onChange={(e) => setRrNominal(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="inflation">{t('calculator.inflation')}</Term> (%/yr)</label>
            <input type="number" step="0.1" value={rrInflation} onChange={(e) => setRrInflation(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.rrTax')}</label>
            <input type="number" min="0" max="100" step="1" value={rrTax} onChange={(e) => setRrTax(Number(e.target.value))} />
          </div>
        </div>
        {rrNominal !== 0 && (
          <>
            <div className={`power-verdict ${realRet.losesToInflation ? 'danger' : realRet.realRate < 1 ? 'debt' : 'invest'}`}>
              {t('pt.rrVerdict', { nominal: rrNominal, after: realRet.afterTaxNominal.toFixed(1), tax: rrTax })}{' '}
              <strong>{t('pt.rrReal', { real: realRet.realRate.toFixed(1) })}</strong> {t('pt.rrInflOut', { infl: rrInflation })}
              {realRet.losesToInflation ? ' ' + t('pt.rrLoses') : ''}
            </div>
            <p className="power-tool-note">
              {t('pt.rrNote', { rough: realRet.roughApprox.toFixed(1), wrapper: country.wrapperLabel && country.wrapperLabel !== 'N/A' ? country.wrapperLabel : t('pt.taxFreeWrapper') })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'debtConsol' && (
      <div className="power-tool-card">
        <h3>{t('pt.dcTitle')}</h3>
        <p className="power-tool-desc">{t('pt.dcDesc')}</p>
        <div className="dc-rows">
          {dcRows.map((r, i) => (
            <div className="dc-row" key={r.id}>
              <span className="dc-row-num">{i + 1}</span>
              <div className="form-group">
                <label>{t('pt.dcBalance', { symbol: country.symbol })}</label>
                <input type="number" min="0" step="1000" value={r.balance} onChange={(e) => updateDcRow(r.id, 'balance', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>{t('pt.edInflationPost')}</label>
                <input type="number" min="0" step="0.5" value={r.rate} onChange={(e) => updateDcRow(r.id, 'rate', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>{t('pt.dcPay', { symbol: country.symbol })}</label>
                <input type="number" min="0" step="100" value={r.minPayment} onChange={(e) => updateDcRow(r.id, 'minPayment', Number(e.target.value))} />
              </div>
              <button className="dc-row-remove" onClick={() => removeDcRow(r.id)} disabled={dcRows.length <= 1} aria-label={t('pt.dcRemove', { n: i + 1 })}>×</button>
            </div>
          ))}
          {dcRows.length < 6 && <button className="power-use-fire-btn" onClick={addDcRow}>{t('pt.dcAdd')}</button>}
        </div>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.dcRate')}</label>
            <input type="number" min="0" step="0.5" value={dcNewRate} onChange={(e) => setDcNewRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('debt.consolidateTerm')}</label>
            <input type="number" min="1" max="30" step="1" value={dcNewTerm} onChange={(e) => setDcNewTerm(Number(e.target.value))} />
          </div>
        </div>
        {dcHasDebts && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.dcCombined')}</span>
                <strong>{country.symbol} {Math.round(debtConsol.totalBalance).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.dcNewMonthly')}</span>
                <strong>{country.symbol} {Math.round(debtConsol.consolidatedMonthly).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.dcNow')}</span>
                <strong>{country.symbol} {Math.round(debtConsol.currentMonthly).toLocaleString()}{t('pt.perMo')}</strong>
              </div>
            </div>
            <div className={`power-verdict ${debtConsol.interestSaved == null ? 'neutral' : debtConsol.interestSaved > 0 ? 'invest' : 'debt'}`}>
              {debtConsol.anyNeverPaysOff
                ? t('pt.dcNever', { rate: dcNewRate, years: dcNewTerm, monthly: `${country.symbol} ${Math.round(debtConsol.consolidatedMonthly).toLocaleString()}`, interest: `${country.symbol} ${Math.round(debtConsol.consolidatedInterest).toLocaleString()}` })
                : debtConsol.interestSaved > 0
                  ? t('pt.dcSaves', { saved: `${country.symbol} ${Math.round(debtConsol.interestSaved).toLocaleString()}`, sooner: debtConsol.monthsSaved > 0 ? t('pt.dcSooner', { n: debtConsol.monthsSaved }) : '', freed: debtConsol.monthlyDifference > 0 ? t('pt.dcFreed', { amount: `${country.symbol} ${Math.round(debtConsol.monthlyDifference).toLocaleString()}` }) : '' })
                  : t('pt.dcCosts', { more: `${country.symbol} ${Math.round(-debtConsol.interestSaved).toLocaleString()}`, freed: `${country.symbol} ${Math.round(debtConsol.monthlyDifference).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.dcNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'homeCosts' && (
      <div className="power-tool-card">
        <h3>{t('pt.hcTitle')}</h3>
        <p className="power-tool-desc">{t(country.code === 'za' ? 'pt.hcDescZa' : 'pt.hcDescOther')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.hcPrice', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="50000" value={hcPrice} onChange={(e) => setHcPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.hcDeposit', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={hcDeposit} onChange={(e) => setHcDeposit(Number(e.target.value))} />
          </div>
        </div>
        {hcPrice > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t(country.code === 'za' ? 'pt.hcTransferDuty' : 'pt.hcPurchaseTax')}</span>
                <strong>{country.symbol} {Math.round(homeCosts.transferDuty).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t(country.code === 'za' ? 'pt.hcAttorneys' : 'pt.hcProfFees')}</span>
                <strong>{country.symbol} {Math.round(homeCosts.transferAttorney + homeCosts.bondRegistration + homeCosts.deedsOffice).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.hcTotalFees')}</span>
                <strong className="warn">{country.symbol} {Math.round(homeCosts.totalFees).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.hcCash')}</span>
                <strong>{country.symbol} {Math.round(homeCosts.cashNeededUpfront).toLocaleString()}</strong>
              </div>
            </div>
            <div className="power-verdict neutral">
              {t('pt.hcVerdictA', { price: `${country.symbol} ${Math.round(hcPrice).toLocaleString()}` })} <strong>{country.symbol} {Math.round(homeCosts.cashNeededUpfront).toLocaleString()}</strong> {t('pt.hcVerdictB', { deposit: `${country.symbol} ${Math.round(hcDeposit).toLocaleString()}`, fees: `${country.symbol} ${Math.round(homeCosts.totalFees).toLocaleString()}`, pct: homeCosts.feesAsPctOfPrice.toFixed(1) })}
            </div>
            <p className="power-tool-note">
              {country.code === 'za'
                ? t('pt.hcNoteZa')
                : t('pt.hcNoteOther')}
              {' '}{t('pt.hcPair')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'bonusTax' && (
      <div className="power-tool-card">
        <h3>{t('pt.btTitle')}</h3>
        <p className="power-tool-desc">{t('pt.btDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.btSalary', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={btSalary} onChange={(e) => setBtSalary(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.btBonus', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={btBonus} onChange={(e) => setBtBonus(Number(e.target.value))} />
          </div>
        </div>
        {country.taxBrackets && (
          <label className="mc-compare-toggle">
            <input type="checkbox" checked={btProgressive} onChange={(e) => setBtProgressive(e.target.checked)} />
            {t('pt.btBrackets', { country: country.name, rate: country.taxRate })}
          </label>
        )}
        {btBonus > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.btTaxOn')}</span>
                <strong className="warn">{country.symbol} {Math.round(bonusTax.taxOnBonus).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.btKeep')}</span>
                <strong className="positive">{country.symbol} {Math.round(bonusTax.netBonus).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.btMarginal')}</span>
                <strong>{bonusTax.marginalRatePct.toFixed(0)}%</strong>
              </div>
            </div>
            <div className="power-verdict debt">
              {t('pt.btVerdictA', { bonus: `${country.symbol} ${Math.round(btBonus).toLocaleString()}` })} <strong>{country.symbol} {Math.round(bonusTax.netBonus).toLocaleString()}</strong> {t('pt.btVerdictB', { keep: bonusTax.keepPct.toFixed(0), tax: `${country.symbol} ${Math.round(bonusTax.taxOnBonus).toLocaleString()}`, avg: bonusTax.averageRateOnBonusPct.toFixed(0) })}
            </div>
            <p className="power-tool-note">
              {btProgressive && country.taxBrackets
                ? (country.taxBracketsNote || t('pt.btNoteBrackets', { country: country.name }))
                : t('pt.btNoteFlat', { rate: country.taxRate })}
              {' '}{t('pt.btNoteTail')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'raOptimizer' && (
      <div className="power-tool-card">
        <h3>{t('pt.raTitle')}</h3>
        <p className="power-tool-desc">{t('pt.raDesc', { cap: `${country.symbol}350,000` })}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.raIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={raIncome} onChange={(e) => setRaIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.raSoFar', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={raCurrent} onChange={(e) => setRaCurrent(Number(e.target.value))} />
          </div>
        </div>
        {country.taxBrackets && (
          <label className="mc-compare-toggle">
            <input type="checkbox" checked={raProgressive} onChange={(e) => setRaProgressive(e.target.checked)} />
            {t('pt.raBrackets', { country: country.name })}
          </label>
        )}
        {raIncome > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.raCeiling')}</span>
                <strong>{country.symbol} {Math.round(raResult.maxDeductible).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.raRoom')}</span>
                <strong className={raResult.roomRemaining > 0 ? 'positive' : ''}>{country.symbol} {Math.round(raResult.roomRemaining).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.raSaved')}</span>
                <strong className="positive">{country.symbol} {Math.round(raResult.taxSavingIfMaxed).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${raResult.alreadyOverLimit ? 'neutral' : 'invest'}`}>
              {raResult.alreadyOverLimit
                ? t('pt.raOver', { limit: `${country.symbol}${Math.round(raResult.maxDeductible).toLocaleString()}` })
                : t('pt.raRoomVerdict', { room: `${country.symbol} ${Math.round(raResult.roomRemaining).toLocaleString()}`, saving: `${country.symbol} ${Math.round(raResult.taxSavingIfMaxed).toLocaleString()}`, pct: raResult.effectiveReliefPct.toFixed(0), cost: `${country.symbol} ${Math.round(raResult.netCostIfMaxed).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.raNote', { cap: `${country.symbol}350,000`, by: raResult.limitedBy === 'cap' ? t('pt.raCap', { cap: `${country.symbol}350k` }) : t('pt.raRate') })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'seqRisk' && (
      <div className="power-tool-card">
        <h3>{t('pt.sqTitle')}</h3>
        <p className="power-tool-desc">{t('pt.sqDescA')} <em>{t('pt.sqDescEm')}</em>{t('pt.sqDescB')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.sqPot', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100000" value={sqPot} onChange={(e) => setSqPot(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.sqWithdrawal', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={sqWithdrawal} onChange={(e) => setSqWithdrawal(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.ddLength')}</label>
            <input type="number" min="1" max="60" step="1" value={sqYears} onChange={(e) => setSqYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.sqAvg')}</label>
            <input type="number" step="0.5" value={sqAvgReturn} onChange={(e) => setSqAvgReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.sqBad')}</label>
            <input type="number" step="0.5" value={sqBadReturn} onChange={(e) => setSqBadReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.sqBadYears')}</label>
            <input type="number" min="0" max="20" step="1" value={sqBadYears} onChange={(e) => setSqBadYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label><Term k="inflation">{t('calculator.inflation')}</Term> {t('pt.sqOnWd')}</label>
            <input type="number" min="0" step="0.5" value={sqInflation} onChange={(e) => setSqInflation(Number(e.target.value))} />
          </div>
        </div>
        {sqPot > 0 && sqWithdrawal > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.sqFirst')}</span>
                <strong className="warn">{t('pt.yrsShort', { n: seqResult.earlyLosses.yearsLasted })}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.sqLast')}</span>
                <strong className="positive">{seqResult.lateLosses.depleted ? t('pt.yrsShort', { n: seqResult.lateLosses.yearsLasted }) : t('pt.yrsPlus', { n: seqResult.horizonYears })}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.sqGood')}</span>
                <strong>{seqResult.goodYearReturn.toFixed(1)}%</strong>
              </div>
            </div>
            <div className={`power-verdict ${seqResult.bothSurvive ? 'invest' : seqResult.yearsGap >= 3 ? 'danger' : 'debt'}`}>
              {seqResult.bothSurvive
                ? t('pt.sqBoth', { years: seqResult.horizonYears })
                : t('pt.sqGap', { avg: sqAvgReturn, bad: sqBadYears, gap: seqResult.yearsGap, early: seqResult.earlyLosses.yearsLasted, late: seqResult.lateLosses.depleted ? seqResult.lateLosses.yearsLasted : `${seqResult.horizonYears}+` })}
            </div>
            <p className="power-tool-note">
              {t('pt.sqNote', { years: seqResult.horizonYears, avg: sqAvgReturn, infl: sqInflation })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'twoPot' && (
      <div className="power-tool-card">
        <h3>{t('pt.tpTitle')}</h3>
        <p className="power-tool-desc">{t('pt.tpDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.tpAmount', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={tpAmount} onChange={(e) => setTpAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.tpIncome', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={tpIncome} onChange={(e) => setTpIncome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.tpYears')}</label>
            <input type="number" min="0" max="60" step="1" value={tpYearsToRetire} onChange={(e) => setTpYearsToRetire(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.tpGrowth')}</label>
            <input type="number" step="0.5" value={tpGrowth} onChange={(e) => setTpGrowth(Number(e.target.value))} />
          </div>
        </div>
        {country.taxBrackets && (
          <label className="mc-compare-toggle">
            <input type="checkbox" checked={tpProgressive} onChange={(e) => setTpProgressive(e.target.checked)} />
            {t('pt.tpBrackets', { country: country.name })}
          </label>
        )}
        {tpAmount > 0 && tpAmount < TWO_POT_MIN_WITHDRAWAL && (
          <div className="power-verdict danger">
            {t('pt.tpMin', { min: `R${TWO_POT_MIN_WITHDRAWAL.toLocaleString()}` })}
          </div>
        )}
        {tpAmount >= TWO_POT_MIN_WITHDRAWAL && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.tpTax')}</span>
                <strong className="warn">{country.symbol} {Math.round(twoPot.taxOnWithdrawal).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.tpNet')}</span>
                <strong>{country.symbol} {Math.round(twoPot.netCashNow).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.tpGiven')}</span>
                <strong className="warn">{country.symbol} {Math.round(twoPot.futureValueForgone).toLocaleString()}</strong>
              </div>
            </div>
            <div className="power-verdict danger">
              {t('pt.tpVerdictA', { amount: `${country.symbol} ${Math.round(tpAmount).toLocaleString()}`, net: `${country.symbol} ${Math.round(twoPot.netCashNow).toLocaleString()}`, pct: twoPot.marginalRatePct.toFixed(0) })} <strong>{country.symbol} {Math.round(twoPot.futureValueForgone).toLocaleString()}</strong> {t('pt.tpVerdictB', { cost: `${country.symbol}${twoPot.costPerRandTaken.toFixed(2)}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.tpNote', { growth: tpGrowth, years: Math.round(tpYearsToRetire), taxYear: tpTaxYear.label, end: tpTaxYear.endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'loanCompare' && (
      <div className="power-tool-card">
        <h3>{t('pt.lcTitle')}</h3>
        <p className="power-tool-desc">{t('pt.lcDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.lcAmount', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={lcAmount} onChange={(e) => setLcAmount(Number(e.target.value))} />
          </div>
        </div>
        <div className="dc-rows">
          <div className="dc-row">
            <span className="dc-row-num">A</span>
            <div className="form-group"><label>{t('pt.edInflationPost')}</label><input type="number" step="0.5" value={lcaRate} onChange={(e) => setLcaRate(Number(e.target.value))} /></div>
            <div className="form-group"><label>{t('pt.lcTerm')}</label><input type="number" min="1" max="30" value={lcaTerm} onChange={(e) => setLcaTerm(Number(e.target.value))} /></div>
            <div className="form-group"><label>{t('pt.lcUpfront', { symbol: country.symbol })}</label><input type="number" min="0" step="500" value={lcaUpfront} onChange={(e) => setLcaUpfront(Number(e.target.value))} /></div>
            <div className="form-group"><label>{t('pt.lcMonthlyFee', { symbol: country.symbol })}</label><input type="number" min="0" step="10" value={lcaMonthly} onChange={(e) => setLcaMonthly(Number(e.target.value))} /></div>
          </div>
          <div className="dc-row">
            <span className="dc-row-num">B</span>
            <div className="form-group"><label>{t('pt.edInflationPost')}</label><input type="number" step="0.5" value={lcbRate} onChange={(e) => setLcbRate(Number(e.target.value))} /></div>
            <div className="form-group"><label>{t('pt.lcTerm')}</label><input type="number" min="1" max="30" value={lcbTerm} onChange={(e) => setLcbTerm(Number(e.target.value))} /></div>
            <div className="form-group"><label>{t('pt.lcUpfront', { symbol: country.symbol })}</label><input type="number" min="0" step="500" value={lcbUpfront} onChange={(e) => setLcbUpfront(Number(e.target.value))} /></div>
            <div className="form-group"><label>{t('pt.lcMonthlyFee', { symbol: country.symbol })}</label><input type="number" min="0" step="10" value={lcbMonthly} onChange={(e) => setLcbMonthly(Number(e.target.value))} /></div>
          </div>
        </div>
        {lcAmount > 0 && loanCompare.a && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.lcATotal')}</span>
                <strong className={loanCompare.cheaper === 'A' ? 'positive' : ''}>{country.symbol} {Math.round(loanCompare.a.totalCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.lcBTotal')}</span>
                <strong className={loanCompare.cheaper === 'B' ? 'positive' : ''}>{country.symbol} {Math.round(loanCompare.b.totalCost).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.lcMonthlyAB')}</span>
                <strong>{country.symbol} {Math.round(loanCompare.a.monthlyPayment).toLocaleString()} / {Math.round(loanCompare.b.monthlyPayment).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${loanCompare.cheaper === 'tie' ? 'neutral' : 'invest'}`}>
              {loanCompare.cheaper === 'tie'
                ? t('pt.lcTie')
                : t('pt.lcCheaper', { offer: loanCompare.cheaper, saving: `${country.symbol} ${Math.round(loanCompare.totalCostSaving).toLocaleString()}`, diff: loanCompare.monthlyDifference > 1 ? t('pt.lcDiff', { amount: `${country.symbol} ${Math.round(loanCompare.monthlyDifference).toLocaleString()}` }) : '' })}
            </div>
            <p className="power-tool-note">
              {t('pt.lcNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'subCost' && (
      <div className="power-tool-card">
        <h3>{t('pt.scTitle')}</h3>
        <p className="power-tool-desc">{t('pt.scDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.scMonthly', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10" value={scMonthly} onChange={(e) => setScMonthly(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.scYears')}</label>
            <input type="number" min="1" max="60" step="1" value={scYears} onChange={(e) => setScYears(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.scInvested')}</label>
            <input type="number" step="0.5" value={scReturn} onChange={(e) => setScReturn(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.scIncrease')}</label>
            <input type="number" min="0" step="0.5" value={scIncrease} onChange={(e) => setScIncrease(Number(e.target.value))} />
          </div>
        </div>
        {scMonthly > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.scNow')}</span>
                <strong>{country.symbol} {Math.round(subCost.annualCostNow).toLocaleString()}{t('pt.perYr')}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.scTotal', { years: subCost.horizonYears })}</span>
                <strong className="warn">{country.symbol} {Math.round(subCost.totalPaid).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.scInvestedInstead')}</span>
                <strong className="positive">{country.symbol} {Math.round(subCost.investedInsteadValue).toLocaleString()}</strong>
              </div>
            </div>
            <div className="power-verdict debt">
              {t('pt.scVerdictA', { monthly: `${country.symbol}${Math.round(scMonthly).toLocaleString()}`, annual: `${country.symbol}${Math.round(subCost.annualCostNow).toLocaleString()}` })} <strong>{country.symbol} {Math.round(subCost.totalPaid).toLocaleString()}</strong> {t('pt.scVerdictB', { years: subCost.horizonYears, incr: scIncrease, ret: scReturn, invested: `${country.symbol} ${Math.round(subCost.investedInsteadValue).toLocaleString()}`, opp: `${country.symbol} ${Math.round(subCost.opportunityCost).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.scNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'payback' && (
      <div className="power-tool-card">
        <h3>{t('pt.pbTitle')}</h3>
        <p className="power-tool-desc">{t('pt.pbDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.pbCost', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={pbCost} onChange={(e) => setPbCost(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.pbSaves', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="100" value={pbSaving} onChange={(e) => setPbSaving(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.pbUpkeep', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="50" value={pbMaint} onChange={(e) => setPbMaint(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.pbLife')}</label>
            <input type="number" min="1" max="50" step="1" value={pbLife} onChange={(e) => setPbLife(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.pbGrows')}</label>
            <input type="number" step="0.5" value={pbSavingGrowth} onChange={(e) => setPbSavingGrowth(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.scInvested')}</label>
            <input type="number" step="0.5" value={pbReturn} onChange={(e) => setPbReturn(Number(e.target.value))} />
          </div>
        </div>
        {pbCost > 0 && pbSaving > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.pbBreaks')}</span>
                <strong className={payback.breakEvenMonths ? 'positive' : 'warn'}>
                  {payback.breakEvenMonths ? t('pt.yrsShort', { n: payback.breakEvenYears.toFixed(1) }) : '—'}
                </strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.pbNetOver', { years: Math.round(pbLife) })}</span>
                <strong className={payback.lifetimeNet >= 0 ? 'positive' : 'warn'}>{country.symbol} {Math.round(payback.lifetimeNet).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.pbFirst')}</span>
                <strong>{country.symbol} {Math.round(payback.firstYearSaving).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${payback.neverBreaksEven ? 'danger' : payback.beatsInvesting ? 'invest' : 'debt'}`}>
              {payback.neverBreaksEven
                ? t('pt.pbNever')
                : payback.breakEvenMonths
                  ? t('pt.pbPays', { years: payback.breakEvenYears.toFixed(1), net: `${country.symbol} ${Math.round(payback.lifetimeNet).toLocaleString()}`, life: Math.round(pbLife) }) + ' ' + (payback.beatsInvesting ? t('pt.pbBeats', { ret: pbReturn }) : t('pt.pbLoses', { cost: `${country.symbol}${Math.round(pbCost).toLocaleString()}`, ret: pbReturn, value: `${country.symbol}${Math.round(payback.investedInsteadValue).toLocaleString()}` }))
                  : t('pt.pbNo', { life: Math.round(pbLife) })}
            </div>
            <p className="power-tool-note">
              {t('pt.pbNote', { ret: pbReturn })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'cashVsFinance' && (
      <div className="power-tool-card">
        <h3>{t('pt.cfTitle2')}</h3>
        <p className="power-tool-desc">{t('pt.cfDesc2')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.cfPrice', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={cfPrice} onChange={(e) => setCfPrice(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.cfDeposit', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="5000" value={cfDeposit} onChange={(e) => setCfDeposit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.cfRate')}</label>
            <input type="number" step="0.5" value={cfRate} onChange={(e) => setCfRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.cfTerm')}</label>
            <input type="number" min="1" max="10" step="1" value={cfTerm} onChange={(e) => setCfTerm(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.cfInvest')}</label>
            <input type="number" step="0.5" value={cfReturn} onChange={(e) => setCfReturn(Number(e.target.value))} />
          </div>
        </div>
        {cfPrice > 0 && cashVsFinance.cheaper && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.cfInterest')}</span>
                <strong className="warn">{country.symbol} {Math.round(cashVsFinance.financeInterest).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('debt.monthlyPayment')}</span>
                <strong>{country.symbol} {Math.round(cashVsFinance.monthlyPayment).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.cfGap', { years: Math.round(cfTerm) })}</span>
                <strong className="positive">{country.symbol} {Math.round(cashVsFinance.gap).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${cashVsFinance.cheaper === 'tie' ? 'neutral' : 'invest'}`}>
              {cashVsFinance.cheaper === 'tie'
                ? t('pt.cfTie', { ret: cfReturn, rate: cfRate })
                : cashVsFinance.cheaper === 'cash'
                  ? t('pt.cfCash', { gap: `${country.symbol} ${Math.round(cashVsFinance.gap).toLocaleString()}`, years: Math.round(cfTerm), ret: cfReturn, rate: cfRate })
                  : t('pt.cfFinance', { gap: `${country.symbol} ${Math.round(cashVsFinance.gap).toLocaleString()}`, ret: cfReturn, rate: cfRate })}
            </div>
            <p className="power-tool-note">
              {t('pt.cfNote2', { be: cashVsFinance.breakEvenReturnApprox })}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'fundFees' && (
      <div className="power-tool-card">
        <h3>{t('pt.ffTitle')}</h3>
        <p className="power-tool-desc">{t('pt.ffDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.ffStart', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={ffInitial} onChange={(e) => setFfInitial(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.ffMonthly', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="500" value={ffMonthly} onChange={(e) => setFfMonthly(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('app.csvYears')}</label>
            <input type="number" min="1" max="60" step="1" value={ffYears} onChange={(e) => setFfYears(Number(e.target.value))} />
          </div>
        </div>
        <div className="dc-rows">
          <div className="dc-row">
            <span className="dc-row-num">A</span>
            <div className="form-group"><label>{t('pt.ffGross')}</label><input type="number" step="0.1" value={ffGrossA} onChange={(e) => setFfGrossA(Number(e.target.value))} /></div>
            <div className="form-group"><label>{t('pt.ffTer')}</label><input type="number" min="0" step="0.05" value={ffTerA} onChange={(e) => setFfTerA(Number(e.target.value))} /></div>
          </div>
          <div className="dc-row">
            <span className="dc-row-num">B</span>
            <div className="form-group"><label>{t('pt.ffGross')}</label><input type="number" step="0.1" value={ffGrossB} onChange={(e) => setFfGrossB(Number(e.target.value))} /></div>
            <div className="form-group"><label>{t('pt.ffTer')}</label><input type="number" min="0" step="0.05" value={ffTerB} onChange={(e) => setFfTerB(Number(e.target.value))} /></div>
          </div>
        </div>
        {(ffInitial > 0 || ffMonthly > 0) && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.ffAEnds')}</span>
                <strong className={fundFees.winner === 'A' ? 'positive' : ''}>{country.symbol} {Math.round(fundFees.a.finalBalance).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.ffBEnds')}</span>
                <strong className={fundFees.winner === 'B' ? 'positive' : ''}>{country.symbol} {Math.round(fundFees.b.finalBalance).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.ffGap', { years: Math.round(ffYears) })}</span>
                <strong className="warn">{country.symbol} {Math.round(fundFees.endingGap).toLocaleString()}</strong>
              </div>
            </div>
            <div className={`power-verdict ${fundFees.winner === 'tie' ? 'neutral' : 'invest'}`}>
              {fundFees.winner === 'tie'
                ? t('pt.ffTie')
                : t('pt.ffWinner', { fund: fundFees.winner, gap: `${country.symbol} ${Math.round(fundFees.endingGap).toLocaleString()}`, years: Math.round(ffYears), a: `${country.symbol} ${Math.round(fundFees.a.feeCost).toLocaleString()}`, b: `${country.symbol} ${Math.round(fundFees.b.feeCost).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.ffNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'contractRate' && (
      <div className="power-tool-card">
        <h3>{t('pt.crTitle')}</h3>
        <p className="power-tool-desc">{t('pt.crDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.crTake', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="20000" value={crTakeHome} onChange={(e) => setCrTakeHome(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.crTax')}</label>
            <input type="number" min="0" max="60" step="1" value={crTaxRate} onChange={(e) => setCrTaxRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.crBenefits')}</label>
            <input type="number" min="0" max="50" step="1" value={crBenefits} onChange={(e) => setCrBenefits(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.crWeeks')}</label>
            <input type="number" min="1" max="52" step="1" value={crWeeks} onChange={(e) => setCrWeeks(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.crHours')}</label>
            <input type="number" min="1" max="80" step="1" value={crHours} onChange={(e) => setCrHours(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.crUtil')}</label>
            <input type="number" min="1" max="100" step="5" value={crUtil} onChange={(e) => setCrUtil(Number(e.target.value))} />
          </div>
        </div>
        {crTakeHome > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.crRate')}</span>
                <strong className="positive">{country.symbol} {Math.round(contractRate.hourlyRate).toLocaleString()}{t('pt.perHr')}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.crDay')}</span>
                <strong>{country.symbol} {Math.round(contractRate.dailyRate).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.crRevenue')}</span>
                <strong>{country.symbol} {Math.round(contractRate.grossRevenueNeeded).toLocaleString()}{t('pt.perYr')}</strong>
              </div>
            </div>
            <div className="power-verdict invest">
              {t('pt.crVerdictA', { take: `${country.symbol} ${Math.round(crTakeHome).toLocaleString()}` })} <strong>{t('pt.crVerdictRate', { rate: `${country.symbol} ${Math.round(contractRate.hourlyRate).toLocaleString()}` })}</strong> {t('pt.crVerdictB', { day: `${country.symbol} ${Math.round(contractRate.dailyRate).toLocaleString()}`, hours: Math.round(contractRate.billableHoursPerYear).toLocaleString(), pct: (contractRate.upliftVsNaive * 100).toFixed(0) })}
            </div>
            <p className="power-tool-note">
              {t('pt.crNote')}
            </p>
          </>
        )}
      </div>
      )}

      {activeSubTab === 'vat' && (
      <div className="power-tool-card">
        <h3>{t('pt.vatTitle')}</h3>
        <p className="power-tool-desc">{t('pt.vatDesc')}</p>
        <div className="vat-mode-toggle">
          <button className={vatMode === 'add' ? 'active' : ''} onClick={() => setVatMode('add')}>{t('pt.vatAdd')}</button>
          <button className={vatMode === 'extract' ? 'active' : ''} onClick={() => setVatMode('extract')}>{t('pt.vatExtract')}</button>
        </div>
        <div className="power-form">
          <div className="form-group">
            <label>{t(vatMode === 'add' ? 'pt.vatPriceEx' : 'pt.vatPriceIn', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10" value={vatAmount} onChange={(e) => setVatAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.vatRate')}</label>
            <input type="number" min="0" max="30" step="0.5" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} />
          </div>
        </div>
        {vatAmount > 0 && (
          <div className="power-verdict-grid">
            <div className="power-stat">
              <span>{t('pt.vatExcl')}</span>
              <strong>{country.symbol} {Math.round(vatResult.exclusiveAmount).toLocaleString()}</strong>
            </div>
            <div className="power-stat">
              <span>{t('pt.vatLine', { rate: vatRate })}</span>
              <strong className="warn">{country.symbol} {Math.round(vatResult.vatAmount).toLocaleString()}</strong>
            </div>
            <div className="power-stat">
              <span>{t('pt.vatIncl')}</span>
              <strong className="positive">{country.symbol} {Math.round(vatResult.inclusiveAmount).toLocaleString()}</strong>
            </div>
          </div>
        )}
      </div>
      )}

      {activeSubTab === 'cgt' && (
      <div className="power-tool-card">
        <h3>{t('pt.cgtTitle')}</h3>
        <p className="power-tool-desc">{t('pt.cgtDesc')}</p>
        <div className="power-form">
          <div className="form-group">
            <label>{t('pt.cgtProceeds', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={cgtProceeds} onChange={(e) => setCgtProceeds(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.cgtBase', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={cgtBaseCost} onChange={(e) => setCgtBaseCost(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t('pt.cgtOther', { symbol: country.symbol })}</label>
            <input type="number" min="0" step="10000" value={cgtOtherIncome} onChange={(e) => setCgtOtherIncome(Number(e.target.value))} />
          </div>
        </div>
        {country.taxBrackets && (
          <label className="mc-compare-toggle">
            <input type="checkbox" checked={cgtProgressive} onChange={(e) => setCgtProgressive(e.target.checked)} />
            {t('pt.cgtBrackets', { country: country.name })}
          </label>
        )}
        {cgtProceeds > 0 && (
          <>
            <div className="power-verdict-grid">
              <div className="power-stat">
                <span>{t('pt.cgtGross')}</span>
                <strong>{country.symbol} {Math.round(cgtResult.grossGain).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.cgtTaxable')}</span>
                <strong>{country.symbol} {Math.round(cgtResult.taxableCapitalGain).toLocaleString()}</strong>
              </div>
              <div className="power-stat">
                <span>{t('pt.cgtOwed')}</span>
                <strong className="warn">{country.symbol} {Math.round(cgtResult.taxOnGain).toLocaleString()}</strong>
              </div>
            </div>
            <div className="power-verdict debt">
              {t('pt.cgtVerdictA', { gain: `${country.symbol} ${Math.round(cgtResult.grossGain).toLocaleString()}` })} <strong>{country.symbol} {Math.round(cgtResult.taxOnGain).toLocaleString()}</strong> {t('pt.cgtVerdictB', { eff: cgtResult.effectiveRateOnGainPct.toFixed(1), marg: cgtResult.marginalRatePct.toFixed(0), taxable: `${country.symbol}${Math.round(cgtResult.taxableCapitalGain).toLocaleString()}`, net: `${country.symbol} ${Math.round(cgtResult.netProceeds).toLocaleString()}` })}
            </div>
            <p className="power-tool-note">
              {t('pt.cgtNote', { exclusion: `R${CGT_ANNUAL_EXCLUSION.toLocaleString()}`, inclusion: CGT_INCLUSION_RATE_INDIVIDUAL })}
            </p>
          </>
        )}
      </div>
      )}
    </div>
  );
};

export default PowerTools;
