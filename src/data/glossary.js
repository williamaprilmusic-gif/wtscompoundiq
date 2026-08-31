// src/data/glossary.js
// Plain-English, no-jargon definitions for the financial terms used across the app.
// Kept deliberately short (one or two sentences) -- these are tooltips, not articles.
export const GLOSSARY = {
  compounding: "Earning interest on your interest, not just on your original money. The longer you leave it, the faster it snowballs.",
  compoundingFrequency: "How often your interest gets added to your balance -- daily, monthly, etc. More often means slightly faster growth, because each add-on starts earning its own interest sooner.",
  wrapper: "A special type of account your government lets you use to grow money without paying tax on the gains, usually up to a yearly limit.",
  realValue: "What your money will actually be able to buy in the future, after accounting for rising prices (inflation). A bigger number later isn't worth as much if prices went up too.",
  inflation: "The general rise in prices over time, which quietly shrinks what your money can buy if it isn't growing faster than prices are rising.",
  capitalGainsTax: "Tax you pay on the profit when you sell an investment for more than you paid for it.",
  taxLossHarvesting: "Selling an investment that's currently down, on purpose, so the loss can offset tax you owe on gains elsewhere.",
  assetLocation: "Putting different types of investments in the account type where they're taxed the least -- not to be confused with which investments to pick.",
  fireNumber: "The amount of savings/investments you'd need so that living off it (without ever running out) lets you stop relying on a paycheck.",
  safeWithdrawalRate: "The percentage of your savings you could spend each year in retirement with a low risk of running out of money -- 4% is the commonly-cited rule of thumb.",
  avalanche: "A debt payoff strategy: always throw extra money at whichever debt has the highest interest rate first. Mathematically saves the most money.",
  snowball: "A debt payoff strategy: always throw extra money at whichever debt has the smallest balance first. Clears debts faster, which keeps people motivated even though it can cost more interest overall.",
  netWorth: "Everything you own, added up, minus everything you owe. The single number that best sums up your overall financial position.",
  emergencyFund: "Cash set aside for a genuine surprise (job loss, medical bill, car repair) so you don't need to sell investments or borrow money when life happens.",
  percentile: "A way of showing a range of possible outcomes instead of one guess. The '10th percentile' result is worse than 90% of simulated outcomes; the '90th percentile' is better than 90% of them.",
  volatility: "How much an investment's returns bounce around from year to year. Higher volatility means bigger swings, both up and down.",
  monteCarloSimulation: "Running the same plan through thousands of randomly-varied possible futures, to see a realistic range of outcomes instead of pretending returns are perfectly smooth every year.",
  fxConversion: "Turning an amount in one currency into another using an exchange rate, so figures in different currencies can be compared fairly.",
  contributionIncrease: "How much your monthly contribution grows every year, e.g. to keep pace with a raise or cost-of-living increase. 0% means you contribute the same fixed amount every year.",
  bond: "South African term for a home loan/mortgage -- money a bank lends you to buy property, secured against the property itself, paid back in fixed installments over a long term (often 20-30 years).",
  amortization: "The process of paying off a loan through regular fixed payments, where each payment covers that period's interest first and whatever's left over reduces the principal. Early payments are mostly interest; later payments are mostly principal.",
  transferDuty: "A one-off tax paid by the buyer when property changes hands (South Africa) -- separate from the bond itself, calculated on the purchase price using a bracketed scale.",
  lifeCoverGap: "The difference between how much life insurance cover a family would need to stay financially secure if the insured person died, and how much cover (plus savings) is already in place."
};
