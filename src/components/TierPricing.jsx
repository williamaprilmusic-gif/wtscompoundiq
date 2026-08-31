// src/components/TierPricing.jsx
import React, { useState } from 'react';
import './TierPricing.css';
import FAQHelper from './FAQHelper';

const tiers = [
  {
    name: 'Basic',
    price: 'Free',
    billing: 'forever',
    description: 'Get oriented and run the numbers -- no signup required.',
    features: [
      'Start Here guided quiz',
      'Compound interest calculator, all 36 countries',
      'Tax-free wrapper vs. taxable comparison',
      'Compounding frequency control',
      'Year-by-year growth data table'
    ],
    cta: 'Downgrade to Basic',
    highlighted: false
  },
  {
    name: 'Pro',
    price: 'R199',
    billing: '/ month',
    // Annual = ~24% off the R199 x 12 = R2,388 monthly run rate.
    priceAnnual: 'R1,499',
    billingAnnual: '/ year (~R125/mo)',
    description: 'The full planning toolkit, beyond the calculator.',
    features: [
      'Everything in Basic, plus:',
      'Emergency Fund tracker',
      'Debt Payoff planner (Avalanche & Snowball)',
      'My Plan (save a snapshot, check in on progress later, with reminders)',
      'Goal-based Invest planner (multiple goals at once)',
      'Tax Optimizer',
      'Power Tools (FIRE number + Debt vs. Invest)',
      'Financial Snapshot export (print / PDF / CSV)',
      'Side-by-side country comparison tool',
      'Priority support'
    ],
    cta: 'Upgrade to Pro',
    highlighted: true
  },
  {
    name: 'Ultra',
    price: 'R299',
    billing: '/ month',
    // Annual = ~30% off the R299 x 12 = R3,588 monthly run rate.
    priceAnnual: 'R2,499',
    billingAnnual: '/ year (~R208/mo)',
    description: 'Every scenario tool, plus AI-powered guidance -- on top of Pro.',
    features: [
      'Everything in Pro, plus:',
      'Monte Carlo simulation (1,000-path outcome range)',
      'AI Wealth Coach (Step 1-3 planner)',
      'AI Investment Advisor (personalized recommendations)'
    ],
    cta: 'Upgrade to Ultra',
    highlighted: false
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    billing: 'per seat or firm license',
    description: 'Licensed software for independent financial advisors (IFAs), debt counsellors, and wealth management boutiques -- typically R1,500-R3,500+/month depending on seats and branding.',
    features: [
      'Everything in Ultra, plus:',
      'White-label branding (your own logo)',
      'Bulk user management & admin dashboard',
      'API access for external integrations',
      'Dedicated tax specialist consultation',
      'Priority support & custom hosting'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
];

export default function TierPricing({ currentTier, onUpgrade, onClose }) {
  // Only Pro/Ultra carry an annual option -- Basic is free and Enterprise is a direct
  // quote, so this toggle only ever changes what those two cards show.
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const handleUpgrade = (tier) => {
    // App.jsx branches: Basic downgrades directly (it's free, no payment flow), anything
    // else goes through checkout. Only pass 'annual' for a tier that actually has one --
    // Basic/Enterprise ignore the toggle so they should never carry it through.
    onUpgrade(tier.name, tier.priceAnnual ? billingPeriod : 'monthly');
  };

  return (
    <div className="pricing-overlay">
      <div className="pricing-modal">
        <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="pricing-title">Choose Your Plan</h2>
        <p className="pricing-subtitle">Unlock the full power of WTS CompoundIQ. Basic calculator is free; premium features require an active subscription.</p>

        <div className="billing-toggle" role="group" aria-label="Billing period">
          <button
            className={billingPeriod === 'monthly' ? 'active' : ''}
            onClick={() => setBillingPeriod('monthly')}
          >
            Monthly
          </button>
          <button
            className={billingPeriod === 'annual' ? 'active' : ''}
            onClick={() => setBillingPeriod('annual')}
          >
            Annual <span className="save-badge">Save up to 30%</span>
          </button>
        </div>

        <div className="tiers-grid">
          {tiers.map((tier) => {
            const showAnnual = billingPeriod === 'annual' && tier.priceAnnual;
            return (
              <div key={tier.name} className={`tier-card ${tier.highlighted ? 'highlighted' : ''} ${currentTier === tier.name ? 'active' : ''}`}>
                {tier.highlighted && <div className="badge">MOST POPULAR</div>}
                <h3 className="tier-name">{tier.name}</h3>
                <div className="tier-price">
                  <span className="currency">{showAnnual ? tier.priceAnnual : tier.price}</span>
                  <span className="billing">{showAnnual ? tier.billingAnnual : tier.billing}</span>
                </div>
                <p className="tier-desc">{tier.description}</p>
                <ul className="tier-features">
                  {tier.features.map((feature, idx) => (
                    <li key={idx}>✅ {feature}</li>
                  ))}
                </ul>
                <button
                  className={`upgrade-btn ${currentTier === tier.name ? 'current' : ''}`}
                  onClick={() => handleUpgrade(tier)}
                  disabled={currentTier === tier.name}
                >
                  {currentTier === tier.name ? 'Active Plan' : tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        <FAQHelper />
      </div>
    </div>
  );
}