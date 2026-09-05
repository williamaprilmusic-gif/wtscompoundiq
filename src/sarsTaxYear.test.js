// src/sarsTaxYear.test.js
import { describe, it, expect } from 'vitest';
import { sarsTaxYear } from './sarsTaxYear.js';

describe('sarsTaxYear', () => {
  it('a date after 1 March falls in the tax year starting that same calendar year', () => {
    const r = sarsTaxYear(new Date(2026, 8, 1)); // 1 September 2026
    expect(r.label).toBe('2026/27');
    expect(r.endDate.getFullYear()).toBe(2027);
    expect(r.endDate.getMonth()).toBe(1); // February
    expect(r.endDate.getDate()).toBe(28); // 2027 is not a leap year
  });

  it('a date in January/February falls in the tax year that started the PREVIOUS calendar year', () => {
    const r = sarsTaxYear(new Date(2027, 0, 15)); // 15 January 2027
    expect(r.label).toBe('2026/27');
    expect(r.endDate.getFullYear()).toBe(2027);
  });

  it('1 March itself is the first day of the new tax year', () => {
    const r = sarsTaxYear(new Date(2026, 2, 1)); // 1 March 2026
    expect(r.label).toBe('2026/27');
  });

  it('28 February (the last day) is still in the same tax year, with 0 or 1 days left', () => {
    const r = sarsTaxYear(new Date(2027, 1, 28)); // 28 February 2027
    expect(r.label).toBe('2026/27');
    expect(r.daysLeft).toBeLessThanOrEqual(1);
  });

  it('correctly finds 29 February as the tax-year end in a leap year', () => {
    // 2028 is a leap year -- the 2027/28 tax year should end 29 Feb 2028, not 28th.
    const r = sarsTaxYear(new Date(2027, 8, 1)); // 1 September 2027
    expect(r.label).toBe('2027/28');
    expect(r.endDate.getDate()).toBe(29);
  });

  it('daysLeft counts down toward the end date', () => {
    const early = sarsTaxYear(new Date(2026, 2, 1)); // just started
    const late = sarsTaxYear(new Date(2027, 1, 1)); // near the end
    expect(late.daysLeft).toBeLessThan(early.daysLeft);
  });
});
