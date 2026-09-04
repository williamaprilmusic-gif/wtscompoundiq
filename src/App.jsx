// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import TierPricing, { UPGRADE_PRICES } from './components/TierPricing';
import PaymentSection from './components/PaymentSection';
import { calculateCompoundInterest } from './engine';
import { costOfWaiting } from './costOfWaiting';
import { countriesData as WTS_COUNTRIES, getCountryByCode, getVerificationInfo } from './data/countries';
import AIAdvisor from './components/AIAdvisor';
import TaxOptimizer from './components/TaxOptimizer';
import Invest from './components/Invest';
import Coach from './components/Coach';
import PowerTools from './components/PowerTools';
import Compare from './components/Compare';
import MonteCarlo from './components/MonteCarlo';
import wtsLogo from './assets/wts-logo.png';
import StartHere from './components/StartHere';
import DebtPayoff from './components/DebtPayoff';
import LoanCalculator from './components/LoanCalculator';
import Dashboard from './components/Dashboard';
import EmergencyFund from './components/EmergencyFund';
import MyPlan from './components/MyPlan';
import Snapshot from './components/Snapshot';
import NetWorth from './components/NetWorth';
import Budget from './components/Budget';
import DataBackup from './components/DataBackup';
import LegalModal from './components/LegalModal';
import LanguageSwitcher from './components/LanguageSwitcher';
import OnboardingTour, { TOUR_SEEN_KEY } from './components/OnboardingTour';
import { useLanguage } from './i18n/LanguageContext';
import Term from './components/Term';
import GrowthChart from './components/GrowthChart';
import CountrySelect from './components/CountrySelect';
import { buildShareUrl, parseShareParams, clearShareParamsFromUrl } from './utils/shareLink';
import { downloadCSV } from './utils/csv';
import { uniqueId } from './utils/uniqueId';
import { readEntitlement, refreshEntitlement, clearEntitlement, consumePaystackRedirect } from './utils/entitlement';
import { projectionMilestones } from './projectionMilestones';
import { solveMonthlyForGoal } from './goalSolver';

const THEME_KEY = 'wts_compoundiq_theme';
const REPORTING_CURRENCY_KEY = 'wts_compoundiq_reporting_currency';
// Generous enough for any realistic plan (a 20-year-old projecting to age 100+), but
// bounded -- an unbounded "years" value feeds every per-year loop in the app (the
// yearly table, the growth chart, and especially Monte Carlo's 1,000-path simulation),
// and a huge typed-in value would otherwise freeze the tab with zero feedback.
const MAX_YEARS = 100;

