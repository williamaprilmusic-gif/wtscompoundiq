// src/raiseValue.js
// The long-run value of a single pay rise: future percentage raises stack on top of
// the higher base, so a bump now is worth far more than "amount x years", and the
// after-tax difference can be invested year by year.
export const lifetimeRaiseValue = ({ raiseAmount, annualRaisePercent = 0, yearsRemaining, marginalTaxRate = 0, investReturn = 0 }) => {
  const bump = Math.max(0, raiseAmount || 0);
  const years = Math.max(0, yearsRemaining || 0);
  const grow = 1 + Math.max(0, annualRaisePercent || 0) / 100;
  const afterTaxFactor = 1 - Math.max(0, Math.min(marginalTaxRate || 0, 100)) / 100;
  const r = Math.max(0, investReturn || 0) / 100;

  let cumulativeGross = 0;
  let investedValue = 0;
  let yearBump = bump;
  for (let y = 0; y < years; y++) {
    cumulativeGross += yearBump;
    investedValue = investedValue * (1 + r) + yearBump * afterTaxFactor;
    yearBump *= grow;
  }

  return {
    cumulativeGross,
    cumulativeAfterTax: cumulativeGross * afterTaxFactor,
    investedValue
  };
};
