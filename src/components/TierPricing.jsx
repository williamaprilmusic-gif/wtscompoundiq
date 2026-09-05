// src/components/TierPricing.jsx
import React, { useState } from 'react';
import './TierPricing.css';
import FAQHelper from './FAQHelper';

// Renders a tier's `price`/`priceAnnual` field for display -- a plain ZAR number
// (199, 1499) for any priced tier, formatted here; Basic and Enterprise instead carry
// the literal display string ('Free', 'Custom') straight through, since neither has a
// real numeric checkout price. The number is the source of truth (see UPGRADE_PRICES
// below, exported straight from these same fields) -- previously it was the other way
// around: a display string like 'R1,499' got parsed back into a number with a regex,
// which meant a purely cosmetic copy change (a different currency symbol placement, an
// unexpected separator) could silently compute the wrong checkout price, or drop a
// tier's price entirely by returning null.
const formatTierPrice = (value) => typeof value === 'number' ? `R${value.toLocaleString()}` : value;

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
      'Year-by-year growth data table',
      'Cost-of-waiting projection',
      'Rate-sensitivity band (±2% on every projection)',
      'Doubling-time fact (Rule of 72) for every rate you enter',
      'Milestone markers plotted directly on the growth chart',
      'Copy Summary — the finished numbers as plain text, ready to paste',
      'Years-to-grow shown as a real calendar date',
      'Milestone pacing — "you reach R1m in year 18"',
      'Deposits vs. compound-growth split of every result',
      '"One small bump" nudge — what an extra R500/mo is worth',
      'Goal seek — "to have R2m in 20 years, save R X/month"',
      '"If you stopped contributing today" — how much of your result is already locked in'
    ],
    cta: 'Downgrade to Basic',
    highlighted: false
  },
  {
    name: 'Pro',
    price: 199,
    billing: '/ month',
    // Annual = ~24% off the R199 x 12 = R2,388 monthly run rate.
    priceAnnual: 1499,
    billingAnnual: '/ year (~R125/mo)',
    description: 'The full planning toolkit, beyond the calculator.',
    features: [
      'Everything in Basic, plus:',
      'Budget / Cash Flow tracker, with a monthly surplus history & trend chart',
      'Emergency Fund tracker',
      'Debt Payoff planner (Avalanche & Snowball with a debt-free-by date, plus a consolidation analyzer)',
      'Loan & Bond Calculator (home/vehicle/personal/student loans, extra & bi-weekly payments, one-off lump sums, all with a payoff-by calendar date)',
      'My Plan (save a snapshot, check in on progress later, with reminders)',
      'Goal-based Invest planner (multiple goals at once)',
      'Tax Optimizer, including a retirement fund comparison & a tax-loss harvesting calculator',
      'Power Tools — 41 focused calculators (FIRE, Fund Fee Face-off, Contractor Rate, VAT Calculator, Capital Gains Tax, and more)',
      'Net Worth tracker with asset allocation, forecast & balance-sheet ratios',
      'Dashboard with Financial Health Score, Budget & Invest Goals summaries, milestones & PDF export',
      'Financial Snapshot export (print / PDF / CSV)',
      'Side-by-side country comparison tool, plus compare your own plans',
      'Priority support'
    ],
    cta: 'Upgrade to Pro',
    highlighted: true
  },
  {
    name: 'Ultra',
    price: 299,
    billing: '/ month',
    // Annual = ~30% off the R299 x 12 = R3,588 monthly run rate.
    priceAnnual: 2499,
    billingAnnual: '/ year (~R208/mo)',
    description: 'Every scenario tool, plus AI-powered guidance -- on top of Pro.',
    features: [
      'Everything in Pro, plus:',
      '8 advanced Power Tools — Drawdown, Coast & Barista FIRE, Retirement Income Gap (now with a "how long to close it" timeline), Pre-Tax & RA Tax Optimizer, Two-Pot Withdrawal, Sequence-of-Returns Risk',
      'Monte Carlo simulation (1,000-path outcome range)',
      'Monte Carlo solvers — contribution OR years to hit a target success probability',
      'Monte Carlo retirement drawdown — how often the pot survives being lived off',
      'Monte Carlo safe-withdrawal solver — the year-1 draw the pot survives',
      'Monte Carlo goal-timeline — your odds of being there by year 5, 10, 15…',
      "Monte Carlo history's-worst-window — your plan through the worst real stretch",
      'FX stress test for Net Worth (offshore holdings), with a full shock-level range at a glance',
      'AI Wealth Coach (5-step planner: wrapper, contribution boost, extra years, contribution escalation, unused Budget surplus)',
      'AI Investment Advisor (personalized recommendations, incl. debt priority, saved Emergency Fund status & Net Worth leverage)'
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
      'Branded plan header — firm name, logo & tagline on My Plan, Snapshot, and Dashboard printouts',
      'Custom compliance / FSP disclosure line, shared across My Plan, Snapshot, and the Dashboard PDF',
      '"Prepared by [adviser] for [client] on [date]" line on client plans',
      'Firm contact info on the Snapshot report footer, alongside the compliance line',
      'Adviser notes on client plans, with a last-edited timestamp',
      'Bulk user management & admin dashboard',
      'API access for external integrations',
      'Dedicated tax specialist consultation',
      'Priority support & custom hosting'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
];

// Derived directly from the same numeric `price`/`priceAnnual` fields the cards above
// format for display -- the single source of truth for checkout pricing, imported by
// App.jsx for PaymentSection instead of a second hardcoded copy of these figures (see
// App.jsx's own note on why that mattered: a price changed here and forgotten there
// would advertise one number and charge another). Basic ('Free') and Enterprise
// ('Custom') carry a string, not a number, and are intentionally absent -- App.jsx's
// own fallback covers both.
export const UPGRADE_PRICES = tiers.reduce((acc, tier) => {
  if (typeof tier.price !== 'number') return acc;
  acc[tier.name] = typeof tier.priceAnnual === 'number' ? { monthly: tier.price, annual: tier.priceAnnual } : { monthly: tier.price };
  return acc;
}, {});

export default function TierPricing({ currentTier, onUpgrade, onClose }) {
  // Only Pro/Ultra carry an annual option -- Basic is free and Enterprise is a direct
  // quote, so this toggle only ever changes what those two cards show.
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  // Two-tap confirm for the downgrade, in place of a window.confirm() the browser can
  // suppress. Only the Basic card ever reads this.
  const [confirmingDowngrade, setConfirmingDowngrade] = useState(false);

  const handleUpgrade = (tier) => {
    // App.jsx branches: Basic downgrades directly (it's free, no payment flow), anything
    // else goes through checkout. Only pass 'annual' for a tier that actually has one --
    // Basic/Enterprise ignore the toggle so they should never carry it through.
    if (tier.name === 'Basic') {
      if (!confirmingDowngrade) { setConfirmingDowngrade(true); return; }
      setConfirmingDowngrade(false);
    }
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
            onClick={() => { setBillingPeriod('monthly'); setConfirmingDowngrade(false); }}
          >
            Monthly
          </button>
          <button
            className={billingPeriod === 'annual' ? 'active' : ''}
            onClick={() => { setBillingPeriod('annual'); setConfirmingDowngrade(false); }}
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
                  <span className="currency">{formatTierPrice(showAnnual ? tier.priceAnnual : tier.price)}</span>
                  <span className="billing">{showAnnual ? tier.billingAnnual : tier.billing}</span>
                </div>
                <p className="tier-desc">{tier.description}</p>
                <ul className="tier-features">
                  {tier.features.map((feature, idx) => (
                    <li key={idx}>✅ {feature}</li>
                  ))}
                </ul>
                <button
                  className={`upgrade-btn ${currentTier === tier.name ? 'current' : ''} ${tier.name === 'Basic' && confirmingDowngrade ? 'confirming' : ''}`}
                  onClick={() => handleUpgrade(tier)}
                  disabled={currentTier === tier.name}
                >
                  {currentTier === tier.name
                    ? 'Active Plan'
                    : tier.name === 'Basic' && confirmingDowngrade
                      ? 'Tap again to confirm downgrade'
                      : tier.cta}
                </button>
                {tier.name === 'Basic' && confirmingDowngrade && currentTier !== 'Basic' && (
                  <button type="button" className="downgrade-cancel-btn" onClick={() => setConfirmingDowngrade(false)}>
                    Keep {currentTier}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <FAQHelper />
      </div>
    </div>
  );
}