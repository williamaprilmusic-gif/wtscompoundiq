// src/coastFire.js
// Coast FIRE: the point where the pot you've already invested, left completely alone,
// will grow to your retirement target on its own -- so any further saving becomes
// optional. A different question from powerToolsEngine.js's FIRE Number /
// yearsToReachTarget, which assume you keep contributing the whole way there.
import { calculateCompoundInterest } from './engine';

export const computeCoastFire = ({ currentPortfolio, annualReturn, yearsToRetirement, fireNumber }) => {
  const pot = Math.max(0, currentPortfolio || 0);
  const rate = annualReturn || 0;
  const safeYears = Math.max(0, yearsToRetirement || 0);
  const target = Math.max(0, fireNumber || 0);

  // No contributions, no tax/wrapper machinery -- a plain "grow this lump sum" run,
  // the same engine the Savings Account tool uses.
  const projectedAtRetirement = calculateCompoundInterest({
    initial: pot, monthly: 0, rate, years: safeYears,
    inflation: 0, taxRate: 0, wrapper: false, compoundFrequency: 12
  }).finalBalance;

  // The lump sum needed TODAY to coast to the target: the target discounted back at
  // the same return.
  const coastNumber = target / Math.pow(1 + rate / 100, safeYears);

  return {
    projectedAtRetirement,
    coastNumber,
    hasCoasted: target > 0 && projectedAtRetirement >= target,
    shortfallToday: Math.max(0, coastNumber - pot),
    surplusAtRetirement: projectedAtRetirement - target
  };
};
