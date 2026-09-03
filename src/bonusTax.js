// src/bonusTax.js
// How much of a bonus / 13th cheque / commission you actually keep. A lump sum on top
// of a salary is taxed entirely at your MARGINAL rate -- the rate on your top slice of
// income -- so "it felt like half of it vanished" is often close to true. Reuses
// engine.js's bracket math; falls back to the flat country rate where brackets aren't
// modelled, the same split the Calculator's progressive-tax toggle uses.
import { taxOwedAtBrackets } from './engine';

export const bonusTakeHome = ({ annualSalary, bonusAmount, taxRate = 0, taxBrackets = null }) => {
  const salary = Math.max(0, annualSalary || 0);
  const bonus = Math.max(0, bonusAmount || 0);
  if (bonus === 0) {
    return { taxOnBonus: 0, netBonus: 0, marginalRatePct: 0, keepPct: 100, averageRateOnBonusPct: 0 };
  }

  let taxOnBonus;
  if (taxBrackets && taxBrackets.length) {
    // Extra tax from stacking the bonus on top of salary = its true marginal cost.
    taxOnBonus = taxOwedAtBrackets(salary + bonus, taxBrackets) - taxOwedAtBrackets(salary, taxBrackets);
  } else {
    taxOnBonus = bonus * (Math.max(0, taxRate) / 100);
  }
  taxOnBonus = Math.max(0, Math.min(taxOnBonus, bonus));

  // The rate on the very next rand earned -- what a slightly bigger bonus would be hit at.
  let marginalRatePct;
  if (taxBrackets && taxBrackets.length) {
    const step = 100;
    marginalRatePct = ((taxOwedAtBrackets(salary + bonus + step, taxBrackets)
      - taxOwedAtBrackets(salary + bonus, taxBrackets)) / step) * 100;
  } else {
    marginalRatePct = Math.max(0, taxRate);
  }

  const netBonus = bonus - taxOnBonus;
  return {
    taxOnBonus,
    netBonus,
    marginalRatePct,
    keepPct: (netBonus / bonus) * 100,
    averageRateOnBonusPct: (taxOnBonus / bonus) * 100
  };
};
