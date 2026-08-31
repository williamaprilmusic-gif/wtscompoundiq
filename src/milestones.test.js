// src/milestones.test.js
import { describe, it, expect } from 'vitest';
import { detectNetWorthMilestones, detectDebtClearedMilestone, detectEfFundedMilestone, sortMilestones, MAX_MILESTONES } from './milestones.js';

describe('detectNetWorthMilestones', () => {
  it('detects crossing from negative/zero to positive net worth', () => {
    const points = [{ date: '2026-01-01', net: -5000 }, { date: '2026-02-01', net: 2000 }];
    const milestones = detectNetWorthMilestones(points);
    expect(milestones.some(m => m.label === 'First positive net worth')).toBe(true);
  });

  it('detects crossing a round-number threshold', () => {
    const points = [{ date: '2026-01-01', net: 80000 }, { date: '2026-02-01', net: 120000 }];
    const milestones = detectNetWorthMilestones(points);
    expect(milestones.some(m => m.amount === 100000)).toBe(true);
  });

  it('detects multiple thresholds crossed between two snapshots', () => {
    const points = [{ date: '2026-01-01', net: 50000 }, { date: '2026-02-01', net: 600000 }];
    const milestones = detectNetWorthMilestones(points);
    expect(milestones.some(m => m.amount === 100000)).toBe(true);
    expect(milestones.some(m => m.amount === 500000)).toBe(true);
  });

  it('does not re-fire a threshold already crossed in an earlier snapshot pair', () => {
    const points = [{ date: '2026-01-01', net: 50000 }, { date: '2026-02-01', net: 120000 }, { date: '2026-03-01', net: 150000 }];
    const milestones = detectNetWorthMilestones(points);
    expect(milestones.filter(m => m.amount === 100000)).toHaveLength(1);
  });

  it('returns nothing with fewer than 2 points', () => {
    expect(detectNetWorthMilestones([{ date: '2026-01-01', net: 500000 }])).toEqual([]);
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