export default function App() {
  const { t } = useLanguage();
  // Computed fresh each render, but only ever matters on the very first one (the
  // lazy useState initializers below run once) -- once the URL is cleaned up after
  // mount, this naturally becomes null on subsequent renders anyway.
  const shareParams = parseShareParams();

  const [activeTab, setActiveTab] = useState(() => shareParams ? 'Calculator' : 'Start Here');
  const [userTier, setUserTier] = useState('Basic');
  // Dark is this app's original, always-on look -- only switch to light if the user
  // explicitly chose it last time (no OS prefers-color-scheme auto-detection, since
  // the app never followed system theme before and silently flipping on a light-OS
  // visitor would be a surprise, not a fix).
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore (private mode, storage full, etc.) */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const [showPricing, setShowPricing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  // Auto-shows once per browser on first visit; the footer's "Take the Tour" link
  // (see below) can always replay it on demand afterwards.
  const [showTour, setShowTour] = useState(() => {
    try { return localStorage.getItem(TOUR_SEEN_KEY) !== 'true'; } catch { return false; }
  });
  const closeTour = () => {
    setShowTour(false);
    try { localStorage.setItem(TOUR_SEEN_KEY, 'true'); } catch { /* ignore (private mode, storage full, etc.) */ }
  };
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState(null);
  // 'monthly' | 'annual' -- only Pro/Ultra offer an annual option (set via TierPricing's
  // toggle); every other entry point into checkout (a locked-tab click) has no billing
  // selector, so handleUpgradeClick below resets this to 'monthly' rather than carrying
  // over a stale choice from an earlier abandoned pricing-modal visit.
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState('monthly');
  const [pendingTab, setPendingTab] = useState(null);
  // Short-lived in-app confirmation after a tier change -- replaces the blocking
  // alert()s the upgrade/downgrade paths used to fire (which a browser can suppress,
  // making the whole thing look like it did nothing).
  const [tierChangeMsg, setTierChangeMsg] = useState(null);

  // Calculator state -- starts blank; every number here should come from the user, not
  // a placeholder scenario. The one exception is a shared plan link: if the URL carries
  // valid share params (see utils/shareLink.js), those seed these fields instead so a
  // link someone sends actually opens showing their plan.
  const [country, setCountry] = useState(() => shareParams?.countryCode ? getCountryByCode(shareParams.countryCode) : WTS_COUNTRIES[0]);

  // Net Worth, Debt Payoff, and Emergency Fund each convert their saved history
  // through the currently selected country's currency (see their own convertedHistory
  // memos) -- but "currently selected country" used to mean the Calculator tab's
  // scenario country specifically, so switching countries there to explore a different
  // scenario would also silently change what currency your net worth/debt/emergency
  // fund figures display in. This is a separate, independent "what currency do I want
  // to SEE my saved figures in" choice -- '' means "follow the Calculator's country"
  // (the original, still-default behavior), any other code pins it regardless of what
  // the Calculator tab is set to. Loan Calculator/My Plan/Snapshot intentionally still
  // use `country` directly, not this -- they show raw figures the user typed in a
  // specific currency with no conversion pipeline behind them, so relabeling their
  // symbol without converting the number would misrepresent the amount.
  const [reportingCurrencyCode, setReportingCurrencyCode] = useState(() => {
    try { return localStorage.getItem(REPORTING_CURRENCY_KEY) || ''; } catch { return ''; }
  });
  useEffect(() => {
    try { localStorage.setItem(REPORTING_CURRENCY_KEY, reportingCurrencyCode); } catch { /* ignore (private mode, storage full, etc.) */ }
  }, [reportingCurrencyCode]);
  const reportingCountry = reportingCurrencyCode ? (getCountryByCode(reportingCurrencyCode) || country) : country;
  const [initial, setInitial] = useState(() => shareParams?.initial ?? 0);
  const [monthly, setMonthly] = useState(() => shareParams?.monthly ?? 0);
  const [rate, setRate] = useState(() => shareParams?.rate ?? 0);
  const [years, setYears] = useState(() => shareParams?.years ?? 1);
  const [inflation, setInflation] = useState(() => shareParams?.inflation ?? 0);
  const [wrapper, setWrapper] = useState(() => shareParams?.wrapper ?? false);
  const [compoundFrequency, setCompoundFrequency] = useState(() => shareParams?.compoundFrequency ?? 12);
  const [contributionIncrease, setContributionIncrease] = useState(() => shareParams?.contributionIncrease ?? 0);
  const [lumpSums, setLumpSums] = useState(() => shareParams?.lumpSums ?? []); // one-off future contributions: [{ id, year, amount }]
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  // Progressive tax brackets -- only meaningful for the handful of countries with
  // taxBrackets data (see data/countries.js). Opt-in: off by default, the flat
  // country.taxRate keeps being used everywhere else regardless of this toggle.
  const [progressiveTax, setProgressiveTax] = useState(false);
  const [otherTaxableIncome, setOtherTaxableIncome] = useState(0);
  const [waitYears, setWaitYears] = useState(5); // "cost of waiting" on the Calculator (Basic tier)
  const [bumpAmount, setBumpAmount] = useState(500); // "what one bump does" on the Calculator (Basic tier)
  const [targetAmount, setTargetAmount] = useState(0); // "reach this by the target year" goal-seek (Basic tier)
  const hasTaxBrackets = !!country.taxBrackets;
  const effectiveTaxBrackets = (progressiveTax && hasTaxBrackets) ? country.taxBrackets : null;

  // Clean the (potentially long) share query string out of the address bar once it's
  // done its job -- doesn't navigate or reload, just tidies the visible URL.
  useEffect(() => {
    if (shareParams) clearShareParamsFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareCurrentPlan = async () => {
    const url = buildShareUrl({ country: country.code, initial, monthly, rate, years, inflation, wrapper, compoundFrequency, contributionIncrease, lumpSums });
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link:', url); // clipboard API unavailable (e.g. insecure context) -- fall back to a manual copy
      return;
    }
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2000);
  };

  const handleCountryChange = (code) => {
    const c = getCountryByCode(code);
    setCountry(c);
    // Prefill inflation with this country's typical rate -- a convenience default the
    // user can still overwrite, not a substitute for the blank-until-entered calculator
    // inputs above (those come from the user, this is a starting point tied to the country).
    setInflation(c.typicalInflation ?? 0);
  };

  // Single clamp for every path that can set `years`. The Calculator input below and the
  // AI Coach's "Set timeframe to N years" button both route through setYearsClamped, so
  // neither can push `years` past MAX_YEARS -- an unbounded value freezes every per-year
  // loop and Monte Carlo (see MAX_YEARS above). Number(...) || 1 keeps a cleared field at 1.
  const clampYears = (value) => Math.min(MAX_YEARS, Math.max(1, Math.round(Number(value) || 1)));
  const setYearsClamped = (value) => setYears(clampYears(value));

  const addLumpSum = () => setLumpSums(prev => [...prev, { id: uniqueId(), year: 1, amount: 0 }]);
  const updateLumpSum = (id, field, value) => setLumpSums(prev => prev.map(l => l.id === id ? { ...l, [field]: Number(value) } : l));
  const removeLumpSum = (id) => setLumpSums(prev => prev.filter(l => l.id !== id));

  // AI Advisor profile state -- no assumed persona; blank until the user fills it in.
  const [profile, setProfile] = useState({ age: 18, income: 0, savings: 0, riskTolerance: 'moderate' });

  // Calculator scenario comparison -- saved snapshots of the inputs/results above, side by side.
  const [scenarios, setScenarios] = useState([]);
  const MAX_SCENARIOS = 3;

  const saveScenario = () => {
    if (scenarios.length >= MAX_SCENARIOS) return;
    setScenarios(prev => [...prev, {
      id: uniqueId(),
      label: `Scenario ${prev.length + 1}`,
      countryName: country.name,
      symbol: country.symbol,
      initial, monthly, rate, years, wrapper,
      finalBalance: results.finalBalance,
      totalInterest: results.totalInterest
    }]);
  };

  const removeScenario = (id) => setScenarios(prev => prev.filter(s => s.id !== id));
  const renameScenario = (id, label) => setScenarios(prev => prev.map(s => s.id === id ? { ...s, label } : s));

  const exportScenariosCSV = () => {
    downloadCSV('wts-compoundiq-scenarios.csv', [
      ['Label', 'Country', 'Initial', 'Monthly', 'Rate %', 'Years', 'Wrapper', 'Final Balance', 'Total Interest'],
      ...scenarios.map(s => [s.label, s.countryName, s.initial, s.monthly, s.rate, s.years, s.wrapper ? 'Yes' : 'No', s.finalBalance, s.totalInterest])
    ]);
  };

  // Load tier on mount. Precedence:
  //   1. A returning Paystack checkout (?reference=) -> verify server-side, store the
  //      signed entitlement, unlock its tier.
  //   2. An existing signed entitlement in localStorage -> unlock its tier now, then
  //      revalidate it against Paystack in the background and downgrade if it lapsed.
  //   3. The legacy plain `wts_compoundiq_tier` string -> demo-mode / manually-set tier,
  //      unchanged behaviour for when live payments aren't configured.
  useEffect(() => {
    let cancelled = false;

    const savedTier = (() => { try { return localStorage.getItem('wts_compoundiq_tier'); } catch { return null; } })();
    const ent = readEntitlement();
    if (ent) setUserTier(ent.tier);
    else if (savedTier) setUserTier(savedTier);

    (async () => {
      const granted = await consumePaystackRedirect();
      if (cancelled) return;
      if (granted && granted.tier) {
        setTier(granted.tier);
        return;
      }
      if (ent) {
        const outcome = await refreshEntitlement();
        if (cancelled) return;
        if (['lapsed', 'invalid', 'unconfigured'].includes(outcome)) {
          clearEntitlement();
          // Only force a downgrade if the entitlement was what was unlocking the tier;
          // don't stomp a legacy/demo tier the user set another way.
          if (!savedTier || savedTier === ent.tier) {
            setUserTier('Basic');
            try { localStorage.removeItem('wts_compoundiq_tier'); } catch { /* ignore */ }
          }
        } else {
          const fresh = readEntitlement();
          if (fresh) setUserTier(fresh.tier);
        }
      }
    })();

    return () => { cancelled = true; };
    // setTier is stable (defined in component body, no deps captured that change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss the tier-change confirmation banner.
  useEffect(() => {
    if (!tierChangeMsg) return;
    const id = setTimeout(() => setTierChangeMsg(null), 4500);
    return () => clearTimeout(id);
  }, [tierChangeMsg]);

  const handleUpgradeClick = (targetTier, targetTab = null) => {
    if (userTier === targetTier || targetTier === 'Basic') return;
    setSelectedUpgradeTier(targetTier);
    setSelectedBillingPeriod('monthly'); // this entry point (a locked-tab click) has no billing toggle
    setPendingTab(targetTab);
    setShowPayment(true);
  };

  const setTier = (tier) => {
    setUserTier(tier);
    try { localStorage.setItem('wts_compoundiq_tier', tier); } catch { /* private mode / quota */ }
    setTierChangeMsg(tier === 'Basic' ? "You're now on the free Basic plan." : `You're now on ${tier} — premium features unlocked.`);
  };

  const processSuccessfulPayment = (tier) => {
    setTier(tier);
    setShowPayment(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  // Basic is free -- downgrading to it skips the (fake) payment flow entirely. The
  // "are you sure" step now lives in the pricing modal's Basic card (a two-tap confirm),
  // so this just applies it -- no window.confirm(), which a browser can silently refuse.
  const downgradeToBasic = () => {
    if (userTier === 'Basic') return;
    setTier('Basic');
    setShowPricing(false);
  };

  const verification = getVerificationInfo(country.code);

  const results = calculateCompoundInterest({
    initial,
    monthly,
    rate,
    years,
    inflation,
    taxRate: country.taxRate,
    wrapper,
    compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit,
    lifetimeWrapperLimit: country.lifetimeWrapperLimit,
    contributionIncreaseRate: contributionIncrease,
    lumpSums,
    taxBrackets: effectiveTaxBrackets,
    otherTaxableIncome
  });

  // Rate-sensitivity band under the headline number: the same plan run a couple of
  // points either side of the entered return, so the projection reads as a range rather
  // than a single confident figure. A free-tier nudge, like "cost of waiting" below.
  const RATE_BAND = 2;
  const rateBandParams = {
    initial, monthly, years, inflation, taxRate: country.taxRate, wrapper, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit,
    contributionIncreaseRate: contributionIncrease, lumpSums,
    taxBrackets: effectiveTaxBrackets, otherTaxableIncome
  };
  const rateBandLow = calculateCompoundInterest({ ...rateBandParams, rate: rate - RATE_BAND }).finalBalance;
  const rateBandHigh = calculateCompoundInterest({ ...rateBandParams, rate: rate + RATE_BAND }).finalBalance;

  // "You cross R1,000,000 in year 18" -- pace for the headline figure, from the same
  // projection. A free-tier touch like the rate band and cost-of-waiting.
  const balanceMilestones = projectionMilestones(results.yearlyData, country.code, 4);

  // "Adding R500/month gets you R X more" -- the encouraging mirror of cost-of-waiting.
  const effBump = Math.max(0, Math.round(bumpAmount || 0));
  const bumpedFinal = effBump > 0
    ? calculateCompoundInterest({ ...rateBandParams, rate, monthly: monthly + effBump }).finalBalance
    : results.finalBalance;
  const bumpGain = bumpedFinal - results.finalBalance;

  // "To have R X by year N, save about R Y/month" -- the inverse question, solved with
  // the same engine every goal calculator in the app uses. Only when the user has typed
  // a target above what the starting amount alone would already reach.
  const showTargetSolve = targetAmount > 0 && years >= 1 && targetAmount > (results.yearlyData[0]?.balance ?? initial);
  const targetMonthly = showTargetSolve
    ? solveMonthlyForGoal({
        startingAmount: initial, rate, years, inflation, taxRate: country.taxRate, wrapper,
        goalAmount: targetAmount, compoundFrequency,
        annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit,
        contributionIncreaseRate: contributionIncrease
      })
    : null;

  // "Cost of waiting" -- same plan against the same target date, started `waitYears`
  // later (fewer compounding years). A free-tier nudge shown under the result.
  // effWait is the delay actually applied: rounded to a whole year and clamped to
  // [1, years-1] so the spelled-out number in the sentence (and the input's own value)
  // always matches what the math used -- costOfWaiting rounds delayYears internally, so
  // a fractional 2.5 here would otherwise show "2.5" in the box while the math used 3 --
  // even if `years` shrank under a stale `waitYears` or the field was cleared/negatived.
  const effWait = Math.max(1, Math.min(Math.max(1, years - 1), Math.round(waitYears || 1)));
  const waitingCost = costOfWaiting({
    initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit,
    contributionIncreaseRate: contributionIncrease, lumpSums,
    taxBrackets: effectiveTaxBrackets, otherTaxableIncome, delayYears: effWait
  });

  // `name` is the stable internal tab id -- used for activeTab routing, canAccess
  // checks, and every onNavigate('Exact Name') call from StartHere/Dashboard/etc.
  // Never translate `name` itself; `i18nKey` is what gets displayed (falls back to
  // English automatically via t() if a language's translation is missing).
  // Memoized on `t` (which itself only changes when the active language changes) --
  // App re-renders on every Calculator keystroke, and rebuilding this whole array plus
  // re-running ~17 t() lookups had nothing to do with any of that unrelated state.
  const tabGroups = useMemo(() => [
    {
      label: t('nav.groupFree'),
      tabs: [
        { name: 'Start Here', i18nKey: 'nav.startHere', tier: 'Basic' },
        { name: 'Calculator', i18nKey: 'nav.calculator', tier: 'Basic' }
      ]
    },
    {
      label: t('nav.groupPlanning'),
      tabs: [
        { name: 'Dashboard', i18nKey: 'nav.dashboard', tier: 'Pro' },
        { name: 'Budget', i18nKey: 'nav.budget', tier: 'Pro' },
        { name: 'Emergency Fund', i18nKey: 'nav.emergencyFund', tier: 'Pro' },
        { name: 'Debt Payoff', i18nKey: 'nav.debtPayoff', tier: 'Pro' },
        { name: 'Loan & Bond', i18nKey: 'nav.loanBond', tier: 'Pro' },
        { name: 'My Plan', i18nKey: 'nav.myPlan', tier: 'Pro' },
        { name: 'Net Worth', i18nKey: 'nav.netWorth', tier: 'Pro' },
        { name: 'Snapshot', i18nKey: 'nav.snapshot', tier: 'Pro' },
        { name: 'Invest', i18nKey: 'nav.invest', tier: 'Pro' },
        { name: 'Tax Optimizer', i18nKey: 'nav.taxOptimizer', tier: 'Pro' },
        { name: 'Power Tools', i18nKey: 'nav.powerTools', tier: 'Pro' },
        { name: 'Compare', i18nKey: 'nav.compare', tier: 'Pro' }
      ]
    },
    {
      label: t('nav.groupAI'),
      tabs: [
        { name: 'Coach', i18nKey: 'nav.coach', tier: 'Ultra' },
        { name: 'Monte Carlo', i18nKey: 'nav.monteCarlo', tier: 'Ultra' },
        { name: 'AI Advisor', i18nKey: 'nav.aiAdvisor', tier: 'Ultra' }
      ]
    }
  ], [t]);

  const tabs = tabGroups.flatMap(g => g.tabs);

  const tierLevels = { 'Basic': 0, 'Pro': 1, 'Ultra': 2, 'Enterprise': 3 };
  const userLevel = tierLevels[userTier] || 0;

  const canAccess = (requiredTier) => {
    return (tierLevels[requiredTier] || 0) <= userLevel;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <div className="logo-badge">
            <img src={wtsLogo} alt="WTS logo" className="logo-img" />
          </div>
          <div className="brand-text">
            <h1>WTS CompoundIQ</h1>
            <p>{t('header.tagline')}</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="tier-badge">
            {t('header.currentPlan')} <strong style={{ color: userTier === 'Basic' ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>{userTier}</strong>
          </div>
          <LanguageSwitcher />
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn-upgrade" onClick={() => setShowPricing(true)}>
            {t('header.upgradePlan')}
          </button>
        </div>
      </header>

      {tierChangeMsg && (
        <div className="tier-change-banner" role="status">
          ✓ {tierChangeMsg}
          <button className="tier-change-banner-close" onClick={() => setTierChangeMsg(null)} aria-label="Dismiss">&times;</button>
        </div>
      )}

      <nav className="tabs-nav">
        {tabGroups.map((group, groupIdx) => (
          <div className="tab-group" key={group.label}>
            {groupIdx > 0 && <span className="tab-group-divider" aria-hidden="true" />}
            <span className="tab-group-label">{group.label}</span>
            <div className="tab-group-buttons">
              {group.tabs.map((tab) => {
                const locked = !canAccess(tab.tier);
                return (
                  <button
                    key={tab.name}
                    className={`tab-btn ${activeTab === tab.name ? 'active' : ''} ${locked ? 'locked' : ''}`}
                    aria-current={activeTab === tab.name ? 'page' : undefined}
                    title={locked ? `Requires ${tab.tier} or higher` : undefined}
                    onClick={() => {
                      if (!locked) {
                        setActiveTab(tab.name);
                      } else {
                        handleUpgradeClick(tab.tier, tab.name);
                      }
                    }}
                  >
                    {t(tab.i18nKey)}
                    {locked && <span className="lock-icon">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <main className="main-content">
        {activeTab === 'Calculator' && (
          <div className="tab-pane active">
            <div className="card">
              <h2>{t('calculator.title')}</h2>
              <p className="card-subtitle">{t('calculator.subtitle')}</p>

              <div className="form-grid">
                <div className="form-group">
                  <label>{t('calculator.country')}</label>
                  <CountrySelect countries={WTS_COUNTRIES} value={country.code} onChange={handleCountryChange} ariaLabel={t('calculator.country')} />
                </div>
                <div className="form-group">
                  <label>{t('calculator.initialAmount')} ({country.symbol})</label>
                  <input type="number" value={initial} onChange={(e) => setInitial(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>{t('calculator.monthlyContribution')} ({country.symbol})</label>
                  <input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>{t('calculator.annualRate')}</label>
                  <input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>{t('calculator.yearsToGrow')} (max {MAX_YEARS})</label>
                  <input type="number" min="1" max={MAX_YEARS} value={years} onChange={(e) => setYearsClamped(e.target.value)} />
                </div>
                <div className="form-group">
                  <label><Term k="inflation">{t('calculator.inflation')}</Term> (%/yr)</label>
                  <input type="number" step="0.1" value={inflation} onChange={(e) => setInflation(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label><Term k="compoundingFrequency">{t('calculator.compoundingFrequency')}</Term></label>
                  <select value={compoundFrequency} onChange={(e) => setCompoundFrequency(Number(e.target.value))}>
                    <option value="1">{t('calculator.annually')}</option>
                    <option value="2">{t('calculator.semiAnnually')}</option>
                    <option value="4">{t('calculator.quarterly')}</option>
                    <option value="12">{t('calculator.monthly')}</option>
                    <option value="365">{t('calculator.daily')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><Term k="contributionIncrease">{t('calculator.annualContributionIncrease')}</Term> (%/yr)</label>
                  <input type="number" min="0" step="0.5" value={contributionIncrease} onChange={(e) => setContributionIncrease(Number(e.target.value))} />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" checked={wrapper} onChange={(e) => setWrapper(e.target.checked)} />
                    <Term k="wrapper">{t('calculator.useWrapper')}</Term> ({country.wrapperLabel})
                  </label>
                </div>
              </div>

              {hasTaxBrackets && (
                <div className="bracket-section">
                  <label className="bracket-toggle">
                    <input type="checkbox" checked={progressiveTax} onChange={(e) => setProgressiveTax(e.target.checked)} />
                    Use progressive tax brackets instead of the flat {country.taxRate}% estimate
                  </label>
                  {progressiveTax && (
                    <div className="bracket-form">
                      <div className="form-group">
                        <label>Other Taxable Income ({country.symbol}/yr, excluding this plan's gains)</label>
                        <input type="number" min="0" step="1000" value={otherTaxableIncome} onChange={(e) => setOtherTaxableIncome(Number(e.target.value))} />
                      </div>
                      <p className="bracket-note">
                        Each year's investment gain is taxed at your marginal rate on top of this income, using{' '}
                        {country.name}'s approximate brackets. {country.taxBracketsNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="lumpsum-section">
                <div className="lumpsum-header">
                  <h3>{t('calculator.oneOffContributions')}</h3>
                  <button className="lumpsum-add-btn" onClick={addLumpSum}>{t('calculator.addOneOff')}</button>
                </div>
                {lumpSums.length === 0 ? (
                  <p className="lumpsum-empty">None added -- use this for a bonus, inheritance, tax refund, or any extra deposit landing in a specific year, on top of your regular monthly contribution above.</p>
                ) : (
                  <div className="lumpsum-list">
                    {lumpSums.map((l) => (
                      <div key={l.id} className="lumpsum-row">
                        <div className="lumpsum-field">
                          <label>In year</label>
                          <input type="number" min="1" max={years} value={l.year} onChange={(e) => updateLumpSum(l.id, 'year', e.target.value)} />
                        </div>
                        <div className="lumpsum-field">
                          <label>Amount ({country.symbol})</label>
                          <input type="number" min="0" step="1000" value={l.amount} onChange={(e) => updateLumpSum(l.id, 'amount', e.target.value)} />
                        </div>
                        <button className="lumpsum-remove" onClick={() => removeLumpSum(l.id)} aria-label="Remove one-off contribution">&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <span className={`tax-verification ${verification.stale ? 'stale' : ''}`}>
                {verification.date
                  ? `${verification.stale ? '⚠️ ' : '✓ '}${country.name}'s tax rate & wrapper data last verified ${verification.date} (${verification.daysAgo} day${verification.daysAgo === 1 ? '' : 's'} ago)${verification.stale ? ' -- overdue for a recheck' : ''}`
                  : '⚠️ Verification date unknown for this country'}
              </span>

              {wrapper && results.wrapperCapExceeded && (
                <span className="tax-verification stale">
                  ⚠️ Your contributions exceed {country.wrapperLabel}'s limit
                  {country.annualWrapperLimit != null ? ` (${country.symbol}${country.annualWrapperLimit.toLocaleString()}/year` : ''}
                  {country.annualWrapperLimit != null && country.lifetimeWrapperLimit != null ? ', ' : ''}
                  {country.lifetimeWrapperLimit != null ? `${country.symbol}${country.lifetimeWrapperLimit.toLocaleString()} lifetime` : ''}
                  {(country.annualWrapperLimit != null || country.lifetimeWrapperLimit != null) ? ') -- ' : ' -- '}
                  the portion over the limit is taxed like a normal account, not sheltered.
                </span>
              )}

              <div className="results-summary">
                <div className="result-item">
                  <span>{t('calculator.projectedBalance')}</span>
                  <strong style={{ color: 'var(--accent-green)' }}>{country.symbol} {results.finalBalance.toLocaleString()}</strong>
                </div>
                <div className="result-item">
                  <span>{t('calculator.totalDeposits')}</span>
                  <strong>{country.symbol} {results.totalDeposited.toLocaleString()}</strong>
                </div>
                <div className="result-item">
                  <span>{t('calculator.compoundInterestEarned')}</span>
                  <strong style={{ color: 'var(--accent-green)' }}>{country.symbol} {results.totalInterest.toLocaleString()}</strong>
                </div>
                <div className="result-item">
                  <span><Term k="realValue">{t('calculator.realValue')}</Term> {t('calculator.todaysMoney')}</span>
                  <strong style={{ color: 'var(--mut)' }}>{country.symbol} {(results.yearlyData[results.yearlyData.length - 1]?.realValue ?? 0).toLocaleString()}</strong>
                </div>
              </div>

              <div className="target-seek">
                <label htmlFor="target-amount">Aim for a number</label>
                <div className="target-seek-body">
                  <span>
                    To have {country.symbol}{' '}
                    <input
                      id="target-amount"
                      type="number"
                      min="0"
                      step="100000"
                      placeholder="target"
                      value={targetAmount || ''}
                      onChange={(e) => setTargetAmount(Number(e.target.value))}
                    />{' '}
                    in {years} year{years === 1 ? '' : 's'}
                    {targetMonthly != null ? (
                      <>
                        , you'd save about <strong>{country.symbol} {Math.round(targetMonthly).toLocaleString()}/month</strong>
                        {monthly > 0 && (
                          Math.abs(targetMonthly - monthly) < 1
                            ? ' — right on your current plan.'
                            : targetMonthly > monthly
                              ? ` — ${country.symbol}${Math.round(targetMonthly - monthly).toLocaleString()} more than your current ${country.symbol}${monthly.toLocaleString()}/month.`
                              : ` — ${country.symbol}${Math.round(monthly - targetMonthly).toLocaleString()} less than your current ${country.symbol}${monthly.toLocaleString()}/month; you're ahead of this goal.`
                        )}
                        {monthly === 0 && '.'}
                      </>
                    ) : (
                      targetAmount > 0 ? ' — already covered by your starting amount alone.' : '.'
                    )}
                  </span>
                </div>
              </div>

              {years >= 1 && (initial > 0 || monthly > 0) && Number.isFinite(rateBandLow) && Number.isFinite(rateBandHigh) && (
                <div className="rate-band">
                  <span className="rate-band-label">If the return runs ±{RATE_BAND}%/yr of your {rate}% estimate</span>
                  <div className="rate-band-cells">
                    <div>
                      <span>{(rate - RATE_BAND).toFixed(1)}%/yr</span>
                      <strong>{country.symbol} {Math.round(rateBandLow).toLocaleString()}</strong>
                    </div>
                    <div className="rate-band-mid">
                      <span>{Number(rate).toFixed(1)}%/yr</span>
                      <strong>{country.symbol} {results.finalBalance.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span>{(rate + RATE_BAND).toFixed(1)}%/yr</span>
                      <strong>{country.symbol} {Math.round(rateBandHigh).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              )}

              {balanceMilestones.length > 0 && (
                <div className="milestone-strip">
                  <span className="milestone-strip-label">On track to reach</span>
                  <div className="milestone-strip-items">
                    {balanceMilestones.map((m) => (
                      <span className="milestone-chip" key={m.thresholdZar}>
                        <strong>{country.symbol}{Math.round(m.amount).toLocaleString()}</strong> in year {m.year}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {results.finalBalance > 0 && results.totalDeposited > 0 && (() => {
                const growth = Math.max(0, results.finalBalance - results.totalDeposited);
                const denom = results.totalDeposited + growth;
                const depPct = denom > 0 ? (results.totalDeposited / denom) * 100 : 100;
                return (
                  <div className="split-bar">
                    <span className="split-bar-label">What builds the final balance</span>
                    <div className="split-bar-track" role="img"
                      aria-label={`Your deposits ${depPct.toFixed(0)} percent, compound growth ${(100 - depPct).toFixed(0)} percent`}>
                      <div className="split-bar-deposits" style={{ width: `${depPct}%` }} />
                      <div className="split-bar-growth" style={{ width: `${100 - depPct}%` }} />
                    </div>
                    <div className="split-bar-legend">
                      <span><i className="dot dep" /> Your deposits — {country.symbol}{results.totalDeposited.toLocaleString()} ({depPct.toFixed(0)}%)</span>
                      <span><i className="dot grow" /> Compound growth — {country.symbol}{Math.round(growth).toLocaleString()} ({(100 - depPct).toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })()}

              {years > 1 && effBump > 0 && Number.isFinite(bumpGain) && bumpGain > 0 && (
                <div className="bump-nudge">
                  <label htmlFor="bump-amount">One small bump</label>
                  <div className="bump-nudge-body">
                    <span>
                      Adding{' '}
                      <input
                        id="bump-amount"
                        type="number"
                        min="0"
                        step="100"
                        value={effBump}
                        onChange={(e) => setBumpAmount(Number(e.target.value))}
                      />{' '}
                      {country.symbol}/month more would leave you with about{' '}
                      <strong>{country.symbol} {Math.round(bumpGain).toLocaleString()}</strong> extra at the end
                      ({country.symbol} {Math.round(bumpedFinal).toLocaleString()} vs {country.symbol} {results.finalBalance.toLocaleString()}) — for {country.symbol}{(effBump * 12 * years).toLocaleString()} more paid in over {years} years.
                    </span>
                  </div>
                </div>
              )}

              {monthly > 0 && years > 1 && Number.isFinite(waitingCost.cost) && (
                <div className="cost-of-waiting">
                  <label htmlFor="wait-years">Cost of waiting</label>
                  <div className="cost-of-waiting-body">
                    <span>
                      Starting{' '}
                      <input
                        id="wait-years"
                        type="number"
                        min="1"
                        max={Math.max(1, years - 1)}
                        value={effWait}
                        onChange={(e) => setWaitYears(Number(e.target.value))}
                      />{' '}
                      year{waitingCost.delayYears === 1 ? '' : 's'} later would leave you with about{' '}
                      <strong>{country.symbol} {Math.round(waitingCost.cost).toLocaleString()}</strong> less at the end
                      ({country.symbol} {Math.round(waitingCost.startLaterBalance).toLocaleString()} vs {country.symbol} {Math.round(waitingCost.startNowBalance).toLocaleString()}) — the same {country.symbol}{monthly.toLocaleString()}/month, just fewer years to compound.
                    </span>
                  </div>
                </div>
              )}

              <GrowthChart yearlyData={results.yearlyData} initial={initial} symbol={country.symbol} />

              <button className="share-plan-btn" onClick={shareCurrentPlan}>
                {shareLinkCopied ? t('calculator.linkCopied') : t('calculator.sharePlan')}
              </button>
              <p className="share-plan-note">Copies a link that opens with these exact inputs -- nothing is uploaded, the whole plan lives in the URL itself.</p>

              <div className="scenario-section">
                <div className="scenario-header">
                  <h3>{t('calculator.scenarioComparison')}</h3>
                  <div className="scenario-header-actions">
                    {scenarios.length > 0 && (
                      <button className="scenario-export-btn" onClick={exportScenariosCSV}>⬇️ Export CSV</button>
                    )}
                    <button
                      className="scenario-save-btn"
                      onClick={saveScenario}
                      disabled={scenarios.length >= MAX_SCENARIOS}
                    >
                      {scenarios.length >= MAX_SCENARIOS ? `Max ${MAX_SCENARIOS} scenarios` : t('calculator.saveScenario')}
                    </button>
                  </div>
                </div>

                {scenarios.length === 0 ? (
                  <p className="scenario-empty">Change the inputs above and save a scenario to compare -- e.g. "current plan" vs. "with extra R500/mo" vs. "different country."</p>
                ) : (
                  <div className="scenario-grid">
                    {scenarios.map((s) => (
                      <div key={s.id} className="scenario-card">
                        <div className="scenario-card-header">
                          <input
                            type="text"
                            className="scenario-label"
                            value={s.label}
                            onChange={(e) => renameScenario(s.id, e.target.value)}
                          />
                          <button className="scenario-remove" onClick={() => removeScenario(s.id)} aria-label="Remove scenario">&times;</button>
                        </div>
                        <span className="scenario-meta">{s.countryName} · {s.symbol}{s.initial.toLocaleString()} + {s.symbol}{s.monthly.toLocaleString()}/mo · {s.rate}% · {s.years}yr{s.wrapper ? ' · wrapper' : ''}</span>
                        <div className="scenario-values">
                          <div><span>Balance</span><strong>{s.symbol} {s.finalBalance.toLocaleString()}</strong></div>
                          <div><span>Interest</span><strong className="positive">{s.symbol} {s.totalInterest.toLocaleString()}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('calculator.tableYear')}</th>
                      <th>{t('calculator.tableBalance')}</th>
                      <th>{t('calculator.tableRealValue')}</th>
                      <th>{t('calculator.tableDeposits')}</th>
                      <th>{t('calculator.tableInterest')}</th>
                      <th>{t('calculator.tableTaxPaid')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.yearlyData.map((row) => (
                      <tr key={row.year}>
                        <td>{row.year}</td>
                        <td style={{ color: 'var(--heading)', fontWeight: '600' }}>{country.symbol} {row.balance.toLocaleString()}</td>
                        <td style={{ color: 'var(--mut)' }}>{country.symbol} {row.realValue.toLocaleString()}</td>
                        <td>{country.symbol} {row.deposited.toLocaleString()}</td>
                        <td style={{ color: 'var(--accent-green)' }}>{country.symbol} {row.interest.toLocaleString()}</td>
                        <td style={{ color: 'var(--accent-yellow)' }}>{row.sheltered ? '-' : country.symbol} {row.taxPaid.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'Calculator' && !canAccess(tabs.find(t => t.name === activeTab)?.tier) && (
          <div className="tab-pane locked">
            <div className="lock-card">
              <div className="lock-icon-large">🔒</div>
              <h3>Premium Feature Locked</h3>
              <p>The <strong>{activeTab}</strong> tool requires a <strong>{tabs.find(t => t.name === activeTab)?.tier}</strong> or higher subscription.</p>
              <button className="btn-upgrade-lock" onClick={() => setShowPricing(true)}>
                View Pricing Plans & Upgrade
              </button>
            </div>
          </div>
        )}

        {activeTab === 'AI Advisor' && canAccess('Ultra') && (
          <div className="tab-pane active">
            <AIAdvisor country={country} profile={profile} onProfileUpdate={setProfile} />
          </div>
        )}

        {activeTab === 'Start Here' && (
          <div className="tab-pane active">
            <StartHere onNavigate={setActiveTab} />
          </div>
        )}

        {activeTab === 'Dashboard' && canAccess('Pro') && (
          <div className="tab-pane active">
            <Dashboard country={country} reportingCountry={reportingCountry} onNavigate={setActiveTab} />
          </div>
        )}

        {activeTab === 'Budget' && canAccess('Pro') && (
          <div className="tab-pane active">
            <Budget country={country} />
          </div>
        )}

        {activeTab === 'Emergency Fund' && canAccess('Pro') && (
          <div className="tab-pane active">
            <EmergencyFund country={country} />
          </div>
        )}

        {activeTab === 'Debt Payoff' && canAccess('Pro') && (
          <div className="tab-pane active">
            <DebtPayoff country={country} />
          </div>
        )}

        {activeTab === 'Loan & Bond' && canAccess('Pro') && (
          <div className="tab-pane active">
            <LoanCalculator country={country} />
          </div>
        )}

        {activeTab === 'My Plan' && canAccess('Pro') && (
          <div className="tab-pane active">
            <MyPlan country={country} canAdviserNotes={canAccess('Enterprise')} onOpenPricing={() => setShowPricing(true)} />
          </div>
        )}

        {activeTab === 'Net Worth' && canAccess('Pro') && (
          <div className="tab-pane active">
            <NetWorth
              country={reportingCountry}
              scenarioCountry={country}
              reportingCurrencyCode={reportingCurrencyCode}
              onReportingCurrencyChange={setReportingCurrencyCode}
              canFxStressTest={canAccess('Ultra')}
              onOpenPricing={() => setShowPricing(true)}
            />
          </div>
        )}

        {activeTab === 'Snapshot' && canAccess('Pro') && (
          <div className="tab-pane active">
            <Snapshot country={country} initial={initial} monthly={monthly} rate={rate} years={years} inflation={inflation} wrapper={wrapper} compoundFrequency={compoundFrequency} contributionIncrease={contributionIncrease} lumpSums={lumpSums} userTier={userTier} onOpenPricing={() => setShowPricing(true)} />
          </div>
        )}

        {activeTab === 'Tax Optimizer' && canAccess('Pro') && (
          <div className="tab-pane active">
            <TaxOptimizer country={country} initial={initial} monthly={monthly} rate={rate} years={years} inflation={inflation} compoundFrequency={compoundFrequency} contributionIncrease={contributionIncrease} lumpSums={lumpSums} taxBrackets={effectiveTaxBrackets} otherTaxableIncome={otherTaxableIncome} />
          </div>
        )}

        {activeTab === 'Invest' && canAccess('Pro') && (
          <div className="tab-pane active">
            <Invest country={country} initial={initial} monthly={monthly} rate={rate} inflation={inflation} wrapper={wrapper} compoundFrequency={compoundFrequency} contributionIncrease={contributionIncrease} />
          </div>
        )}

        {activeTab === 'Coach' && canAccess('Ultra') && (
          <div className="tab-pane active">
            <Coach country={country} initial={initial} monthly={monthly} rate={rate} years={years} inflation={inflation} wrapper={wrapper} compoundFrequency={compoundFrequency} contributionIncrease={contributionIncrease} lumpSums={lumpSums} maxYears={MAX_YEARS} onSetWrapper={setWrapper} onSetMonthly={setMonthly} onSetYears={setYearsClamped} />
          </div>
        )}

        {activeTab === 'Power Tools' && canAccess('Pro') && (
          <div className="tab-pane active">
            <PowerTools country={country} initial={initial} monthly={monthly} rate={rate} years={years} inflation={inflation} wrapper={wrapper} compoundFrequency={compoundFrequency} contributionIncrease={contributionIncrease} lumpSums={lumpSums} canUltra={canAccess('Ultra')} onOpenPricing={() => setShowPricing(true)} />
          </div>
        )}

        {activeTab === 'Compare' && canAccess('Pro') && (
          <div className="tab-pane active">
            <Compare country={country} initial={initial} monthly={monthly} rate={rate} years={years} inflation={inflation} wrapper={wrapper} compoundFrequency={compoundFrequency} contributionIncrease={contributionIncrease} lumpSums={lumpSums} />
          </div>
        )}

        {activeTab === 'Monte Carlo' && canAccess('Ultra') && (
          <div className="tab-pane active">
            <MonteCarlo country={country} initial={initial} monthly={monthly} rate={rate} years={years} compoundFrequency={compoundFrequency} contributionIncrease={contributionIncrease} lumpSums={lumpSums} />
          </div>
        )}
      </main>

      {showPricing && (
        <TierPricing
          currentTier={userTier}
          onUpgrade={(tier, period = 'monthly') => {
            if (tier === userTier) return;
            if (tier === 'Basic') { downgradeToBasic(); return; }
            // Enterprise is a custom, per-seat quote -- there's no self-serve price, so
            // routing it through the (fake) checkout for a "Custom" amount is nonsense.
            // Unlock the features for preview and say plainly that a real licence goes
            // through sales.
            if (tier === 'Enterprise') {
              setUserTier('Enterprise');
              try { localStorage.setItem('wts_compoundiq_tier', 'Enterprise'); } catch { /* private mode / quota */ }
              setTierChangeMsg('Enterprise features unlocked for preview — a live Enterprise licence is a custom, per-seat quote arranged with sales.');
              setShowPricing(false);
              return;
            }
            setSelectedUpgradeTier(tier);
            setSelectedBillingPeriod(period);
            // This path isn't tied to any specific locked tab, so don't let a stale
            // pendingTab from an earlier abandoned locked-tab click hijack navigation
            // once this payment succeeds.
            setPendingTab(null);
            setShowPayment(true);
            setShowPricing(false);
          }}
          onClose={() => setShowPricing(false)}
        />
      )}

      {showPayment && selectedUpgradeTier && (
        <PaymentSection
          tier={selectedUpgradeTier}
          price={UPGRADE_PRICES[selectedUpgradeTier]?.[selectedBillingPeriod] ?? UPGRADE_PRICES[selectedUpgradeTier]?.monthly ?? 'Custom'}
          period={selectedBillingPeriod}
          country={country}
          onSuccess={processSuccessfulPayment}
          onClose={() => { setShowPayment(false); setPendingTab(null); }}
        />
      )}

      <footer className="app-footer">
        <p>
          WTS CompoundIQ · {t('footer.tagline')}
          {' '}· <button className="footer-link-btn" onClick={() => setShowLegal(true)}>{t('footer.privacyTerms')}</button>
          {' '}· <button className="footer-link-btn" onClick={() => setShowTour(true)}>🧭 Take the Tour</button>
        </p>
        {/* Restates the tagline's "not financial advice" in its own full sentence, with
            the explicit call to seek a professional -- deliberately its own line (not
            folded into the dense pipe-separated tagline above) so it reads as a real
            disclaimer rather than dense microcopy easy to skim past. */}
        <p className="app-footer-disclaimer">⚠️ {t('footer.disclaimer')}</p>
        <DataBackup />
      </footer>

      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      {showTour && <OnboardingTour onClose={closeTour} />}
    </div>
  );
}