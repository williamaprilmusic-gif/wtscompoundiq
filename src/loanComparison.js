// src/loanComparison.js
// Two loan offers for the same borrowing need, compared on what they actually cost --
// not just the headline rate. A lower rate with a big initiation fee, or a longer term
// with a smaller monthly, can lose to the "worse-looking" offer once fees and total
// interest are counted. Reuses loanAmortization.js for each offer's schedule.
import { calculateLoanAmortization } from './loanAmortization';

const priceOffer = (principal, offer) => {
  const rate = Math.max(0, offer.rate || 0);
  const term = Math.max(0, offer.termYears || 0);
  const upfrontFee = Math.max(0, offer.upfrontFee || 0);
  const monthlyFee = Math.max(0, offer.monthlyFee || 0);

  const amort = calculateLoanAmortization({ principal, annualRate: rate, termYears: term });
  const months = amort.payoffMonths || Math.round(term * 12);
  const feesTotal = upfrontFee + monthlyFee * months;
  const totalInterest = amort.totalInterest;
  const totalCost = principal + totalInterest + feesTotal;

  return {
    monthlyPayment: amort.monthlyPayment + monthlyFee,
    months,
    totalInterest,
    feesTotal,
    totalCost,
    // Rough all-in cost expressed as a rate: total non-principal cost over the average
    // outstanding balance and the term. Comparative only, not a regulated APR.
    allInCostPct: principal > 0 && term > 0
      ? ((totalInterest + feesTotal) / principal) * (12 / months) * 100
      : 0
  };
};

export const compareLoanOffers = ({ amount, offerA, offerB }) => {
  const principal = Math.max(0, amount || 0);
  if (principal === 0 || !offerA || !offerB) {
    return { a: null, b: null, cheaper: null, totalCostSaving: 0, monthlyDifference: 0 };
  }
  const a = priceOffer(principal, offerA);
  const b = priceOffer(principal, offerB);
  const cheaper = a.totalCost === b.totalCost ? 'tie' : (a.totalCost < b.totalCost ? 'A' : 'B');
  return {
    a,
    b,
    cheaper,
    totalCostSaving: Math.abs(a.totalCost - b.totalCost),
    monthlyDifference: Math.abs(a.monthlyPayment - b.monthlyPayment)
  };
};
