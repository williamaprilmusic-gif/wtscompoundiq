// api/_lib/entitlement.test.js
import { describe, it, expect } from 'vitest';
import { signEntitlement, verifyEntitlement, ENTITLEMENT_TTL_SECONDS } from './entitlement.js';

const SECRET = 'test-secret-do-not-use-in-prod';

describe('signEntitlement / verifyEntitlement', () => {
  it('round-trips a valid token', () => {
    const now = 1_700_000_000;
    const token = signEntitlement({ email: 'A@Example.com', tier: 'Pro', period: 'monthly' }, SECRET, now);
    const check = verifyEntitlement(token, SECRET, now + 10);
    expect(check.valid).toBe(true);
    expect(check.payload.tier).toBe('Pro');
    expect(check.payload.email).toBe('a@example.com'); // normalised
    expect(check.payload.exp).toBe(now + ENTITLEMENT_TTL_SECONDS.monthly);
  });

  it('rejects a token signed with a different secret', () => {
    const token = signEntitlement({ email: 'a@b.com', tier: 'Ultra', period: 'annual' }, SECRET);
    const check = verifyEntitlement(token, 'other-secret');
    expect(check.valid).toBe(false);
    expect(check.reason).toBe('bad-signature');
    expect(check.payload).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const now = 1_700_000_000;
    const token = signEntitlement({ email: 'a@b.com', tier: 'Pro', period: 'monthly' }, SECRET, now);
    const [, sig] = token.split('.');
    // Swap the payload for a hand-made "Ultra" one, keep the old signature.
    const forged =
      Buffer.from(JSON.stringify({ email: 'a@b.com', tier: 'Ultra', period: 'annual', iat: now, exp: now + 999999 }))
        .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') +
      '.' + sig;
    expect(verifyEntitlement(forged, SECRET, now).valid).toBe(false);
  });

  it('reports expiry distinctly from a bad signature', () => {
    const now = 1_700_000_000;
    const token = signEntitlement({ email: 'a@b.com', tier: 'Pro', period: 'monthly' }, SECRET, now);
    const check = verifyEntitlement(token, SECRET, now + ENTITLEMENT_TTL_SECONDS.monthly + 1);
    expect(check.valid).toBe(false);
    expect(check.expired).toBe(true);
    expect(check.payload).not.toBeNull(); // caller can still try to renew from Paystack
  });

  it('annual tokens live longer than monthly', () => {
    expect(ENTITLEMENT_TTL_SECONDS.annual).toBeGreaterThan(ENTITLEMENT_TTL_SECONDS.monthly);
  });

  it('handles malformed input without throwing', () => {
    for (const bad of [null, undefined, '', 'nodot', 'a.b.c.d', 123]) {
      const check = verifyEntitlement(bad, SECRET);
      expect(check.valid).toBe(false);
    }
  });
});
