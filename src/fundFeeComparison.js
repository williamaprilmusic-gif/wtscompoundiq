// src/fundFeeComparison.js
// Two funds, side by side, over a real contribution schedule. Fund A vs Fund B differ
// on total expense ratio (TER) and, optionally, on gross return. A half-percent of TER
// sounds trivial; over decades it quietly compounds into a large gap. This runs both
// through the app's compounding engine and reports the ending balances, the gap, and
// what each fund took in fees.
//
// Distinct from feeDrag.js, which shows one fund against a zero-fee ideal; this is a
// head-to-head "which of these two should I actually pick".
import { calculateCompoundInterest } from './engine';

const runFund = ({ initial, monthly, years, contributionIncreaseRate, grossReturnPct, terPct }) => {
  const net = (grossReturnPct || 0) - Math.max(0, terPct || 0);
  const res = calculateCompoundInterest({
    initial, monthly, rate: net, years,
    inflation: 0, taxRate: 0, wrapper: true, compoundFrequency: 12,
    contributionIncreaseRate: contributionIncreaseRate || 0
  });
  // What a zero-TER version of the same fund would have reached -- the difference is the
  // fee cost for that fund.
  const noFee = calculateCompoundInterest({
    initial, monthly, rate: grossReturnPct || 0, years,
    inflation: 0, taxRate: 0, wrapper: true, compoundFrequency: 12,
    contributionIncreaseRate: contributionIncreaseRate || 0
  });
  return {
    netReturn: net,
    finalBalance: res.finalBalance,
    totalContributed: res.totalDeposited,
    feeCost: Math.max(0, noFee.finalBalance - res.finalBalance)
  };
};

export const compareFundFees = ({
  initial = 0, monthly = 0, years = 0, contributionIncreaseRate = 0,
  fundA, fundB
}) => {
  const yrs = Math.max(0, Math.round(years || 0));
  const a = runFund({ initial, monthly, years: yrs, contributionIncreaseRate,
    grossReturnPct: fundA?.grossReturn, terPct: fundA?.ter });
  const b = runFund({ initial, monthly, years: yrs, contributionIncreaseRate,
    grossReturnPct: fundB?.grossReturn, terPct: fundB?.ter });

  const gap = a.finalBalance - b.finalBalance;
  return {
    a, b,
    winner: Math.abs(gap) < 1 ? 'tie' : (gap > 0 ? 'A' : 'B'),
    endingGap: Math.abs(gap),
    feeCostGap: Math.abs(a.feeCost - b.feeCost)
  };
};
