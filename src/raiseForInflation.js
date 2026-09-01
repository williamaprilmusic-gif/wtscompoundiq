// src/raiseForInflation.js
// The raise needed just to stand still: at a given inflation rate, a salary has to rise
// by that much to hold its purchasing power. Also shows what a specific offered raise
// is actually worth in real terms once inflation is taken out.
export const raiseForInflation = ({ currentSalary, inflationRate, offeredRaisePercent = 0 }) => {
  const salary = Math.max(0, currentSalary || 0);
  const inf = inflationRate || 0;
  const offered = offeredRaisePercent || 0;

  const breakEvenRaiseAmount = salary * (inf / 100);
  const newNominal = salary * (1 + offered / 100);
  const newReal = inf > -100 ? newNominal / (1 + inf / 100) : newNominal;
  const realChangePercent = salary > 0 ? ((newReal - salary) / salary) * 100 : 0;

  return {
    breakEvenRaisePercent: inf,
    breakEvenRaiseAmount,
    newNominal,
    realSalaryAfterOffer: newReal,
    realChangePercent,
    beatsInflation: offered > inf
  };
};
