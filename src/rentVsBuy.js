// src/rentVsBuy.js
// Pure math backing PowerTools.jsx's Rent vs. Buy Calculator. Distinct from Home
// Affordability (which asks "how big a home can I qualify for") -- this asks "given a
// specific home, is buying it actually the better financial move over N years compared
// to renting and investing the difference?" Reuses loanAmortization.js for the bond
// side, the same present-value math the rest of the app already relies on for loans.
import { calculateLoanAmortization } from './loanAmortization';

export const compareRentVsBuy = ({
  homePrice, downPayment, mortgageRate, mortgageTermYears, monthlyExtras = 0,
  homeAppreciationRate = 0, monthlyRent, rentIncreaseRate = 0, investReturnRate, years
}) => {
  const safeHomePrice = Math.max(0, homePrice || 0);
  const safeDownPayment = Math.max(0, Math.min(downPayment || 0, safeHomePrice));
  const principal = safeHomePrice - safeDownPayment;
  const amort = calculateLoanAmortization({ principal, annualRate: mortgageRate, termYears: mortgageTermYears });
  const monthlyBuyPayment = amort.monthlyPayment + Math.max(0, monthlyExtras || 0);

  const safeYears = Math.max(1, years || 1);
  const investMonthlyRate = (investReturnRate || 0) / 100 / 12;

  // Buy side: home value compounds annually at homeAppreciationRate; remaining bond
  // balance comes straight from the amortization schedule (yearlyData stops once the
  // bond is paid off, so a year past that reads as 0 remaining, same convention every
  // other loan tool in the app uses for "reachable").
  const homeValueAtYear = (y) => safeHomePrice * Math.pow(1 + (homeAppreciationRate || 0) / 100, y);
  const bondBalanceAtYear = (y) => {
    const monthsAtYear = Math.round(y * 12);
    if (monthsAtYear <= 0) return principal;
    const row = amort.yearlyData.find(r => r.year === y);
    if (row) return row.balance;
    return amort.reachable && monthsAtYear >= amort.payoffMonths ? 0 : principal;
  };

  // Rent side: the down payment (what would've gone into the home) starts invested
  // immediately; each month, whatever buying would have cost beyond that month's rent
  // also gets invested -- the classic "rent and invest the difference" comparison. If
  // rent is actually the pricier side in some month, nothing gets pulled OUT of the
  // portfolio to cover it (this models the investing side, not a cash-flow deficit).
  let investPortfolio = safeDownPayment;
  let rent = Math.max(0, monthlyRent || 0);
  const rentMonthlyGrowth = Math.pow(1 + (rentIncreaseRate || 0) / 100, 1 / 12);
  const path = [];
  const totalMonths = Math.round(safeYears * 12);
  for (let m = 1; m <= totalMonths; m++) {
    investPortfolio *= (1 + investMonthlyRate);
    const diff = monthlyBuyPayment - rent;
    if (diff > 0) investPortfolio += diff;
    rent *= rentMonthlyGrowth;
    if (m % 12 === 0) {
      const y = m / 12;
      path.push({ year: y, buyEquity: Math.max(0, homeValueAtYear(y) - bondBalanceAtYear(y)), rentPortfolio: investPortfolio });
    }
  }

  const last = path[path.length - 1] || { buyEquity: Math.max(0, homeValueAtYear(0) - principal), rentPortfolio: investPortfolio };
  return {
    monthlyBuyPayment,
    finalBuyEquity: last.buyEquity,
    finalRentPortfolio: last.rentPortfolio,
    buyIsBetter: last.buyEquity > last.rentPortfolio,
    path
  };
};
