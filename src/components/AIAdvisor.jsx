import React, { useState, useEffect } from 'react';
import './AIAdvisor.css';
import { readPlan } from '../utils/planStorage';

const AIAdvisor = ({ country, profile, onProfileUpdate }) => {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  // Emergency Fund's own saved plan (if any) -- read once on mount, same pattern
  // Dashboard/My Plan use, so a recommendation below can reflect it without asking the
  // user to re-enter numbers already saved elsewhere in the app.
  const [savedEfPlan, setSavedEfPlan] = useState(null);

  useEffect(() => {
    const plan = readPlan();
    if (plan?.emergencyFund) setSavedEfPlan(plan.emergencyFund);
  }, []);

  const generateAdvice = () => {
    setLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const recommendations = generateRecommendations(country, profile, savedEfPlan);
      setAdvice(recommendations);
      setLoading(false);
    }, 2000);
  };

  const generateRecommendations = (country, profile, efPlan) => {
    const recommendations = [];
    
    // Age-based advice
    if (profile.age < 30) {
      recommendations.push({
        type: "aggressive",
        title: "🚀 Growth Phase",
        message: "You're in the optimal time for compound growth. Consider higher-risk, higher-return options.",
        allocation: "80% stocks, 20% bonds",
        color: "#10b981"
      });
    } else if (profile.age < 50) {
      recommendations.push({
        type: "balanced",
        title: "⚖️ Wealth Accumulation",
        message: "Balance growth with stability as you approach middle age.",
        allocation: "60% stocks, 40% bonds",
        color: "#3b82f6"
      });
    } else {
      recommendations.push({
        type: "conservative",
        title: "🛡️ Capital Preservation",
        message: "Focus on protecting your accumulated wealth while maintaining some growth.",
        allocation: "40% stocks, 60% bonds",
        color: "#f59e0b"
      });
    }

    // Income-based advice
    if (profile.income > 100000) {
      recommendations.push({
        type: "tax",
        title: "💰 Tax Optimization",
        message: "With your income level, maximize tax-advantaged accounts like retirement funds.",
        strategy: "Max out employer matching, then contribute to tax-free accounts",
        color: "#8b5cf6"
      });
    }

    // Country-specific advice
    if (country.wrapperLabel && country.wrapperLabel !== 'N/A') {
      recommendations.push({
        type: "account",
        title: "🏆 Tax-Free Benefits",
        message: `${country.name} offers ${country.taxFreeWrapper}. Prioritize this for maximum compounding.`,
        accounts: [country.wrapperLabel],
        color: "#ef4444"
      });
    }

    // Savings-based advice
    const savingsRatio = profile.income > 0 ? (profile.savings / profile.income) * 100 : 0;
    if (savingsRatio < 10) {
      recommendations.push({
        type: "savings",
        title: "📈 Increase Savings",
        message: `Your savings rate is ${savingsRatio.toFixed(1)}%. Aim for at least 20% of your income.`,
        strategy: "Automate savings and reduce non-essential spending",
        color: "#f59e0b"
      });
    }

    // Debt-based advice: a rough real (after-inflation, pre-tax) return most balanced
    // portfolios can be expected to beat is around 5-6%/yr -- a debt costing meaningfully
    // more than that is a near-guaranteed "return" to pay it down first, since paying it
    // off is a certain outcome and investing isn't. Only fires above a clear threshold so
    // it isn't second-guessing every mortgage-rate debt against a rough benchmark.
    if (profile.debtRate > 12) {
      recommendations.push({
        type: "debt",
        title: "🧯 Pay Down High-Interest Debt First",
        message: `Debt at ${profile.debtRate}% is a close-to-guaranteed "return" that almost certainly beats what a balanced portfolio would earn after tax and inflation. Prioritize clearing it before directing new money toward investments.`,
        strategy: "Put spare cash toward the highest-rate balance before increasing contributions elsewhere",
        color: "#ef4444"
      });
    }

    // Emergency Fund-based advice: reuses the target/currentSavings saved on the
    // Emergency Fund tab, rather than asking for a third copy of these numbers. Only
    // fires when there's an actual saved plan (never invents a target from nothing),
    // and stays quiet once it's funded -- consistent with milestones.js's
    // detectEfFundedMilestone/financialHealthScore.js's scoreEmergencyFund treating
    // "no plan saved" and "plan saved and funded" as two different, non-alarming states.
    if (efPlan && efPlan.targetAmount > 0) {
      const fundedPct = Math.min(100, (efPlan.currentSavings / efPlan.targetAmount) * 100);
      if (fundedPct < 100) {
        recommendations.push({
          type: "safety-net",
          title: "🧱 Build Your Safety Net First",
          message: `Your saved Emergency Fund plan is ${fundedPct.toFixed(0)}% funded (${country.symbol} ${Math.round(efPlan.currentSavings).toLocaleString()} of ${country.symbol} ${Math.round(efPlan.targetAmount).toLocaleString()}). Most guidance treats a full emergency fund as the foundation to build before increasing investment risk.`,
          strategy: "Prioritize monthly contributions to the emergency fund until it's fully funded, then redirect that amount to investing",
          color: "#3b82f6"
        });
      }
    }

    return recommendations;
  };

  return (
    <div className="card ai-advisor">
      <div className="ai-header">
        <h2>🤖 AI Investment Advisor</h2>
        <p>Get personalized investment recommendations based on your profile</p>
        <p className="ai-honesty-note">
          Rule-based, not a live AI model: your answers run through fixed if/else logic below, not a generative AI call.
        </p>
      </div>

      <div className="profile-setup">
        <h3>Personalize Your Advice</h3>
        <div className="profile-form">
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => onProfileUpdate({...profile, age: Number(e.target.value)})}
              min="18"
              max="100"
            />
          </div>
          <div className="form-group">
            <label>Annual Income ({country.symbol})</label>
            <input
              type="number"
              value={profile.income}
              onChange={(e) => onProfileUpdate({...profile, income: Number(e.target.value)})}
              min="0"
              step="10000"
            />
          </div>
          <div className="form-group">
            <label>Current Savings ({country.symbol})</label>
            <input
              type="number"
              value={profile.savings}
              onChange={(e) => onProfileUpdate({...profile, savings: Number(e.target.value)})}
              min="0"
              step="1000"
            />
          </div>
          <div className="form-group">
            <label>Highest Debt Rate, if any (%)</label>
            <input
              type="number"
              value={profile.debtRate ?? 0}
              onChange={(e) => onProfileUpdate({...profile, debtRate: Number(e.target.value)})}
              min="0"
              step="0.5"
            />
          </div>
          <div className="form-group">
            <label>Risk Tolerance</label>
            <select
              value={profile.riskTolerance}
              onChange={(e) => onProfileUpdate({...profile, riskTolerance: e.target.value})}
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>
        
        <button
          className="ai-button"
          onClick={generateAdvice}
          disabled={loading}
        >
          {loading ? 'Analyzing Your Profile...' : 'Get AI Recommendations'}
        </button>
      </div>

      {advice && (
        <div className="recommendations">
          <h3>🎯 Personalized Recommendations</h3>
          <div className="recommendations-grid">
            {advice.map((rec, index) => (
              <div key={index} className="recommendation-card" style={{ borderLeftColor: rec.color }}>
                <div className="rec-header">
                  <h4 style={{ color: rec.color }}>{rec.title}</h4>
                  <span className="rec-type">{rec.type}</span>
                </div>
                <p className="rec-message">{rec.message}</p>
                {rec.allocation && (
                  <div className="rec-detail">
                    <strong>Recommended Allocation:</strong>
                    <span>{rec.allocation}</span>
                  </div>
                )}
                {rec.strategy && (
                  <div className="rec-detail">
                    <strong>Strategy:</strong>
                    <span>{rec.strategy}</span>
                  </div>
                )}
                {rec.accounts && (
                  <div className="rec-accounts">
                    <strong>Recommended Accounts:</strong>
                    <div className="account-tags">
                      {rec.accounts.map((account, idx) => (
                        <span key={idx} className="account-tag">{account}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;