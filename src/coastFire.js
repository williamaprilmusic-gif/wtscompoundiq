// src/coastFire.js
// Coast FIRE: the point where the pot you've already invested, left completely alone,
// will grow to your retirement target on its own -- so any further saving becomes
// optional. A different question from powerToolsEngine.js's FIRE Number /
// yearsToReachTarget, which assume you keep contributing the whole way there.
import { calculateCompoundInterest } from './engine';
import { floorRate } from './utils/sanitize';

export const computeCoastFire = ({ currentPortfolio, annualReturn, yearsToRetirement, fireNumber }) => {
  const pot = Math.max(0, currentPortfolio || 0);
  const rate = floorRate(annualReturn);
  // Rounded so the projection (calculateCompoundInterest floors years internally) and
  // the discount-back below run over the same whole-year horizon; capped so an absurd
  // typed value can't drive Math.pow to underflow/overflow (no retirement is 150+ years).
  const safeYears = Math.max(0, Math.min(150, Math.round(yearsToRetirement || 0)));
  const target = Math.max(0, fireNumber || 0);

  // No contributions, no tax/wrapper machinery -- a plain "grow this lump sum" run,
  // the same engine the Savings Account tool uses.
  const projectedAtRetirement = calculateCompoundInterest({
    initial: pot, monthly: 0, rate, years: safeYears,
    inflation: 0, taxRate: 0, wrapper: false, compoundFrequency: 12
  }).finalBalance;

  // The lump sum needed TODAY to coast to the target: the target discounted back at the
  // same return, compounded MONTHLY to match the projection above (an annual discount
  // here disagreed with a monthly-compounded projection by ~6%). Guarded against a
  // near-total-loss rate driving the discount factor to ~0 -> Infinity.
  const monthlyGrowth = Math.pow(1 + rate / 100 / 12, safeYears * 12);
  const coastNumber = monthlyGrowth > 1e-9 && Number.isFinite(monthlyGrowth)
    ? target / monthlyGrowth
    : Infinity;

  return {
    projectedAtRetirement,
    coastNumber,
    hasCoasted: target > 0 && projectedAtRetirement >= target,
    shortfallToday: Number.isFinite(coastNumber) ? Math.max(0, coastNumber - pot) : Infinity,
    surplusAtRetirement: projectedAtRetirement - target
  };
};
