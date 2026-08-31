// src/utils/uniqueId.test.js
import { describe, it, expect } from 'vitest';
import { uniqueId } from './uniqueId.js';

describe('uniqueId', () => {
  it('never returns the same value twice, even called many times back-to-back', () => {
    const ids = new Set();
    for (let i = 0; i < 5000; i++) ids.add(uniqueId());
    expect(ids.size).toBe(5000);
  });

  it('returns a plain, safe-integer number', () => {
    const id = uniqueId();
    expect(typeof id).toBe('number');
    expect(Number.isSafeInteger(id)).toBe(true);
  });
});
