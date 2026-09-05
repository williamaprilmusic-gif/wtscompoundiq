// src/coastContributionShare.test.js
import { describe, it, expect } from 'vitest';
import { coastContributionShare } from './coastContributionShare.js';

describe('coastContributionShare', () => {
  it('splits the final balance into coast (locked-in) and contribution-dependent parts', () => {
    const r = coastContributionShare(200000, 80000);
    expect(r.coastFinalBalance).toBe(80000);
    expect(r.dependsOnContributing).toBe(120000);
    expect(r.coastSharePct).toBeCloseTo(40, 6);
  });

  it('with no starting amount, 0% is already locked in', () => {
    const r = coastContributionShare(150000, 0);
    expect(r.coastFinalBalance).toBe(0);
    expect(r.dependsOnContributing).toBe(150000);
    expect(r.coastSharePct).toBe(0);
  });

  it('with no further contributions, the whole balance is already locked in', () => {
    const r = coastContributionShare(90000, 90000);
    expect(r.dependsOnContributing).toBe(0);
    expect(r.coastSharePct).toBeCloseTo(100, 6);
  });

  it('clamps a coast balance that (due to float drift) slightly exceeds the real balance', () => {
    const r = coastContributionShare(100000, 100000.0001);
    expect(r.coastFinalBalance).toBe(100000);
    expect(r.dependsOnContributing).toBe(0);
  });

  it('handles a zero final balance without dividing by zero', () => {
    const r = coastContributionShare(0, 0);
    expect(r.coastSharePct).toBe(100);
    expect(r.dependsOnContributing).toBe(0);
  });

  it('treats missing/negative inputs as zero rather than throwing', () => {
    const r = coastContributionShare(undefined, undefined);
    expect(r.coastFinalBalance).toBe(0);
    expect(r.dependsOnContributing).toBe(0);
  });
});
