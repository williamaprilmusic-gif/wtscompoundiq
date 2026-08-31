// src/milestones.test.js
import { describe, it, expect } from 'vitest';
import { detectNetWorthMilestones, detectDebtClearedMilestone, detectEfFundedMilestone, sortMilestones, MAX_MILESTONES } from './milestones.js';

// 'za' is the reference currency the thresholds are defined in, so passing it converts
// 1:1 and keeps these tests' expected amounts (100000, 500000, ...) exactly as before.
describe('detectNetWorthMilestones', () => {
  it('detects crossing from negative/zero to positive net worth', () => {
    const points = [{ date: '2026-01-01', net: -5000 }, { date: '2026-02-01', net: 2000 }];
    const milestones = detectNetWorthMilestones(points, 'za');
    expect(milestones.some(m => m.label === 'First positive net worth')).toBe(true);
  });

  it('detects crossing a round-number threshold', () => {
    const points = [{ date: '2026-01-01', net: 80000 }, { date: '2026-02-01', net: 120000 }];
    const milestones = detectNetWorthMilestones(points, 'za');
    expect(milestones.some(m => m.amount === 100000)).toBe(true);
  });

  it('detects multiple thresholds crossed between two snapshots', () => {
    const points = [{ date: '2026-01-01', net: 50000 }, { date: '2026-02-01', net: 600000 }];
    const milestones = detectNetWorthMilestones(points, 'za');
    expect(milestones.some(m => m.amount === 100000)).toBe(true);
    expect(milestones.some(m => m.amount === 500000)).toBe(true);
  });

  it('does not re-fire a threshold already crossed in an earlier snapshot pair', () => {
    const points = [{ date: '2026-01-01', net: 50000 }, { date: '2026-02-01', net: 120000 }, { date: '2026-03-01', net: 150000 }];
    const milestones = detectNetWorthMilestones(points, 'za');
    expect(milestones.filter(m => m.amount === 100000)).toHaveLength(1);
  });

  it('returns nothing with fewer than 2 points', () => {
    expect(detectNetWorthMilestones([{ date: '2026-01-01', net: 500000 }], 'za')).toEqual([]);
  });

  it('scales the threshold into the display currency instead of comparing a raw ZAR figure everywhere', () => {
    // A currency worth (per FX_RATE_TO_USD) meaningfully more per unit than ZAR should
    // need a SMALLER raw number to represent the same "R100k-equivalent" milestone --
    // the point isn't the exact figure, just that it's provably not the flat 100000
    // literal a currency-blind implementation would use for every currency.
    const points = [{ date: '2026-01-01', net: 0 }, { date: '2026-02-01', net: 1000000000 }];
    const zaMilestones = detectNetWorthMilestones(points, 'za');
    const jpMilestones = detectNetWorthMilestones(points, 'jp');
    const zaAmount = zaMilestones.find(m => m.amount != null)?.amount;
    const jpAmount = jpMilestones.find(m => m.amount != null)?.amount;
    expect(zaAmount).toBe(100000); // 'za' is the reference currency -- unscaled
    expect(jpAmount).not.toBe(100000); // a different currency must not reuse the raw ZAR literal
  });
});

describe('detectDebtClearedMilestone', () => {
  it('detects a debt balance dropping from positive to zero/negative', () => {
    const points = [{ date: '2026-01-01', total: 5000 }, { date: '2026-02-01', total: 0 }];
    expect(detectDebtClearedMilestone(points)).toHaveLength(1);
  });

  it('does not fire if the balance never actually reached zero', () => {
    const points = [{ date: '2026-01-01', total: 5000 }, { date: '2026-02-01', total: 1000 }];
    expect(detectDebtClearedMilestone(points)).toEqual([]);
  });

  it('does not fire if there was never any debt to clear', () => {
    const points = [{ date: '2026-01-01', total: 0 }, { date: '2026-02-01', total: 0 }];
    expect(detectDebtClearedMilestone(points)).toEqual([]);
  });

  it('detects a payoff that happened between two consecutive middle snapshots, not just first-vs-last', () => {
    // Cleared, then a new debt was taken on -- first (5000) and last (3000) are both
    // positive, so a first-vs-last comparison would miss the payoff at the midpoint.
    const points = [
      { date: '2026-01-01', total: 5000 },
      { date: '2026-02-01', total: 0 },
      { date: '2026-03-01', total: 3000 }
    ];
    const milestones = detectDebtClearedMilestone(points);
    expect(milestones).toHaveLength(1);
    expect(milestones[0].date).toBe('2026-02-01');
  });
});

describe('detectEfFundedMilestone', () => {
  it('detects a fully-funded Emergency Fund', () => {
    expect(detectEfFundedMilestone({ targetAmount: 60000, currentSavings: 60000, savedAt: '2026-01-01' })).toHaveLength(1);
  });

  it('does not fire when still short of target', () => {
    expect(detectEfFundedMilestone({ targetAmount: 60000, currentSavings: 30000, savedAt: '2026-01-01' })).toEqual([]);
  });

  it('handles no saved plan at all', () => {
    expect(detectEfFundedMilestone(null)).toEqual([]);
  });
});

describe('sortMilestones', () => {
  it('sorts newest first and caps at MAX_MILESTONES', () => {
    const many = Array.from({ length: MAX_MILESTONES + 3 }, (_, i) => ({ key: `m${i}`, date: `2026-01-${String(i + 1).padStart(2, '0')}`, label: 'x' }));
    const sorted = sortMilestones(many);
    expect(sorted).toHaveLength(MAX_MILESTONES);
    expect(new Date(sorted[0].date) > new Date(sorted[sorted.length - 1].date)).toBe(true);
  });
});
