// src/utils/safeTrim.test.js
import { describe, it, expect } from 'vitest';
import { safeTrim } from './safeTrim.js';

describe('safeTrim', () => {
  it('trims a normal string', () => {
    expect(safeTrim('  hello  ')).toBe('hello');
  });

  it('returns an empty string for undefined instead of throwing', () => {
    expect(safeTrim(undefined)).toBe('');
  });

  it('returns an empty string for null', () => {
    expect(safeTrim(null)).toBe('');
  });

  it('returns an empty string for an already-empty string', () => {
    expect(safeTrim('')).toBe('');
  });
});
