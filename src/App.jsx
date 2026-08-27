// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import TierPricing from './components/TierPricing';
import PaymentSection from './components/PaymentSection';
import { calculateCompoundInterest } from './engine';
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
import EmergencyFund from './components/EmergencyFund';
import MyPlan from './components/MyPlan';
import Snapshot from './components/Snapshot';
import NetWorth from './components/NetWorth';
import DataBackup from './components/DataBackup';

export default function App() {
  const [activeTab, setActiveTab] = useState('Start Here');
  const [userTier, setUserTier] = useState('Basic');
  const [showPricing, setShowPricing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState(null);
  const [pendingTab, setPendingTab] = useState(null);

  // Calculator state -- starts blank; every number here should come from the user, not a placeholder scenario.
  const [country, setCountry] = useState(WTS_COUNTRIES[0]);
  const [initial, setInitial] = useState(0);
  const [monthly, setMonthly] = useState(0);
  const [rate, setRate] = useState(0);
  const [years, setYears] = useState(1);
  const [inflation, setInflation] = useState(0);
  const [wrapper, setWrapper] = useState(false);
  const [compoundFrequency, setCompoundFrequency] = useState(12);

  // AI Advisor profile state -- no assumed persona; blank until the user fills it in.
  const [profile, setProfile] = useState({ age: 18, income: 0, savings: 0, riskTolerance: 'moderate' });

  // Calculator scenario comparison -- saved snapshots of the inputs/results above, side by side.
  const [scenarios, setScenarios] = useState([]);
  const MAX_SCENARIOS = 3;

  const saveScenario = () => {
    if (scenarios.length >= MAX_SCENARIOS) return;
    setScenarios(prev => [...prev, {
      id: Date.now(),
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

  // Load tier from local storage
  useEffect(() => {
    const savedTier = localStorage.getItem('wts_compoundiq_tier');
    if (savedTier) {
      setUserTier(savedTier);
    }
  }, []);

  const handleUpgradeClick = (targetTier, targetTab = null) => {
    if (userTier === targetTier || targetTier === 'Basic') return;
    setSelectedUpgradeTier(targetTier);
    setPendingTab(targetTab);
    setShowPayment(true);
  };

  const processSuccessfulPayment = (tier) => {
    setUserTier(tier);
    localStorage.setItem('wts_compoundiq_tier', tier);
    setShowPayment(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    alert(`Successfully upgraded to ${tier}! Premium features unlocked.`);
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
    compoundFrequency
  });

  const tabGroups = [
    {
      label: 'Free',
      tabs: [
        { name: 'Start Here', tier: 'Basic' },
        { name: 'Calculator', tier: 'Basic' }
      ]
    },
    {
      label: 'Planning',
      tabs: [
        { name: 'Emergency Fund', tier: 'Pro' },
        { name: 'Debt Payoff', tier: 'Pro' },
        { name: 'My Plan', tier: 'Pro' },
        { name: 'Net Worth', tier: 'Pro' },
        { name: 'Snapshot', tier: 'Pro' },
        { name: 'Invest', tier: 'Pro' },
        { name: 'Tax Optimizer', tier: 'Pro' },
        { name: 'Power Tools', tier: 'Pro' },
        { name: 'Compare', tier: 'Pro' }
      ]
    },
    {
      label: 'AI & Analysis',
      tabs: [
        { name: 'Coach', tier: 'Enterprise' },
        { name: 'Monte Carlo', tier: 'Ultra' },
        { name: 'AI Advisor', tier: 'Enterprise' }
      ]
    }
  ];

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
            <p>Global money planner · Tax Optimizer · AI Coach</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="tier-badge">
            Current Plan: <strong style={{ color: userTier === 'Basic' ? '#fbbf24' : '#4ade80' }}>{userTier}</strong>
          </div>
          <button className="btn-upgrade" onClick={() => setShowPricing(true)}>
            ⭐ Upgrade Plan
          </button>
        </div>
      </header>

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
                    onClick={() => {
                      if (!locked) {
                        setActiveTab(tab.name);
                      } else {
                        handleUpgradeClick(tab.tier, tab.name);
                      }
                    }}
                  >
                    {tab.name}
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
              <h2>Compound Interest Calculator</h2>
              <p className="card-subtitle">Free, with all 36 countries and tax-free wrapper comparisons included. No signup required.</p>

              <div className="form-grid">
                <div className="form-group">
                  <label>Country</label>
                  <select value={country.code} onChange={(e) => setCountry(getCountryByCode(e.target.value))}>
                    {WTS_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Amount ({country.symbol})</label>
                  <input type="number" value={initial} onChange={(e) => setInitial(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Monthly Contribution ({country.symbol})</label>
                  <input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Annual Rate (%)</label>
                  <input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Years to Grow</label>
                  <input type="number" min="1" value={years} onChange={(e) => setYears(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Inflation (%/yr)</label>
                  <input type="number" step="0.1" value={inflation} onChange={(e) => setInflation(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Compounding Frequency</label>
                  <select value={compoundFrequency} onChange={(e) => setCompoundFrequency(Number(e.target.value))}>
                    <option value="1">Annually</option>
                    <option value="2">Semi-Annually</option>
                    <option value="4">Quarterly</option>
                    <option value="12">Monthly</option>
                    <option value="365">Daily</option>
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" checked={wrapper} onChange={(e) => setWrapper(e.target.checked)} />
                    Use Tax-Free Wrapper ({country.wrapperLabel})
                  </label>
                </div>
              </div>

              <span className={`tax-verification ${verification.stale ? 'stale' : ''}`}>
                {verification.date
                  ? `${verification.stale ? '⚠️ ' : '✓ '}${country.name}'s tax rate & wrapper data last verified ${verification.date} (${verification.daysAgo} day${verification.daysAgo === 1 ? '' : 's'} ago)${verification.stale ? ' -- overdue for a recheck' : ''}`
                  : '⚠️ Verification date unknown for this country'}
              </span>

              <div className="results-summary">
                <div className="result-item">
                  <span>Projected Balance:</span>
                  <strong style={{ color: '#4ade80' }}>{country.symbol} {results.finalBalance.toLocaleString()}</strong>
                </div>
                <div className="result-item">
                  <span>Total Deposits:</span>
                  <strong>{country.symbol} {results.totalDeposited.toLocaleString()}</strong>
                </div>
                <div className="result-item">
                  <span>Compound Interest Earned:</span>
                  <strong style={{ color: '#4ade80' }}>{country.symbol} {results.totalInterest.toLocaleString()}</strong>
                </div>
                <div className="result-item">
                  <span>Real Value (Today's money):</span>
                  <strong style={{ color: '#94a3b8' }}>{country.symbol} {(results.yearlyData[results.yearlyData.length - 1]?.realValue ?? 0).toLocaleString()}</strong>
                </div>
              </div>

              <div className="scenario-section">
                <div className="scenario-header">
                  <h3>Scenario Comparison</h3>
                  <button
                    className="scenario-save-btn"
                    onClick={saveScenario}
                    disabled={scenarios.length >= MAX_SCENARIOS}
                  >
                    {scenarios.length >= MAX_SCENARIOS ? `Max ${MAX_SCENARIOS} scenarios` : '+ Save Current as Scenario'}
                  </button>
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
                      <th>Year</th>
                      <th>Balance</th>
                      <th>Real Value</th>
                      <th>Deposits</th>
                      <th>Interest</th>
                      <th>Tax Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.yearlyData.map((row) => (
                      <tr key={row.year}>
                        <td>{row.year}</td>
                        <td style={{ color: '#fff', fontWeight: '600' }}>{country.symbol} {row.balance.toLocaleString()}</td>
                        <td style={{ color: '#94a3b8' }}>{country.symbol} {row.realValue.toLocaleString()}</td>
                        <td>{country.symbol} {row.deposited.toLocaleString()}</td>
                        <td style={{ color: '#4ade80' }}>{country.symbol} {row.interest.toLocaleString()}</td>
                        <td style={{ color: '#fbbf24' }}>{wrapper ? '-' : country.symbol} {row.taxPaid.toLocaleString()}</td>
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

        {activeTab === 'AI Advisor' && canAccess('Enterprise') && (
          <div className="tab-pane active">
            <AIAdvisor country={country} profile={profile} onProfileUpdate={setProfile} />
          </div>
        )}

        {activeTab === 'Start Here' && (
          <div className="tab-pane active">
            <StartHere onNavigate={setActiveTab} />
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

        {activeTab === 'My Plan' && canAccess('Pro') && (
          <div className="tab-pane active">
            <MyPlan country={country} />
          </div>
        )}

        {activeTab === 'Net Worth' && canAccess('Pro') && (
          <div className="tab-pane active">
            <NetWorth country={country} />
          </div>
        )}

        {activeTab === 'Snapshot' && canAccess('Pro') && (
          <div className="tab-pane active">
            <Snapshot country={country} initial={initial} monthly={monthly} rate={rate} years={years} inflation={inflation} wrapper={wrapper} compoundFrequency={compoundFrequency} />
          </div>
        )}

        {activeTab === 'Tax Optimizer' && canAccess('Pro') && (
          <div className="tab-pane active">
            <TaxOptimizer country={country} initial={initial} monthly={monthly} rate={rate} years={years} inflation={inflation} compoundFrequency={compoundFrequency} />
          </div>
        )}

        {activeTab === 'Invest' && canAccess('Pro') && (
          <div className="tab-pane active">
            <Invest country={country} initial={initial} monthly={monthly} rate={rate} inflation={inflation} wrapper={wrapper} compoundFrequency={compoundFrequency} />
          </div>
        )}

        {activeTab === 'Coach' && canAccess('Enterprise') && (
          <div className="tab-pane active">
            <Coach country={country} initial={initial} monthly={monthly} rate={rate} years={years} inflation={inflation} wrapper={wrapper} compoundFrequency={compoundFrequency} />
          </div>
        )}

        {activeTab === 'Power Tools' && canAccess('Pro') && (
          <div className="tab-pane active">
            <PowerTools country={country} initial={initial} monthly={monthly} rate={rate} inflation={inflation} wrapper={wrapper} compoundFrequency={compoundFrequency} />
          </div>
        )}

        {activeTab === 'Compare' && canAccess('Pro') && (
          <div className="tab-pane active">
            <Compare country={country} initial={initial} monthly={monthly} rate={rate} years={years} inflation={inflation} compoundFrequency={compoundFrequency} />
          </div>
        )}

        {activeTab === 'Monte Carlo' && canAccess('Ultra') && (
          <div className="tab-pane active">
            <MonteCarlo country={country} initial={initial} monthly={monthly} rate={rate} years={years} compoundFrequency={compoundFrequency} />
          </div>
        )}
      </main>

      {showPricing && (
        <TierPricing
          currentTier={userTier}
          onUpgrade={(tier) => {
            if (tier === userTier) return;
            setSelectedUpgradeTier(tier);
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
          price={selectedUpgradeTier === 'Pro' ? 199 : selectedUpgradeTier === 'Ultra' ? 399 : selectedUpgradeTier === 'Enterprise' ? 'Custom' : 99}
          country={country}
          onSuccess={processSuccessfulPayment}
          onClose={() => { setShowPayment(false); setPendingTab(null); }}
        />
      )}

      <footer className="app-footer">
        <p>WTS CompoundIQ · educational tool · indicative rates drift weekly · not financial advice.</p>
        <DataBackup />
      </footer>
    </div>
  );
}