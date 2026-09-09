// src/components/FAQHelper.jsx
import React, { useState } from 'react';
import './FAQHelper.css';

// One entry per Power Tools category (matching the SUB_TAB_GROUPS in PowerTools.jsx),
// each listing every tool in that category with a one-line explanation. `bullets` is
// rendered as a list under `answer`; tools tagged "(Ultra)" need an Ultra plan, the
// rest are included with Pro. Kept as its own array so the tool rundown stays easy to
// find and update alongside PowerTools.jsx.
const POWER_TOOL_FAQS = [
  {
    question: 'What are the Power Tools, and how are they organised?',
    answer: 'Power Tools is a Pro-tier tab holding 48 focused, single-purpose calculators -- each answers one specific question using the same South African tax rules and compounding engine as the main Calculator. They are grouped into six categories: Retire & Financial Independence, Debt & Credit, Property & Big Purchases, Saving for a Goal, Income & Tax, and Money Basics. The FAQ entries below explain every tool, category by category. Tools marked "(Ultra)" need an Ultra plan; the rest come with Pro.',
    keywords: ['power tools', 'powertools', 'power tool', 'calculators', 'tools', 'list', 'explain', 'what does', 'all tools']
  },
  {
    question: 'Power Tools — Retire & Financial Independence: what each tool does',
    answer: 'Tools for sizing a retirement pot, deciding when you can ease off, and stress-testing the drawdown years.',
    bullets: [
      'FIRE Number — how big a pot you need to retire on, and how many years until you reach it.',
      'Coast FIRE (Ultra) — whether you have already saved enough that you could stop contributing and still hit your number on growth alone.',
      'Barista FIRE (Ultra) — the smaller pot you need when some part-time or lower-stress income will cover part of your spending.',
      'Savings Rate → Years to FI — how the fraction of your pay you keep, far more than how much you earn, sets the years to independence.',
      'Drawdown (Ultra) — once you stop contributing and start withdrawing, whether the pot actually lasts.',
      'Pre-Tax Retirement (Ultra) — how money into a pre-tax retirement account costs less out of pocket and compounds in full, not just the after-tax slice.',
      'Dividend / Passive Income — the portfolio size it takes to live off the yield without ever selling the capital.',
      'Fee Drag — how a small yearly fee quietly takes a large slice of the final pot over decades.',
      'Fund Fee Face-off — two specific funds compared head to head over your contribution schedule.',
      'Retirement Income Gap (Ultra) — at your withdrawal rate, whether the income your target pot throws off covers what you want to spend.',
      'Sequence Risk (Ultra) — how a bad run of returns early in retirement, at the same average return, changes how long the money lasts.',
      'Two-Pot Withdrawal (Ultra) — the double cost of dipping into the two-pot savings pot: marginal-rate tax now, plus everything it would have compounded to.'
    ],
    keywords: ['power tools', 'fire', 'coast fire', 'barista fire', 'drawdown', 'retirement', 'financial independence', 'savings rate', 'dividend', 'passive income', 'fee drag', 'fund fees', 'income gap', 'sequence risk', 'two-pot', 'two pot', 'pre-tax']
  },
  {
    question: 'Power Tools — Debt & Credit: what each tool does',
    answer: 'Tools for weighing debt against investing, seeing what lenders see, and comparing ways to borrow or repay.',
    bullets: [
      'Debt vs. Invest — spare cash each month: pay down debt or invest it? A tax-aware verdict plus a side-by-side projection of both paths.',
      'Debt-to-Income — the share of your gross income already going to debt repayments, the metric a lender checks before new borrowing.',
      'Card Min. Trap — how paying only a credit card\'s shrinking minimum can stretch payoff over decades, and what a fixed payment does instead.',
      'Debt Consolidation — keeping several debts as they are versus rolling them into one loan that may lower the rate or just stretch the term.',
      'Loan Offer Compare — two offers for the same amount, compared on what they actually cost once term and every fee are counted.',
      'Cash vs. Finance — you are buying the thing regardless: paying cash gives up the growth that cash would have earned, financing costs interest but keeps the cash invested. Compares your wealth at the end either way.'
    ],
    keywords: ['power tools', 'debt', 'credit', 'debt vs invest', 'debt-to-income', 'dti', 'credit card', 'minimum payment', 'consolidation', 'loan compare', 'cash vs finance']
  },
  {
    question: 'Power Tools — Property & Big Purchases: what each tool does',
    answer: 'Tools for the numbers behind a home or vehicle decision, and any large one-off spend.',
    bullets: [
      'Home Affordability — given your income and existing debt repayments, how much home you can actually afford.',
      'Rent vs. Buy — for a specific home, whether buying beats renting and investing the difference over your timeframe.',
      'Cost of a Car — the real cost of ownership once depreciation, finance interest and running costs are counted, not just the sticker price.',
      'Lease vs. Buy — over the same period: buying costs depreciation plus interest but leaves you owning the residual; leasing costs the payments and leaves you nothing.',
      'Deposit Timeline — how long to save a home deposit given what you put away each month and a modest savings rate on the balance.',
      'Home Buying Costs — the cash needed on the day beyond the deposit: transfer duty, transferring and bond attorneys, and the deeds office.',
      'Big-Purchase Payback — for a cost now that saves money each month (solar, a borehole, prepaying an annual plan), when it breaks even and whether investing the cash would have beaten it.',
      'Rate Shock — what your bond repayment does if the interest rate moves, the "what if the Reserve Bank hikes" view the Loan & Bond tab does not show.'
    ],
    keywords: ['power tools', 'property', 'home', 'bond', 'affordability', 'rent vs buy', 'car', 'vehicle', 'lease vs buy', 'deposit', 'transfer duty', 'buying costs', 'payback', 'solar', 'rate shock']
  },
  {
    question: 'Power Tools — Saving for a Goal: what each tool does',
    answer: 'Tools for working out the monthly amount behind a specific target.',
    bullets: [
      'Savings Account — the interest a lump sum earns just sitting and compounding, with no monthly deposits.',
      'Education Savings — projects fast-rising study costs across every year of study, then the monthly saving needed to cover them.',
      'Sinking Fund — the monthly amount to have a known expense (a car, a wedding, school fees) ready by a known date, saving at a modest rate.',
      'Fund Runway — how many full months your saved emergency fund would actually cover if your income stopped today.',
      'Insurance Needs — a needs-based estimate of how much life cover would protect your dependents; the maths behind a quote, not a quote.',
      'Windfall Split — a lump sum (bonus, tax refund, inheritance) split down the conventional priority order: emergency fund, then expensive debt, then tax-advantaged room, then the rest invested.'
    ],
    keywords: ['power tools', 'saving', 'goal', 'savings account', 'education', 'school fees', 'sinking fund', 'emergency fund', 'runway', 'insurance', 'life cover', 'windfall', 'bonus split']
  },
  {
    question: 'Power Tools — Income & Tax: what each tool does',
    answer: 'Tools for what you actually keep after SARS, and how pay and deductions change that.',
    bullets: [
      'Take-Home Pay — what a gross annual income works out to after tax, monthly, in your pocket.',
      'Value of a Raise — a raise\'s true lifetime worth once every future percentage raise stacks on the higher base and the after-tax difference is invested.',
      'Bonus Take-Home — how much of a bonus or 13th cheque actually lands, taxed entirely at your marginal rate.',
      'RA Tax Optimizer (Ultra) — how much more you could put into a retirement annuity to reach the 27.5%-of-income / R350,000 deduction ceiling, and the tax effectively refunded on it.',
      'Contractor Rate — the rate you would need to charge as an independent to match a target take-home, allowing for lost leave, benefits, own tax, and unbillable hours.',
      'Capital Gains Tax — South African CGT: the gain less the annual exclusion, at a 40% inclusion rate, then taxed at your marginal rate on top of other income (not a separate flat rate).',
      '50/30/20 Check — how your take-home splits across needs, wants, and saving / extra debt paydown, against the rule of thumb.',
      'Marginal Tax Rate — what the next rand you earn actually keeps, and what a deductible contribution saves you this year.',
      'Beat Inflation — the break-even pay rise that keeps you level in real terms, and what an offer below it is really worth.'
    ],
    keywords: ['power tools', 'income', 'tax', 'take-home', 'salary', 'raise', 'bonus', '13th cheque', 'ra optimizer', 'retirement annuity', 'contractor', 'freelance', 'capital gains', 'cgt', '50/30/20', 'marginal tax', 'inflation', 'sars']
  },
  {
    question: 'Power Tools — Money Basics: what each tool does',
    answer: 'Short tools for the core ideas the rest of the app leans on.',
    bullets: [
      'Future Cost — what a today\'s-money cost becomes after years of inflation, and what today\'s money is worth by comparison.',
      'Rule of 72 — the divide-72-by-your-return shortcut for how long an amount takes to double, shown against the exact figure.',
      'Compounding Frequency — how much it matters whether interest is credited once a year or every day, at the same money and rate.',
      'Effective Rate — why a rate quoted "per year, compounded monthly" earns or costs more than its nominal figure.',
      'Real Return — a headline return after tax and after inflation: what is actually growing your purchasing power.',
      'Subscription Cost — a small monthly charge seen as an inflation-creeping annual cost, and the compounding that rand is not doing elsewhere.',
      'VAT Calculator — adding VAT to a price versus pulling it back out of a VAT-inclusive total (not the same calculation).'
    ],
    keywords: ['power tools', 'basics', 'future cost', 'rule of 72', 'doubling', 'compounding frequency', 'effective rate', 'nominal', 'real return', 'subscription', 'vat', 'sales tax']
  }
];

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
    answer: 'They are indicative simplifications for education, not verified current tax law. South Africa\'s tax system is reduced to a flat approximate rate (with an opt-in progressive-bracket mode) and the TFSA wrapper, and real tax rules have thresholds, rebates, and change yearly. Do not treat this as your only source before making real financial decisions.',
    keywords: ['accurate', 'accuracy', 'correct', 'real', 'tax rate', 'reliable', 'trust']
  },
  {
    question: 'What is the difference between Basic, Pro, and Ultra?',
    answer: 'Basic is free and covers Start Here and the Calculator (South African tax rules, TFSA wrapper comparison). Pro unlocks the full planning toolkit: Budget tracker, Emergency Fund tracker, Debt Payoff planner, My Plan (with reminders), multi-goal Invest planner, Tax Optimizer, Power Tools, Net Worth tracker, Dashboard, Financial Snapshot export, and plan comparison. Ultra adds the Monte Carlo simulator, a Net Worth FX stress test, the AI Wealth Coach and AI Investment Advisor, plus white-label / branded plan exports with your own compliance line, FSP number, and plan notes.',
    keywords: ['tier', 'plan', 'basic', 'pro', 'ultra', 'difference', 'compare plans', 'free']
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
    question: 'Is this only for South Africa?',
    answer: 'Yes -- this app models South African tax rules and the TFSA wrapper specifically. If you hold offshore/foreign-currency assets, the Net Worth tracker still lets you enter items in another currency and see them converted to Rand, and its FX Stress Test shows how a Rand move affects your total.',
    keywords: ['country', 'countries', 'supported', 'south africa', 'currency', 'offshore']
  },
  ...POWER_TOOL_FAQS
];

const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'my', 'to', 'of', 'for', 'and', 'in', 'on', 'can', 'how', 'what', 'this']);

const tokenize = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOPWORDS.has(w));

const scoreEntry = (entry, queryTokens) => {
  const haystack = tokenize(`${entry.question} ${entry.answer} ${(entry.bullets || []).join(' ')} ${entry.keywords.join(' ')}`);
  let score = 0;
  for (const qToken of queryTokens) {
    if (entry.keywords.some(k => k.toLowerCase().includes(qToken))) score += 3;
    if (tokenize(entry.question).some(t => t.includes(qToken) || qToken.includes(t))) score += 2;
    if (haystack.some(t => t.includes(qToken))) score += 1;
  }
  return score;
};

// Shared answer body -- a paragraph, plus a bullet list when the entry carries one.
const FAQAnswer = ({ entry, className = 'faq-item-answer' }) => (
  <>
    <p className={className}>{entry.answer}</p>
    {entry.bullets && (
      <ul className="faq-item-bullets">
        {entry.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    )}
  </>
);

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
                  <FAQAnswer entry={entry} className="faq-match-answer" />
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
            {openIndex === index && <FAQAnswer entry={entry} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQHelper;
