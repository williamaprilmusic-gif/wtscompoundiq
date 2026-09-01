// src/rentVsBuy.test.js
import { describe, it, expect } from 'vitest';
import { compareRentVsBuy } from './rentVsBuy.js';
import { calculateLoanAmortization } from './loanAmortization.js';

describe('compareRentVsBuy', () => {
  it('derives the monthly buy payment from loanAmortization plus extras', () => {
    const { monthlyPayment } = calculateLoanAmortization({ principal: 900000, annualRate: 11, termYears: 20 });
    const result = compareRentVsBuy({
      homePrice: 1000000, downPayment: 100000, mortgageRate: 11, mortgageTermYears: 20,
      monthlyExtras: 2000, homeAppreciationRate: 5, monthlyRent: 8000, rentIncreaseRate: 6,
      investReturnRate: 8, years: 10
    });
    expect(result.monthlyBuyPayment).toBeCloseTo(monthlyPayment + 2000, 0);
  });

  it('a cheap rent with a high investment return favors renting', () => {
    const result = compareRentVsBuy({
      homePrice: 2000000, downPayment: 400000, mortgageRate: 12, mortgageTermYears: 20,
      monthlyExtras: 3000, homeAppreciationRate: 2, monthlyRent: 5000, rentIncreaseRate: 4,
      investReturnRate: 12, years: 15
    });
    expect(result.buyIsBetter).toBe(false);
    expect(result.finalRentPortfolio).toBeGreaterThan(result.finalBuyEquity);
  });

  it('cheap financing with strong appreciation and expensive rent favors buying', () => {
    const result = compareRentVsBuy({
      homePrice: 1000000, downPayment: 200000, mortgageRate: 6, mortgageTermYears: 20,
      monthlyExtras: 1000, homeAppreciationRate: 8, monthlyRent: 12000, rentIncreaseRate: 8,
      investReturnRate: 4, years: 15
    });
    expect(result.buyIsBetter).toBe(true);
  });

  it('returns one path point per year, ending at the requested horizon', () => {
    const result = compareRentVsBuy({
      homePrice: 1000000, downPayment: 100000, mortgageRate: 10, mortgageTermYears: 20,
      monthlyRent: 7000, investReturnRate: 7, years: 5
    });
    expect(result.path).toHaveLength(5);
    expect(result.path[result.path.length - 1].year).toBe(5);
  });

  it('never lets a down payment exceed the home price turn principal negative', () => {
    const result = compareRentVsBuy({
      homePrice: 500000, downPayment: 900000, mortgageRate: 10, mortgageTermYears: 20,
      monthlyRent: 5000, investReturnRate: 6, years: 5
    });
    expect(result.monthlyBuyPayment).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.finalBuyEquity)).toBe(true);
  });
});
