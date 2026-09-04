// src/buyCashVsFinance.js
// You're definitely buying the thing -- car, appliance, equipment. The question is how
// to fund it: pay cash (and give up the growth that cash would have earned), or finance
// it (pay interest, but keep the cash invested). This compares the two over the finance
// term on a single number: your net wealth at the end.
//
// Reuses loanAmortization.js for the finance leg. Not about whether to buy, or about
// leasing (see leaseVsBuy.js) -- purely the cash-vs-credit funding choice.
import { calculateLoanAmortization } from './loanAmortization';

export const compareBuyCashVsFinance = ({
  price, deposit = 0, financeRate = 0, financeTermYears = 0, investReturnPct = 0
}) => {
  const p = Math.max(0, price || 0);
  const dep = Math.max(0, Math.min(deposit || 0, p));
  const financed = p - dep;
  const term = Math.max(0, financeTermYears || 0);
  const monthlyR = Math.max(-99, investReturnPct || 0) / 100 / 12;
  const months = Math.round(term * 12);

  if (p === 0 || months === 0) {
    return { cashPathWealth: 0, financePathWealth: 0, financeInterest: 0, monthlyPayment: 0, cheaper: null, gap: 0 };
  }

  const amort = calculateLoanAmortization({ principal: financed, annualRate: financeRate, termYears: term });
  const monthlyPayment = amort.monthlyPayment;

  // CASH PATH: you spend `p` today. Over the term you have the loan payment amount free
  // to invest each month (since you're not paying a loan). End wealth (relative to a
  // common baseline) = FV of that monthly stream.  -- you also don't hold `p` any more.
  // FINANCE PATH: you keep (p - dep) invested today and it compounds; each month you
  // pay `monthlyPayment` out (so nothing extra is invested). End wealth = FV(kept cash).
  let cashStream = 0;       // investing the freed-up payment each month
  let keptCash = financed;  // the cash you didn't spend, compounding
  for (let m = 1; m <= months; m++) {
    cashStream = cashStream * (1 + monthlyR) + monthlyPayment;
    keptCash *= (1 + monthlyR);
  }

  // Both paths end owning the same asset, so it cancels. Compare the financial side:
  const cashPathWealth = cashStream;
  const financePathWealth = keptCash;
  const gap = cashPathWealth - financePathWealth;

  return {
    monthlyPayment,
    financeInterest: amort.totalInterest,
    cashPathWealth,
    financePathWealth,
    cheaper: Math.abs(gap) < 1 ? 'tie' : (gap > 0 ? 'cash' : 'finance'),
    gap: Math.abs(gap),
    // The break-even invest return: roughly the finance rate. Above it, financing wins.
    breakEvenReturnApprox: Math.max(0, financeRate || 0)
  };
};
