// src/components/TierPricing.jsx
import React, { useState } from 'react';
import './TierPricing.css';
import FAQHelper from './FAQHelper';

// Renders a tier's `price`/`priceAnnual` field for display -- a plain ZAR number
// (149, 1199) for a priced tier, formatted here; Basic instead carries the literal
// string 'Free' straight through, since it has no numeric checkout price. The number is
// the source of truth (see UPGRADE_PRICES below, exported straight from these same
// fields) -- previously it was the other way around: a display string like 'R1,199' got
// parsed back into a number with a regex, which meant a purely cosmetic copy change (a
// different currency symbol placement, an unexpected separator) could silently compute
// the wrong checkout price, or drop a tier's price entirely by returning null.
const formatTierPrice = (value) => typeof value === 'number' ? `R${value.toLocaleString()}` : value;

// Low -> high. Drives whether a card's button reads "Upgrade to X" or "Downgrade to X"
// relative to the tier the user is currently on -- kept in sync with `tiers` order.
// Exported so App.jsx can label the checkout screen the same way (upgrade vs downgrade).
export const TIER_ORDER = ['Basic', 'Pro', 'Ultra'];
const tierRank = (name) => TIER_ORDER.indexOf(name);

const tiers = [
  {
    name: 'Basic',
    price: 'Free',
    billing: 'forever',
    description: 'Get oriented and run the numbers -- no signup required.',
    features: [
      'Start Here guided quiz',
      'Compound interest calculator, built for South African tax rules',
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
      '"If you stopped contributing today" — how much of your result is already locked in',
      '"As retirement income" — your projected balance reframed at a 4% safe withdrawal rate',
      'Current SARS tax year shown at a glance — your TFSA limit resets 1 March, not 1 January',
      'Your monthly contribution shown as a per-week / per-day figure'
    ],
    highlighted: false
  },
  {
    name: 'Pro',
    price: 149,
    billing: '/ month',
    // Annual = ~33% off the R149 x 12 = R1,788 monthly run rate.
    priceAnnual: 1199,
    billingAnnual: '/ year (~R100/mo)',
    description: 'The full planning toolkit, beyond the calculator.',
    features: [
      'Everything in Basic, plus:',
      'Budget / Cash Flow tracker, with a monthly surplus history & trend chart',
      'Emergency Fund tracker',
      'Debt Payoff planner (Avalanche & Snowball with a debt-free-by date, plus a consolidation analyzer)',
      'Loan & Bond Calculator (home/vehicle/personal/student loans, "prime + margin" rate quoting, extra & bi-weekly payments, one-off lump sums, all with a payoff-by calendar date)',
      'My Plan (save a snapshot, check in on progress later, with reminders)',
      'Goal-based Invest planner (multiple goals at once, checked against your saved Budget surplus)',
      'Tax Optimizer — retirement fund comparison, tax-loss harvesting calculator, and a TFSA lifetime-limit (R500k) progress tracker',
      'Power Tools — 40 focused calculators (FIRE, Fund Fee Face-off, Contractor Rate, VAT Calculator, Capital Gains Tax, and more)',
      'Net Worth tracker with asset allocation, forecast & balance-sheet ratios',
      'Dashboard with Financial Health Score, Budget & Invest Goals summaries, milestones & PDF export',
      'Financial Snapshot export (print / PDF / CSV)',
      'Compare your own plans side by side (e.g. contribute more vs. wait 5 years)',
      'Priority support'
    ],
    highlighted: true
  },
  {
    name: 'Ultra',
    price: 249,
    billing: '/ month',
    // Annual = ~33% off the R249 x 12 = R2,988 monthly run rate.
    priceAnnual: 1999,
    billingAnnual: '/ year (~R167/mo)',
    description: 'Every scenario tool, plus AI-powered guidance -- on top of Pro.',
    features: [
      'Everything in Pro, plus:',
      '8 advanced Power Tools — Drawdown, Coast & Barista FIRE, Retirement Income Gap (now with a "how long to close it" timeline), Pre-Tax & RA Tax Optimizer, Two-Pot Withdrawal (flags the R2,000 minimum and once-per-tax-year rule), Sequence-of-Returns Risk',
      'Monte Carlo simulation (1,000-path outcome range)',
      'Monte Carlo solvers — contribution OR years to hit a target success probability',
      'Monte Carlo retirement drawdown — how often the pot survives being lived off',
      'Monte Carlo safe-withdrawal solver — the year-1 draw the pot survives',
      'Monte Carlo goal-timeline — your odds of being there by year 5, 10, 15…',
      "Monte Carlo history's-worst-window — your plan through the worst real stretch",
      'FX stress test for Net Worth (offshore holdings), with a full shock-level range and how your leverage ratio itself shifts under each shock',
      'AI Wealth Coach (step-by-step planner: wrapper, contribution boost, extra years, contribution escalation, using your full TFSA allowance, unused Budget surplus)',
      'AI Investment Advisor (personalized recommendations, incl. debt priority, saved Emergency Fund status & Net Worth leverage)',
      'White-label / branded plan exports — your firm name, logo & tagline on the My Plan, Snapshot, and Dashboard PDF printouts',
      'Custom compliance / FSP disclosure line, shared across My Plan, Snapshot, and the Dashboard PDF',
      '"Prepared by [adviser] for [client] on [date]" line on client plans',
      'Firm contact info and FSP (FAIS licence) number on the Snapshot report and Dashboard PDF footers',
      'Auto report reference (e.g. Ref WTS-20260906-1423) in the Snapshot report header',
      'Plan notes with a last-edited timestamp'
    ],
    highlighted: false
  }
];

