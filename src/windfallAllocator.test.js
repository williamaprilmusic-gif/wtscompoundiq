// src/windfallAllocator.test.js
import { describe, it, expect } from 'vitest';
import { allocateWindfall } from './windfallAllocator.js';

describe('allocateWindfall', () => {
  it('fills the priorities in order and invests the remainder', () => {
    const { steps, leftover } = allocateWindfall({ amount: 100000, emergencyShortfall: 20000, highInterestDebt: 30000, wrapperRoom: 25000 });
    expect(steps.map(s => s.label)).toEqual([
      'Top up emergency fund', 'Clear high-interest debt', 'Fill tax-advantaged room', 'Invest in a taxable account'
    ]);
    expect(steps.map(s => s.amount)).toEqual([20000, 30000, 25000, 25000]);
    expect(leftover).toBe(0);
  });

  it('stops when the money runs out mid-priority', () => {
    const { steps, allocated, leftover } = allocateWindfall({ amount: 35000, emergencyShortfall: 20000, highInterestDebt: 30000 });
    expect(steps.map(s => s.amount)).toEqual([20000, 15000]);
    expect(steps.some(s => s.label === 'Invest in a taxable account')).toBe(false);
    expect(allocated).toBe(35000);
    expect(leftover).toBe(0);
  });

  it('skips a priority that has zero need', () => {
    const { steps } = allocateWindfall({ amount: 50000, emergencyShortfall: 0, highInterestDebt: 0, wrapperRoom: 10000 });
    expect(steps.map(s => s.label)).toEqual(['Fill tax-advantaged room', 'Invest in a taxable account']);
  });

  it('puts everything into taxable investing when there are no priorities', () => {
    const { steps } = allocateWindfall({ amount: 40000 });
    expect(steps).toHaveLength(1);
    expect(steps[0].label).toBe('Invest in a taxable account');
    expect(steps[0].amount).toBe(40000);
  });

  it('handles a zero or negative windfall without producing steps', () => {
    expect(allocateWindfall({ amount: 0, emergencyShortfall: 5000 }).steps).toHaveLength(0);
    expect(allocateWindfall({ amount: -100 }).steps).toHaveLength(0);
  });
});
