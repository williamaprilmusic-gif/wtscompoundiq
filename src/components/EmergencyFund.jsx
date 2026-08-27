// src/components/EmergencyFund.jsx
import React, { useState } from 'react';
import './EmergencyFund.css';

const PLAN_STORAGE_KEY = 'wts_compoundiq_plan_snapshot';

const EmergencyFund = ({ country }) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [monthsCoverage, setMonthsCoverage] = useState(3);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [saved, setSaved] = useState(false);

  const targetAmount = monthlyExpenses * monthsCoverage;
  const remaining = Math.max(0, targetAmount - currentSavings);
  const progressPct = targetAmount > 0 ? Math.min(100, (currentSavings / targetAmount) * 100) : 100;
  const isFunded = currentSavings >= targetAmount;
  const monthsToTarget = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : null;

  const savePlan = () => {
    const existing = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || '{}');
    const updated = {
      ...existing,
      emergencyFund: {
        savedAt: new Date().toISOString(),
        targetAmount,
        currentSavings,
        monthlyContribution
      }
    };
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card emergency-fund">
      <div className="ef-header">
        <h2>🛟 Emergency Fund Tracker</h2>
        <p>Before investing, most guidance recommends this as your financial foundation -- money that's there when life happens, without needing to sell investments or go into debt.</p>
      </div>

      <div className="ef-form">
        <div className="form-group">
          <label>Monthly Essential Expenses ({country.symbol})</label>
          <input type="number" min="0" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>Months of Coverage</label>
          <select value={monthsCoverage} onChange={(e) => setMonthsCoverage(Number(e.target.value))}>
            <option value="3">3 months (minimum)</option>
            <option value="6">6 months (standard)</option>
            <option value="9">9 months (cautious)</option>
            <option value="12">12 months (very cautious)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Current Emergency Savings ({country.symbol})</label>
          <input type="number" min="0" value={currentSavings} onChange={(e) => setCurrentSavings(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>Monthly Contribution ({country.symbol})</label>
          <input type="number" min="0" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} />
        </div>
      </div>

      <div className={`ef-result ${isFunded ? 'funded' : ''}`}>
        <div className="ef-progress-header">
          <span>{country.symbol} {currentSavings.toLocaleString()} of {country.symbol} {targetAmount.toLocaleString()} target</span>
          <span>{progressPct.toFixed(0)}%</span>
        </div>
        <div className="ef-progress-bar">
          <div className="ef-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {isFunded ? (
          <p className="ef-status">✅ Fully funded -- you're covered for {monthsCoverage} months of essential expenses.</p>
        ) : (
          <p className="ef-status">
            {country.symbol} {Math.round(remaining).toLocaleString()} to go.
            {monthsToTarget !== null
              ? ` At ${country.symbol} ${monthlyContribution.toLocaleString()}/month, you'll be fully covered in ${monthsToTarget} month${monthsToTarget === 1 ? '' : 's'}.`
              : ' Set a monthly contribution above to see how long it will take.'}
          </p>
        )}
      </div>

      <p className="ef-note">
        This is simple non-compounding math on purpose -- emergency funds belong in an easily accessible account
        (not invested), so this doesn't assume any investment growth.
      </p>

      <button className="ef-save-plan-btn" onClick={savePlan}>
        {saved ? '✓ Saved to My Plan' : '💾 Save This Plan'}
      </button>
    </div>
  );
};

export default EmergencyFund;
