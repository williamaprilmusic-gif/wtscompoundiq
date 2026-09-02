// src/utils/sanitize.test.js
import { describe, it, expect } from 'vitest';
import { floorRate, clampPct, RATE_FLOOR } from './sanitize.js';

describe('floorRate', () => {
  it('leaves a normal rate untouched', () => {
    expect(floorRate(7.5)).toBe(7.5);
    expect(floorRate(-30)).toBe(-30);
  });
  it('floors at just above -100%', () => {
    expect(floorRate(-100)).toBe(RATE_FLOOR);
    expect(floorRate(-250)).toBe(RATE_FLOOR);
  });
  it('treats missing/NaN-ish input as 0', () => {
    expect(floorRate(undefined)).toBe(0);
    expect(floorRate(null)).toBe(0);
  });
});

describe('clampPct', () => {
  it('passes a value already in [0, 100]', () => {
    expect(clampPct(31)).toBe(31);
  });
  it('clamps out-of-range values', () => {
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(250)).toBe(100);
  });
  it('treats missing input as 0', () => {
    expect(clampPct(undefined)).toBe(0);
  });
});
