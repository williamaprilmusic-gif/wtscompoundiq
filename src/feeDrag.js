// src/feeDrag.js
// What an annual investment fee actually costs over a long horizon: the same
// contribution plan run at the gross return vs the return minus the fee, and the gap
// as both a rand figure and a share of the fee-free final pot. Reuses the app's
// compounding engine so it lines up with the Calculator tab.
import { calculateCompoundInterest } from './engine';

export const feeDragAnalysis = ({ initial, monthly, grossReturn, feePercent, years }) => {
  const common = {
    initial: Math.max(0, initial || 0),
    monthly: Math.max(0, monthly || 0),
    years: Math.max(0, years || 0),
    inflation: 0, taxRate: 0, wrapper: true, compoundFrequency: 12
  };
  const fee = Math.max(0, feePercent || 0);
  const gross = grossReturn || 0;

  const finalNoFee = calculateCompoundInterest({ ...common, rate: gross }).finalBalance;
  const finalWithFee = calculateCompoundInterest({ ...common, rate: gross - fee }).finalBalance;
  const lifetimeFeeCost = finalNoFee - finalWithFee;

  return {
    finalNoFee,
    finalWithFee,
    lifetimeFeeCost,
    costAsPercentOfPot: finalNoFee > 0 ? (lifetimeFeeCost / finalNoFee) * 100 : 0
  };
};
