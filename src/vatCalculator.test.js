// src/vatCalculator.test.js
import { describe, it, expect } from 'vitest';
import { addVat, extractVat } from './vatCalculator.js';

describe('addVat', () => {
  it('adds VAT on top of an exclusive amount at the default 15%', () => {
    const r = addVat({ exclusiveAmount: 1000 });
    expect(r.vatAmount).toBeCloseTo(150, 6);
    expect(r.inclusiveAmount).toBeCloseTo(1150, 6);
  });

  it('respects a custom rate', () => {
    const r = addVat({ exclusiveAmount: 1000, vatRatePct: 20 });
    expect(r.inclusiveAmount).toBeCloseTo(1200, 6);
  });
});

describe('extractVat', () => {
  it('extracts the VAT baked into an inclusive amount (not amount * rate)', () => {
    const r = extractVat({ inclusiveAmount: 1150, vatRatePct: 15 });
    expect(r.exclusiveAmount).toBeCloseTo(1000, 6);
    expect(r.vatAmount).toBeCloseTo(150, 6);
    // The naive (wrong) shortcut would say 1150 * 0.15 = 172.5 -- must not match.
    expect(r.vatAmount).not.toBeCloseTo(172.5, 1);
  });

  it('round-trips with addVat', () => {
    const added = addVat({ exclusiveAmount: 4321, vatRatePct: 15 });
    const extracted = extractVat({ inclusiveAmount: added.inclusiveAmount, vatRatePct: 15 });
    expect(extracted.exclusiveAmount).toBeCloseTo(4321, 6);
  });

  it('handles a zero rate and zero amount without dividing by zero', () => {
    expect(extractVat({ inclusiveAmount: 1000, vatRatePct: 0 }).exclusiveAmount).toBeCloseTo(1000, 6);
    expect(extractVat({ inclusiveAmount: 0, vatRatePct: 15 }).vatAmount).toBe(0);
  });
});
