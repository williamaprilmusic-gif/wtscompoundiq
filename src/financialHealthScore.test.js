// src/financialHealthScore.test.js
import { describe, it, expect } from 'vitest';
import {
  scoreEmergencyFund, scoreDebtPayoff, scoreNetWorthTrend, scoreFireProgress,
  computeHealthScore, gradeForScore, MIN_COMPONENTS
} from './financialHealthScore.js';

describe('scoreEmergencyFund', () => {
  it('passes a valid percentage through, clamped to 0-100', () => {
    expect(scoreEmergencyFund(50)).toBe(50);
    expect(scoreEmergencyFund(150)).toBe(100); // overfunded still caps at 100
    expect(scoreEmergencyFund(-10)).toBe(0);
  });

  it('returns null when no Emergency Fund data is available', () => {
    expect(scoreEmergencyFund(null)).toBeNull();
  });
});

describe('scoreDebtPayoff', () => {
  it('returns null when no debt plan was ever saved', () => {
    expect(scoreDebtPayoff(0, null)).toBeNull();
  });

  it('scores an already-cleared balance as fully debt-free even with a saved plan', () => {
    expect(scoreDebtPayoff(0, 36)).toBe(100);
  });

  it('scores a shorter payoff horizon higher than a longer one', () => {
    expect(scoreDebtPayoff(10000, 12)).toBeGreaterThan(scoreDebtPayoff(10000, 200));
  });
});

describe('scoreNetWorthTrend', () => {
  it('returns null with fewer than two data points', () => {
    expect(scoreNetWorthTrend(null, 5000)).toBeNull();
    expect(scoreNetWorthTrend(5000, null)).toBeNull();
  });

  it('scores growth higher than decline', () => {
    expect(scoreNetWorthTrend(100000, 130000)).toBeGreaterThan(scoreNetWorthTrend(100000, 90000));
  });

  it('rewards crossing from negative to positive net worth', () => {
    expect(scoreNetWorthTrend(-5000, 1000)).toBeGreaterThan(scoreNetWorthTrend(-5000, -4000));
  });
});

describe('scoreFireProgress', () => {
  it('distinguishes "never saved" (undefined) from "saved but not reachable" (null)', () => {
    expect(scoreFireProgress(undefined)).toBeNull();
    expect(scoreFireProgress(null)).toBe(20);
  });

  it('is not fooled by a legitimate yearsToFire of 0 (already there)', () => {
    expect(scoreFireProgress(0)).toBe(100);
  });

  it('scores sooner FIRE higher than later FIRE', () => {
    expect(scoreFireProgress(5)).toBeGreaterThan(scoreFireProgress(40));
  });
});

describe('gradeForScore', () => {
  it('maps score bands to the expected letter grades', () => {
    expect(gradeForScore(95).grade).toBe('A');
    expect(gradeForScore(70).grade).toBe('B');
    expect(gradeForScore(0).grade).toBe('F');
  });
});

describe('computeHealthScore', () => {
  it(`returns null with fewer than ${MIN_COMPONENTS} available components`, () => {
    const result = computeHealthScore([
      { key: 'ef', label: 'Emergency Fund', score: 80 },
      { key: 'debt', label: 'Debt', score: null }
    ]);
    expect(result).toBeNull();
  });

  it('averages only the available components, ignoring null ones', () => {
    const result = computeHealthScore([
      { key: 'ef', label: 'Emergency Fund', score: 100 },
      { key: 'debt', label: 'Debt', score: null },
      { key: 'fire', label: 'FIRE', score: 50 }
    ]);
    expect(result.score).toBe(75);
    expect(result.components).toHaveLength(2);
  });

  it('attaches a letter grade to the combined score', () => {
    const result = computeHealthScore([
      { key: 'ef', label: 'Emergency Fund', score: 90 },
      { key: 'fire', label: 'FIRE', score: 90 }
    ]);
    expect(result.grade).toBe('A');
  });
});
