// src/components/FAQHelper.jsx
import React, { useState } from 'react';
import './FAQHelper.css';

const FAQ_DATA = [
  {
    question: 'Can I change my plan later?',
    answer: 'Yes -- open "Upgrade Plan" any time to switch tiers. Changes apply immediately since this is a local demo with no real billing cycle to wait out.',
    keywords: ['change', 'plan', 'downgrade', 'switch', 'cancel']
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'None yet, honestly. The upgrade flow is a "Demo Upgrade -- No Charge" simulation: no real payment is processed, and no card or bank details are collected or stored. South African users see a real local bank list (Absa, Standard Bank, Capitec, etc.) in the bank-redirect option, but it is for demo purposes only.',
    keywords: ['payment', 'card', 'pay', 'bank', 'billing', 'charge', 'credit']
  },
  {
    question: 'Is there a money-back guarantee?',
    answer: 'There is nothing to refund -- no real charge ever happens in this version of the app.',
    keywords: ['refund', 'guarantee', 'money back', 'cancel']
  },
  {
    question: 'How accurate are the interest rates and tax figures?',
    answer: 'They are indicative simplifications for education, not verified current tax law. Each of the 36 supported countries is reduced to a single tax rate and one tax-free wrapper, and real tax rules have brackets, thresholds, and change yearly. Do not treat this as your only source before making real financial decisions.',
    keywords: ['accurate', 'accuracy', 'correct', 'real', 'tax rate', 'reliable', 'trust']
  },
  {
    question: 'What is the difference between Basic, Pro, Ultra, and Enterprise?',
    answer: 'Basic is free and covers Start Here and the Calculator (all 36 countries, tax-free wrapper comparison). Pro unlocks the full planning toolkit: Budget tracker, Emergency Fund tracker, Debt Payoff planner, My Plan (with reminders), multi-goal Invest planner, Tax Optimizer, Power Tools, Net Worth tracker, Dashboard, Financial Snapshot export, and country comparison. Ultra adds the Monte Carlo simulator, a Net Worth FX stress test, plus the AI Wealth Coach and AI Investment Advisor. Enterprise is licensed software for financial advisors and firms: white-label branding, bulk user management, and API access, priced per seat or firm license.',
    keywords: ['tier', 'plan', 'basic', 'pro', 'ultra', 'enterprise', 'difference', 'compare plans', 'free']
  },
  {
    question: 'Is my data safe? Is this app secure?',
    answer: 'Yes -- everything runs in your browser. Nothing you type is sent to a server, there is no login/account system, and no card or personal data is ever collected. Your selected tier is stored only in your own browser\'s local storage, which is why it can be reset by clearing your browser data.',
    keywords: ['secure', 'security', 'safe', 'hack', 'data', 'privacy']
  },
  {
    question: 'What is a tax-free wrapper (TFSA, ISA, Roth IRA, etc.)?',
    answer: 'A tax-free wrapper is a savings/investment account type your country offers where investment gains are not taxed, usually up to a contribution limit. Toggle "Use Tax-Free Wrapper" on the Calculator tab, or open the Tax Optimizer tab to see exactly how much yours would save you.',
    keywords: ['wrapper', 'tfsa', 'isa', 'roth', 'ira', 'tax free', 'tax-free']
  },
  {
    question: 'Why does compounding frequency matter?',
    answer: 'The more often interest is credited, the sooner it starts earning its own interest. Daily compounding grows slightly faster than annual compounding at the same nominal rate. Compare Annually, Semi-Annually, Quarterly, Monthly, or Daily using the Compounding Frequency dropdown on the Calculator tab.',
    keywords: ['compounding', 'frequency', 'daily', 'monthly', 'annually', 'quarterly']
  },
  {
    question: 'Is this financial advice?',
    answer: 'No. WTS CompoundIQ is an educational calculator, not licensed financial advice. Speak with a qualified financial advisor before making real investment or tax decisions.',
    keywords: ['advice', 'financial advisor', 'licensed', 'recommendation']
  },
  {
    question: 'Which countries are supported?',
    answer: '36 countries across 6 continents, each with a simplified tax rate and its own tax-free wrapper. Pick yours from the Country dropdown on the Calculator tab.',
    keywords: ['country', 'countries', 'supported', 'currency', 'list']
  }
];

const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'my', 'to', 'of', 'for', 'and', 'in', 'on', 'can', 'how', 'what', 'this']);

const tokenize = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOPWORDS.has(w));

const scoreEntry = (entry, queryTokens) => {
  const haystack = tokenize(`${entry.question} ${entry.answer} ${entry.keywords.join(' ')}`);
  let score = 0;
  for (const qToken of queryTokens) {
    if (entry.keywords.some(k => k.toLowerCase().includes(qToken))) score += 3;
    if (tokenize(entry.question).some(t => t.includes(qToken) || qToken.includes(t))) score += 2;
    if (haystack.some(t => t.includes(qToken))) score += 1;
  }
  return score;
};

const FAQHelper = () => {
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  const queryTokens = tokenize(query);
  const hasQuery = queryTokens.length > 0;

  const matches = hasQuery
    ? FAQ_DATA
        .map((entry, index) => ({ entry, index, score: scoreEntry(entry, queryTokens) }))
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];

  return (
    <div className="faq-section">
      <div className="faq-helper">
        <h3>🤖 Ask the FAQ Assistant</h3>
        <p className="faq-helper-note">
          Type a question in your own words. This searches our FAQ by keyword match -- it's not a live AI chat, so it
          can only find answers already written below, not generate new ones.
        </p>
        <input
          type="text"
          className="faq-search-input"
          placeholder="e.g. is this secure? what's the difference between tiers?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {hasQuery && (
          <div className="faq-matches">
            {matches.length > 0 ? (
              matches.map(({ entry, index }) => (
                <div key={index} className="faq-match-card">
                  <h4>{entry.question}</h4>
                  <p>{entry.answer}</p>
                </div>
              ))
            ) : (
              <div className="faq-no-match">
                No close match found -- browse the full list below.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="faq-list">
        <h3>All Questions</h3>
        {FAQ_DATA.map((entry, index) => (
          <div key={index} className={`faq-item ${openIndex === index ? 'open' : ''}`}>
            <button className="faq-item-question" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
              {entry.question}
              <span className="faq-item-icon">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && <p className="faq-item-answer">{entry.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQHelper;
