// src/educationSavings.test.js
import { describe, it, expect } from 'vitest';
import { projectEducationCost } from './educationSavings.js';

describe('projectEducationCost', () => {
  it('with 0 inflation and 0 years out, totals the raw annual cost times study years', () => {
    const result = projectEducationCost({ currentAnnualCost: 100000, yearsUntilEnrollment: 0, studyYears: 4, educationInflationRate: 0 });
    expect(result.totalFutureCost).toBe(400000);
    expect(result.yearly).toHaveLength(4);
  });

  it('inflates each study year further out than the last', () => {
    const result = projectEducationCost({ currentAnnualCost: 100000, yearsUntilEnrollment: 5, studyYears: 3, educationInflationRate: 8 });
    expect(result.yearly[0].yearsFromNow).toBe(5);
    expect(result.yearly[1].yearsFromNow).toBe(6);
    expect(result.yearly[2].yearsFromNow).toBe(7);
    expect(result.yearly[1].cost).toBeGreaterThan(result.yearly[0].cost);
    expect(result.yearly[2].cost).toBeGreaterThan(result.yearly[1].cost);
  });

  it('a higher inflation rate produces a larger total future cost', () => {
    const low = projectEducationCost({ currentAnnualCost: 100000, yearsUntilEnrollment: 10, studyYears: 3, educationInflationRate: 4 });
    const high = projectEducationCost({ currentAnnualCost: 100000, yearsUntilEnrollment: 10, studyYears: 3, educationInflationRate: 9 });
    expect(high.totalFutureCost).toBeGreaterThan(low.totalFutureCost);
  });

  it('returns a zero total with no study years', () => {
    const result = projectEducationCost({ currentAnnualCost: 100000, yearsUntilEnrollment: 5, studyYears: 0, educationInflationRate: 8 });
    expect(result.totalFutureCost).toBe(0);
    expect(result.yearly).toHaveLength(0);
  });

  it('treats every field as optional, defaulting to a zero-cost projection', () => {
    expect(projectEducationCost({}).totalFutureCost).toBe(0);
  });
});
