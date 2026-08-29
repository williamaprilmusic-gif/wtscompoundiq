// src/debtPayoffEngine.test.js
import { describe, it, expect } from 'vitest';
import { simulatePayoff, avalancheOrder, snowballOrder } from './debtPayoffEngine.js';

const debts = [
  { id: 1, name: 'Credit Card', balance: 20000, rate: 22, minPayment: 500 },
  { id: 2, name: 'Car Loan', balance: 100000, rate: 11, minPayment: 2000 },
  { id: 3, name: 'Store Card', balance: 5000, rate: 28, minPayment: 200 }
];

describe('avalancheOrder / snowballOrder', () => {
  it('avalanche orders debts by highest interest rate first', () => {
    const order = avalancheOrder(debts).map(d => d.name);
    expect(order).toEqual(['Store Card', 'Credit Card', 'Car Loan']); // 28% > 22% > 11%
  });

  it('snowball orders debts by smallest balance first', () => {
    const order = snowballOrder(debts).map(d => d.name);
    expect(order).toEqual(['Store Card', 'Credit Card', 'Car Loan']); // 5000 < 20000 < 100000
  });

  it('does not mutate the original array', () => {
    const originalOrder = debts.map(d => d.id);
    avalancheOrder(debts);
    snowballOrder(debts);
    expect(debts.map(d => d.id)).toEqual(originalOrder);
  });
});

describe('simulatePayoff', () => {
  it('clears every debt eventually when minimums exceed interest', () => {
    const result = simulatePayoff(debts, 0, avalancheOrder);
    expect(result.reachable).toBe(true);
    expect(result.months).toBeGreaterThan(0);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  it('avalanche never costs more total interest than snowball for the same debt set', () => {
    // Avalanche is mathematically optimal for minimizing interest -- this should hold
    // for any debt set where both strategies are reachable.
    const avalanche = simulatePayoff(debts, 300, avalancheOrder);
    const snowball = simulatePayoff(debts, 300, snowballOrder);
    expect(avalanche.totalInterest).toBeLessThanOrEqual(snowball.totalInterest);
  });

  it('more extra monthly cash clears debt in fewer months', () => {
    const slow = simulatePayoff(debts, 0, avalancheOrder);
    const fast = simulatePayoff(debts, 3000, avalancheOrder);
    expect(fast.months).toBeLessThan(slow.months);
  });

  it('a single debt paid off with minimum payment only matches simple amortization direction', () => {
    const single = [{ id: 1, name: 'Loan', balance: 10000, rate: 12, minPayment: 500 }];
    const result = simulatePayoff(single, 0, avalancheOrder);
    expect(result.reachable).toBe(true);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalInterest).toBeLessThan(10000); // sanity bound -- interest shouldn't exceed the principal here
  });

  it('an empty debt list clears immediately with no interest', () => {
    const result = simulatePayoff([], 500, avalancheOrder);
    expect(result.months).toBe(0);
    expect(result.totalInterest).toBe(0);
    expect(result.reachable).toBe(true);
  });

  it('marks an unreachable payoff (minimums too low to ever clear high-interest debt) as not reachable', () => {
    // A minimum payment smaller than the monthly interest accrued means the balance
    // only grows -- this should hit the MAX_MONTHS cap without clearing.
    const trap = [{ id: 1, name: 'Trap', balance: 50000, rate: 40, minPayment: 100 }];
    const result = simulatePayoff(trap, 0, avalancheOrder);
    expect(result.reachable).toBe(false);
  });
});
