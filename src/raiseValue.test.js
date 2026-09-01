// src/raiseValue.test.js
import { describe, it, expect } from 'vitest';
import { lifetimeRaiseValue } from './raiseValue.js';

describe('lifetimeRaiseValue', () => {
  it('with no future raises, cumulative gross is just amount x years', () => {
    const result = lifetimeRaiseValue({ raiseAmount: 20000, annualRaisePercent: 0, yearsRemaining: 10, marginalTaxRate: 0, investReturn: 0 });
    expect(result.cumulativeGross).toBeCloseTo(200000, 5);
    expect(result.investedValue).toBeCloseTo(200000, 5); // 0% return, 0% tax
  });

  it('future percentage raises stack on the higher base, beating amount x years', () => {
    const flat = lifetimeRaiseValue({ raiseAmount: 20000, annualRaisePercent: 0, yearsRemaining: 20 });
    const compounding = lifetimeRaiseValue({ raiseAmount: 20000, annualRaisePercent: 6, yearsRemaining: 20 });
    expect(compounding.cumulativeGross).toBeGreaterThan(flat.cumulativeGross);
  });

  it('applies the marginal tax rate to the after-tax figures', () => {
    const result = lifetimeRaiseValue({ raiseAmount: 10000, annualRaisePercent: 0, yearsRemaining: 5, marginalTaxRate: 40, investReturn: 0 });
    expect(result.cumulativeGross).toBeCloseTo(50000, 5);
    expect(result.cumulativeAfterTax).toBeCloseTo(30000, 5);
    expect(result.investedValue).toBeCloseTo(30000, 5);
  });

  it('investing the after-tax difference at a positive return grows it past the plain sum', () => {
    const result = lifetimeRaiseValue({ raiseAmount: 20000, annualRaisePercent: 5, yearsRemaining: 25, marginalTaxRate: 30, investReturn: 8 });
    expect(result.investedValue).toBeGreaterThan(result.cumulativeAfterTax);
  });

  it('returns zeros for 0 years', () => {
    const result = lifetimeRaiseValue({ raiseAmount: 20000, yearsRemaining: 0 });
    expect(result.cumulativeGross).toBe(0);
    expect(result.investedValue).toBe(0);
  });
});