// Derived directly from the same numeric `price`/`priceAnnual` fields the cards above
// format for display -- the single source of truth for checkout pricing, imported by
// App.jsx for PaymentSection instead of a second hardcoded copy of these figures (see
// App.jsx's own note on why that mattered: a price changed here and forgotten there
// would advertise one number and charge another). Basic ('Free') carries a string, not
// a number, and is intentionally absent -- App.jsx's own fallback covers it.
export const UPGRADE_PRICES = tiers.reduce((acc, tier) => {
  if (typeof tier.price !== 'number') return acc;
  acc[tier.name] = typeof tier.priceAnnual === 'number' ? { monthly: tier.price, annual: tier.priceAnnual } : { monthly: tier.price };
  return acc;
}, {});

export default function TierPricing({ currentTier, onUpgrade, onClose }) {
  // Only Pro/Ultra carry an annual option -- Basic is free, so this toggle only ever
  // changes what those two cards show.
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  // Two-tap confirm for a downgrade, in place of a window.confirm() the browser can
  // suppress. Holds the name of the tier whose downgrade is pending confirmation, or
  // null -- a string (not a boolean) so that when the user is on Ultra and BOTH the
  // Basic and Pro cards are downgrades, tapping one doesn't put the other into the
  // "tap again" state too.
  const [confirmingTier, setConfirmingTier] = useState(null);

  const isDowngrade = (tierName) => tierRank(tierName) < tierRank(currentTier);
  const ctaFor = (tierName) => `${isDowngrade(tierName) ? 'Downgrade' : 'Upgrade'} to ${tierName}`;

  const resetConfirm = () => setConfirmingTier(null);

  const handleUpgrade = (tier) => {
    // Any downgrade gets the two-tap confirm (you're giving up features either way).
    // App.jsx then branches: Basic downgrades directly (free, no payment flow),
    // anything else routes through the checkout for the target tier's price. Only pass
    // 'annual' for a tier that actually has an annual price.
    if (isDowngrade(tier.name)) {
      if (confirmingTier !== tier.name) { setConfirmingTier(tier.name); return; }
      setConfirmingTier(null);
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
            onClick={() => { setBillingPeriod('monthly'); resetConfirm(); }}
          >
            Monthly
          </button>
          <button
            className={billingPeriod === 'annual' ? 'active' : ''}
            onClick={() => { setBillingPeriod('annual'); resetConfirm(); }}
          >
            Annual <span className="save-badge">Save up to 33%</span>
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
                  className={`upgrade-btn ${currentTier === tier.name ? 'current' : ''} ${confirmingTier === tier.name ? 'confirming' : ''}`}
                  onClick={() => handleUpgrade(tier)}
                  disabled={currentTier === tier.name}
                >
                  {currentTier === tier.name
                    ? 'Active Plan'
                    : confirmingTier === tier.name
                      ? 'Tap again to confirm downgrade'
                      : ctaFor(tier.name)}
                </button>
                {confirmingTier === tier.name && (
                  <button type="button" className="downgrade-cancel-btn" onClick={resetConfirm}>
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