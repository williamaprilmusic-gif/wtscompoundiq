// src/carCost.test.js
import { describe, it, expect } from 'vitest';
import { carOwnershipCost } from './carCost.js';

describe('carOwnershipCost', () => {
  it('depreciation is price minus the compounded residual value', () => {
    const result = carOwnershipCost({ purchasePrice: 400000, yearsOwned: 5, annualDepreciationRate: 15, financeTermYears: 0 });
    const expectedResidual = 400000 * Math.pow(0.85, 5);
    expect(result.residualValue).toBeCloseTo(expectedResidual, 2);
    expect(result.depreciation).toBeCloseTo(400000 - expectedResidual, 2);
  });

  it('a cash purchase has no finance interest', () => {
    const result = carOwnershipCost({ purchasePrice: 300000, deposit: 300000, yearsOwned: 4, financeRate: 12, financeTermYears: 5 });
    expect(result.financeInterest).toBe(0);
  });

  it('a financed purchase adds real interest to the total', () => {
    const cash = carOwnershipCost({ purchasePrice: 400000, deposit: 400000, yearsOwned: 5, annualDepreciationRate: 15 });
    const financed = carOwnershipCost({ purchasePrice: 400000, deposit: 0, financeRate: 11, financeTermYears: 6, yearsOwned: 5, annualDepreciationRate: 15 });
    expect(financed.financeInterest).toBeGreaterThan(0);
    expect(financed.totalCost).toBeGreaterThan(cash.totalCost);
  });

  it('sums running costs across the whole holding period', () => {
    const result = carOwnershipCost({
      purchasePrice: 200000, deposit: 200000, yearsOwned: 3,
      monthlyInsurance: 1200, monthlyFuel: 2000, monthlyMaintenance: 800
    });
    expect(result.runningTotal).toBeCloseTo((1200 + 2000 + 800) * 36, 5);
  });

  it('costPerMonth is totalCost spread over the months held, 0 when held is 0', () => {
    const result = carOwnershipCost({ purchasePrice: 300000, deposit: 300000, yearsOwned: 5, annualDepreciationRate: 10 });
    expect(result.costPerMonth).toBeCloseTo(result.totalCost / 60, 5);
    expect(carOwnershipCost({ purchasePrice: 300000, yearsOwned: 0 }).costPerMonth).toBe(0);
  });

  it('caps a deposit at the purchase price', () => {
    const result = carOwnershipCost({ purchasePrice: 100000, deposit: 500000, yearsOwned: 2, financeRate: 10, financeTermYears: 5 });
    expect(result.financeInterest).toBe(0);
    expect(Number.isFinite(result.totalCost)).toBe(true);
  });
});
