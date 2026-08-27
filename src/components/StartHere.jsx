// src/components/StartHere.jsx
import React, { useState } from 'react';
import './StartHere.css';

const QUESTIONS = [
  { key: 'hasHighInterestDebt', text: 'Do you have any high-interest debt (roughly 15%+ APR, e.g. credit cards)?' },
  { key: 'hasEmergencyFund', text: 'Do you have 3-6 months of essential expenses saved for emergencies?' },
  { key: 'isInvestingRegularly', text: 'Are you already investing toward a specific goal every month?' }
];

const StartHere = ({ onNavigate }) => {
  const [answers, setAnswers] = useState({});

  const allAnswered = QUESTIONS.every(q => answers[q.key] !== undefined);

  const setAnswer = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));

  const getRecommendation = () => {
    if (answers.hasHighInterestDebt) {
      return {
        title: '🔥 Priority 1: Pay off high-interest debt',
        body: 'High-interest debt (credit cards, store cards, etc.) almost always costs more than any investment reliably earns. Clearing it first is usually the single best "return" available to you.',
        cta: 'Go to Debt Payoff',
        tab: 'Debt Payoff'
      };
    }
    if (!answers.hasEmergencyFund) {
      return {
        title: '🛟 Priority 1: Build your emergency fund',
        body: 'Before investing, most guidance recommends 3-6 months of essential expenses in an easily accessible account, so a surprise bill or job loss doesn\'t force you to sell investments or go into debt.',
        cta: 'Go to Emergency Fund',
        tab: 'Emergency Fund'
      };
    }
    if (!answers.isInvestingRegularly) {
      return {
        title: '📈 Priority 1: Start investing toward a goal',
        body: 'With debt handled and a safety net in place, the next step is putting your money to work. Use the Invest tab to work out exactly how much you need to save monthly to hit a real target.',
        cta: 'Go to Invest',
        tab: 'Invest'
      };
    }
    return {
      title: '✅ You\'ve covered the basics',
      body: 'No high-interest debt, a funded emergency cushion, and you\'re already investing regularly -- now it\'s about optimizing. Make sure you\'re using every tax-free wrapper available to you.',
      cta: 'Go to Tax Optimizer',
      tab: 'Tax Optimizer'
    };
  };

  return (
    <div className="card start-here">
      <div className="start-header">
        <h2>👋 Start Here</h2>
        <p>Three quick questions to find out what to focus on first -- in the order most financial guidance recommends.</p>
      </div>

      <div className="start-questions">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="start-question">
            <span>{q.text}</span>
            <div className="start-toggle">
              <button className={answers[q.key] === true ? 'active' : ''} onClick={() => setAnswer(q.key, true)}>Yes</button>
              <button className={answers[q.key] === false ? 'active' : ''} onClick={() => setAnswer(q.key, false)}>No</button>
            </div>
          </div>
        ))}
      </div>

      {allAnswered && (() => {
        const rec = getRecommendation();
        return (
          <div className="start-recommendation">
            <h3>{rec.title}</h3>
            <p>{rec.body}</p>
            <button className="start-cta" onClick={() => onNavigate(rec.tab)}>{rec.cta} →</button>
          </div>
        );
      })()}
    </div>
  );
};

export default StartHere;
