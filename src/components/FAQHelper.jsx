// src/components/FAQHelper.jsx
import React, { useState } from 'react';
import './FAQHelper.css';

// The FAQ's Power Tools coverage: one overview entry plus one entry per tool. The
// per-tool entries are generated from the POWER_TOOLS table below so the copy stays in
// one place and every tool is individually searchable ("VAT", "sequence risk", ...).
// Tuple: [name, category, answer, extraKeywords[], isUltra]. Keep in step with
// PowerTools.jsx's SUB_TABS.
const PT_CATEGORY_KEYWORDS = {
  'Retire & Financial Independence': ['retirement', 'retire', 'financial independence', 'fire'],
  'Debt & Credit': ['debt', 'credit', 'borrowing', 'loan'],
  'Property & Big Purchases': ['property', 'home', 'house', 'car', 'big purchase'],
  'Saving for a Goal': ['saving', 'savings goal', 'save for'],
  'Income & Tax': ['income', 'tax', 'sars', 'salary', 'pay'],
  'Money Basics': ['money basics', 'fundamentals', 'concept']
};

const POWER_TOOLS = [
  // --- Retire & Financial Independence ---
  ['FIRE Number', 'Retire & Financial Independence', 'Works out the pot you need to retire on — your annual spending divided by a safe withdrawal rate (usually 4%) — and, from your monthly saving and expected return, how many years until you get there.', ['retire early', 'fi number'], false],
  ['Coast FIRE', 'Retire & Financial Independence', 'Tells you whether what you have already invested will grow to your retirement number on its own, with no further contributions — the point where you could "coast" and just cover today\'s expenses.', ['coast'], true],
  ['Barista FIRE', 'Retire & Financial Independence', 'If you will keep some part-time or lower-stress income, your investments only need to cover the shortfall — this works out the smaller pot that requires.', ['barista', 'part-time'], true],
  ['Savings Rate → Years to FI', 'Retire & Financial Independence', 'Shows how the number of years to financial independence follows almost entirely from the percentage of your take-home pay you save, not from how much you earn.', ['savings rate', 'shockingly simple'], false],
  ['Drawdown', 'Retire & Financial Independence', 'Simulates the retirement phase: you stop contributing and draw a rising income each year — does the pot survive the full period, or run dry early?', ['drawdown', 'decumulation', 'withdrawals'], true],
  ['Pre-Tax Retirement', 'Retire & Financial Independence', 'Shows why a contribution to a pre-tax retirement fund costs less out of pocket (you get your marginal rate back) and compounds in full, not just the after-tax slice.', ['pre-tax', 'pension', 'provident'], true],
  ['Dividend / Passive Income', 'Retire & Financial Independence', 'Works out how large a portfolio you would need to live off its dividend yield without ever selling capital, and what your current holdings already pay.', ['dividend', 'passive income', 'yield'], false],
  ['Fee Drag', 'Retire & Financial Independence', 'Shows how a seemingly small annual fund fee compounds over decades into a large share of the final pot, measured against a zero-fee ideal.', ['fee drag', 'ter', 'costs'], false],
  ['Fund Fee Face-off', 'Retire & Financial Independence', 'Puts two specific funds head to head over your contribution schedule so you can see the rand gap a half-percent fee difference opens up over time.', ['fund fees', 'fund comparison', 'ter'], false],
  ['Retirement Income Gap', 'Retire & Financial Independence', 'You have a target pot in mind; at your withdrawal rate, does the income it produces cover your planned spending — and if not, how long to close the gap?', ['income gap', 'retirement shortfall'], true],
  ['Sequence-of-Returns Risk', 'Retire & Financial Independence', 'Two retirees with the same average return end up very differently if one hits a bad run early while the pot is largest — this shows how much that timing alone changes how long the money lasts.', ['sequence risk', 'sequence of returns', 'bad run'], true],
  ['Two-Pot Withdrawal', 'Retire & Financial Independence', 'Shows the true cost of dipping into the two-pot retirement savings pot early: marginal-rate tax now, plus everything that amount would have compounded to by retirement. Flags the R2,000 minimum and the once-per-tax-year rule.', ['two-pot', 'two pot', 'savings pot', 'early withdrawal'], true],

  // --- Debt & Credit ---
  ['Debt vs. Invest', 'Debt & Credit', 'You have spare cash each month — should it go to debt or investments? Gives a tax-aware verdict plus a side-by-side projection of both paths over your timeframe.', ['debt vs invest', 'pay off or invest'], false],
  ['Debt-to-Income', 'Debt & Credit', 'Calculates the share of your gross income already committed to debt repayments — the ratio a lender checks before approving new credit.', ['dti', 'debt to income'], false],
  ['Credit Card Minimum-Payment Trap', 'Debt & Credit', 'Shows how paying only a credit card\'s minimum — which shrinks as the balance does — can stretch payoff over decades, versus holding a fixed payment.', ['card trap', 'minimum payment', 'credit card'], false],
  ['Debt Consolidation', 'Debt & Credit', 'Compares keeping your debts as they are against rolling them into one new loan, which can lower the rate and free up cash flow, or simply stretch the term and cost more overall.', ['consolidation', 'consolidate debt'], false],
  ['Loan Offer Comparison', 'Debt & Credit', 'Two offers for the same loan amount, compared on total cost once the term and every fee are counted — not just the headline rate.', ['loan compare', 'loan offer', 'compare loans'], false],
  ['Cash vs. Finance', 'Debt & Credit', 'You are buying the item regardless: paying cash gives up the growth that money would have earned, financing costs interest but keeps the cash invested. Compares your end wealth either way.', ['cash or finance', 'pay cash'], false],

  // --- Property & Big Purchases ---
  ['Home Affordability', 'Property & Big Purchases', 'Given your income and existing debt repayments, estimates the bond and property price you can realistically afford.', ['bond affordability', 'how much house'], false],
  ['Rent vs. Buy', 'Property & Big Purchases', 'For a specific home, compares buying it against renting and investing the difference, over your chosen number of years.', ['rent or buy', 'renting vs buying'], false],
  ['True Cost of Car Ownership', 'Property & Big Purchases', 'The real cost of owning a car over the years you keep it — depreciation, finance interest and running costs — not just the purchase price.', ['cost of a car', 'car ownership', 'depreciation'], false],
  ['Lease vs. Buy a Car', 'Property & Big Purchases', 'Over the same period, buying costs depreciation plus interest but leaves you owning the residual value; leasing costs the payments and leaves nothing. Shows both.', ['lease or buy', 'car lease'], false],
  ['Deposit Savings Timeline', 'Property & Big Purchases', 'How long until you have saved a home deposit, given what you can put aside each month and a modest interest rate on the balance.', ['deposit timeline', 'save a deposit'], false],
  ['Home Buying — Upfront Costs', 'Property & Big Purchases', 'The upfront cash you need beyond the deposit — transfer duty, transferring and bond attorneys, and the deeds office — which a bond calculator never shows.', ['home buying costs', 'transfer duty', 'attorney fees'], false],
  ['Big-Purchase Payback', 'Property & Big Purchases', 'For a cost now that saves money each month (solar, a heat pump, a borehole, prepaying an annual plan), works out when it breaks even and whether investing the cash would beat it.', ['payback', 'solar', 'break even'], false],
  ['Interest-Rate Shock on a Bond', 'Property & Big Purchases', 'What your bond repayment does if the interest rate moves up or down — the "what if the Reserve Bank hikes" view, across a range of rate changes.', ['rate shock', 'interest rate rise', 'repo rate'], false],

  // --- Saving for a Goal ---
  ['Savings Account Interest', 'Saving for a Goal', 'The plain question: how much interest a lump sum earns just sitting in a savings account and compounding, with no monthly deposits.', ['savings account', 'lump sum interest'], false],
  ['Education Savings', 'Saving for a Goal', 'Education costs usually rise faster than general inflation; this projects a realistic future cost across every year of study and the monthly amount to save for it.', ['education', 'school fees', 'university', 'tuition'], false],
  ['Sinking Fund', 'Saving for a Goal', 'A known expense on a known date — a car, a wedding, next year\'s school fees — and the monthly amount to have it ready, saving at a modest rate rather than investing.', ['sinking fund', 'save for a goal'], false],
  ['Emergency Fund Runway', 'Saving for a Goal', 'If your income stopped today, how many full months your current emergency savings would actually cover.', ['runway', 'emergency fund months', 'how long would savings last'], false],
  ['Insurance Needs (Life Cover Gap)', 'Saving for a Goal', 'A needs-based estimate of how much life cover would protect your dependents — the maths behind a quote, not a quote itself.', ['insurance needs', 'life cover', 'cover gap'], false],
  ['Windfall / Bonus Split', 'Saving for a Goal', 'Takes a lump sum (bonus, tax refund, inheritance) and splits it down the conventional priority order: emergency fund, then expensive debt, then tax-advantaged room, then invested.', ['windfall', 'bonus split', 'lump sum', 'inheritance'], false],

  // --- Income & Tax ---
  ['Take-Home Pay', 'Income & Tax', 'What a gross annual salary actually works out to after tax — monthly, in your pocket.', ['take home', 'net salary', 'after tax'], false],
  ['Lifetime Value of a Pay Rise', 'Income & Tax', 'A raise is worth more than "the amount times years left" — each future percentage raise builds on the higher base. Shows the true lifetime value, and what the after-tax difference could grow to if invested.', ['value of a raise', 'pay rise', 'salary increase'], false],
  ['Bonus / 13th Cheque Take-Home', 'Income & Tax', 'A bonus or 13th cheque sits on top of your salary, so it is taxed entirely at your marginal rate. Shows how much actually lands in your account.', ['bonus tax', '13th cheque', 'thirteenth cheque'], false],
  ['Retirement Annuity Tax Optimizer', 'Income & Tax', 'South Africa lets you deduct retirement-fund contributions up to 27.5% of income, capped at R350,000/year. Works out how much more you could contribute to reach that ceiling and the tax effectively refunded.', ['ra optimizer', 'retirement annuity', '27.5%', 'deduction'], true],
  ['Contractor / Freelance Rate', 'Income & Tax', 'Going independent means no paid leave, no benefits, your own tax, and unbillable hours — this works a target take-home back up into the rate you would need to charge.', ['contractor rate', 'freelance rate', 'day rate'], false],
  ['Capital Gains Tax', 'Income & Tax', 'In South Africa the gain on a disposal, less the annual exclusion, gets a 40% inclusion rate and is then taxed at your marginal rate on top of other income. Works out the actual tax — it is not a separate flat rate.', ['cgt', 'capital gains'], false],
  ['50/30/20 Budget Check', 'Income & Tax', 'Compares your spending against the rule of thumb: roughly half of take-home to needs, a third to wants, a fifth to saving and extra debt paydown.', ['50/30/20', 'budget rule', 'needs wants savings'], false],
  ['Marginal Tax Rate & Deduction Value', 'Income & Tax', 'What the next rand you earn actually keeps after tax, and what a deductible contribution (retirement annuity, donation) saves you this year.', ['marginal tax rate', 'tax bracket', 'deduction value'], false],
  ['Raise Needed to Beat Inflation', 'Income & Tax', 'A pay rise below inflation is a pay cut in real terms. Shows the break-even raise and what a given offer is actually worth once inflation is taken out.', ['beat inflation', 'real raise', 'inflation raise'], false],

  // --- Money Basics ---
  ['Future Cost of Living', 'Money Basics', 'What a cost in today\'s money will be after years of inflation, and what today\'s money will be worth by comparison.', ['future cost', 'cost of living', 'inflation cost'], false],
  ['Rule of 72', 'Money Basics', 'The mental-maths shortcut: divide 72 by your return to estimate how many years an amount takes to double, shown against the exact figure.', ['rule of 72', 'doubling time'], false],
  ['Compounding Frequency Comparison', 'Money Basics', 'Same money, same rate, same term — how much difference it makes whether interest is credited once a year or every day.', ['compounding frequency', 'daily vs annual', 'how often interest'], false],
  ['Nominal vs. Effective Annual Rate', 'Money Basics', 'A rate quoted "per year, compounded monthly" is not what you actually earn or pay; the intra-year compounding makes the effective annual rate higher. Shows both.', ['effective rate', 'nominal rate', 'apr', 'aer'], false],
  ['Real (After-Tax, After-Inflation) Return', 'Money Basics', 'A headline return is not what your money really earns. Takes tax off the gains and divides out inflation to show what is actually growing your purchasing power.', ['real return', 'after inflation return'], false],
  ['What a Subscription Really Costs', 'Money Basics', 'A small monthly charge is an annual cost that creeps up with inflation — and every rand of it is a rand not compounding elsewhere. Shows both over time.', ['subscription cost', 'recurring charge'], false],
  ['VAT / Sales Tax Calculator', 'Money Basics', 'Add VAT to a price, or pull it back out of a VAT-inclusive total — two different calculations, since the rate applies to the exclusive amount, not the inclusive one.', ['vat', 'sales tax', 'add vat', 'remove vat'], false]
];

const slugWords = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);

const POWER_TOOL_FAQS = [
  {
    question: 'What are the Power Tools?',
    answer: 'A Pro-tier tab of 48 focused, single-purpose calculators — each answers one specific question using the same South African tax rules and compounding engine as the main Calculator. They are grouped into six categories: Retire & Financial Independence, Debt & Credit, Property & Big Purchases, Saving for a Goal, Income & Tax, and Money Basics. There is a separate FAQ entry ("Power Tool — …") explaining each one; 8 of them need the Ultra plan, the rest come with Pro.',
    keywords: ['power tools', 'powertools', 'power tool', 'calculators', 'tools', 'list', 'all tools', 'what does each']
  },
  ...POWER_TOOLS.map(([name, category, answer, extra, isUltra]) => ({
    question: `Power Tool — ${name}`,
    answer: `${answer} ${isUltra ? 'Category: ' + category + '. Requires the Ultra plan.' : 'Category: ' + category + '. Included with Pro.'}`,
    keywords: [
      'power tools', 'power tool',
      ...slugWords(name),
      ...(extra || []),
      ...(PT_CATEGORY_KEYWORDS[category] || []),
      ...(isUltra ? ['ultra'] : [])
    ]
  }))
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
