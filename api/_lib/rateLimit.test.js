import { describe, it, expect } from 'vitest';
import { checkRate } from './rateLimit.js';

describe('checkRate', () => {
  const WINDOW = 10 * 60 * 1000; // 10 min
  const MAX = 3;

  it('allows the first request and records its timestamp', () => {
    const r = checkRate([], 1_000, WINDOW, MAX);
    expect(r.allowed).toBe(true);
    expect(r.timestamps).toEqual([1_000]);
  });

  it('allows up to `max` within the window, then blocks', () => {
    let ts = [];
    for (let i = 0; i < MAX; i++) {
      const r = checkRate(ts, 1_000 + i, WINDOW, MAX);
      expect(r.allowed).toBe(true);
      ts = r.timestamps;
    }
    const blocked = checkRate(ts, 2_000, WINDOW, MAX);
    expect(blocked.allowed).toBe(false);
    expect(blocked.timestamps).toHaveLength(MAX); // unchanged, nothing appended
  });

  it('drops timestamps older than the window so the budget refills', () => {
    const old = [0, 1, 2]; // all far in the past
    const r = checkRate(old, WINDOW + 100, WINDOW, MAX);
    expect(r.allowed).toBe(true);
    expect(r.timestamps).toEqual([WINDOW + 100]);
  });

  it('is safe with a missing / non-array timestamp list', () => {
    expect(checkRate(undefined, 5, WINDOW, MAX).allowed).toBe(true);
    expect(checkRate(null, 5, WINDOW, MAX).timestamps).toEqual([5]);
  });
});
