// src/sequenceRisk.js
// Sequence-of-returns risk, shown deterministically. Two retirees earn the SAME average
// return over retirement, but one hits a run of bad years early (while the pot is
// largest and being drawn down) and the other hits them late. This runs both orders
// against the same starting pot and inflation-linked withdrawal and reports how many
// years each pot lasts -- the gap is the risk that a good average return hides.
//
// Distinct from Monte Carlo (which randomises every path): here the years are a fixed,
// user-legible scenario -- "your first N years average `badReturn`, the rest average
// `goodReturn`" -- so the mechanism is visible rather than statistical.

const MAX_YEARS = 100;

// Runs one ordered list of annual returns against the pot, withdrawing an
// inflation-escalated amount at the start of each year. Returns the number of full
// years survived (pot stays >= 0 through the year) and the ending balance.
const runSequence = ({ startingPot, firstYearWithdrawal, inflationPct, returnsByYear }) => {
  let pot = Math.max(0, startingPot || 0);
  const infl = 1 + Math.max(-99, inflationPct || 0) / 100;
  let withdrawal = Math.max(0, firstYearWithdrawal || 0);
  let survived = 0;
  for (let y = 0; y < returnsByYear.length && y < MAX_YEARS; y++) {
    pot -= withdrawal;
    if (pot <= 0) return { yearsLasted: survived, endingBalance: 0, depleted: true };
    pot *= 1 + returnsByYear[y] / 100;
    withdrawal *= infl;
    survived += 1;
  }
  return { yearsLasted: survived, endingBalance: pot, depleted: pot <= 0 };
};

export const analyseSequenceRisk = ({
  startingPot, annualWithdrawal, retirementYears,
  averageReturn, badReturn, badYears, inflationPct = 0
}) => {
  const years = Math.max(1, Math.min(MAX_YEARS, Math.round(retirementYears || 0)));
  const nBad = Math.max(0, Math.min(years, Math.round(badYears || 0)));
  const avg = averageReturn || 0;
  const bad = badReturn != null ? badReturn : Math.min(avg - 10, avg);

  // Solve the "good" years' return so the arithmetic mean across all `years` equals
  // `avg` -- that's what makes this a fair comparison rather than two different plans.
  const good = nBad >= years ? bad : (avg * years - bad * nBad) / (years - nBad);

  const badFirst = Array.from({ length: years }, (_, i) => (i < nBad ? bad : good));
  const badLast = Array.from({ length: years }, (_, i) => (i >= years - nBad ? bad : good));

  const shared = { startingPot, firstYearWithdrawal: annualWithdrawal, inflationPct };
  const early = runSequence({ ...shared, returnsByYear: badFirst });
  const late = runSequence({ ...shared, returnsByYear: badLast });

  return {
    goodYearReturn: good,
    badYearReturn: bad,
    earlyLosses: early,   // bad years first -- the dangerous order
    lateLosses: late,     // bad years last
    yearsGap: late.yearsLasted - early.yearsLasted, // how many more years the lucky order buys
    bothSurvive: !early.depleted && !late.depleted,
    horizonYears: years
  };
};
