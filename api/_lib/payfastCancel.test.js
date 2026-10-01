// api/_lib/payfastCancel.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import { apiSignature, cancelSubscriptionAtPayFast, supersedeOtherSubscriptions, retrySuperseded, cancelActiveForEmail } from './payfastCancel.js';

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

const ENV = {
  PAYFAST_SANDBOX_MERCHANT_ID: '10055190',
  PAYFAST_SANDBOX_MERCHANT_KEY: 'k',
  PAYFAST_SANDBOX_PASSPHRASE: 'pass phrase',
  SUPABASE_URL: 'https://fake.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'svc'
};

// In-memory stand-in for the subscriptions table + PayFast's cancel API.
let rows, payfastCalls, payfastBehaviour;
const fakeFetch = async (url, opts = {}) => {
  url = String(url);
  if (url.startsWith('https://api.payfast.co.za/')) {
    payfastCalls.push({ url, method: opts.method, headers: opts.headers });
    return payfastBehaviour();
  }
  const u = new URL(url);
  const q = Object.fromEntries(u.searchParams);
  const val = (k) => (q[k] || '').replace(/^(eq|neq)\./, '');
  if (opts.method === 'PATCH') {
    const id = val('payment_id');
    const body = JSON.parse(opts.body);
    rows.filter((r) => r.payment_id === id).forEach((r) => Object.assign(r, body));
    return new Response(null, { status: 204 }); // a 204 may not carry a body
  }
  let hit = rows.filter((r) =>
    (!q.email || r.email === decodeURIComponent(val('email'))) &&
    (!q.status || r.status === val('status')) &&
    (!q.paid_through || (r.paid_through && new Date(r.paid_through) > new Date(q.paid_through.replace(/^gt\./, '')))) &&
    (!q.payment_id || (q.payment_id.startsWith('neq.') ? r.payment_id !== val('payment_id') : r.payment_id === val('payment_id'))));
  if (q.order === 'paid_through.desc') hit = [...hit].sort((a, b) => new Date(b.paid_through) - new Date(a.paid_through));
  if (q.limit) hit = hit.slice(0, Number(q.limit));
  return new Response(JSON.stringify(hit), { status: 200 });
};

const ok = () => new Response(JSON.stringify({ code: 200, status: 'success', data: { response: true } }), { status: 200 });
const fail = () => new Response(JSON.stringify({ code: 500, status: 'failed', data: { response: 'boom' } }), { status: 500 });

beforeEach(() => {
  rows = [
    { payment_id: 'old-pro', email: 'a@b.co', status: 'active', payfast_token: 'tok-old' },
    { payment_id: 'new-ultra', email: 'a@b.co', status: 'active', payfast_token: 'tok-new' },
    { payment_id: 'other-person', email: 'z@z.co', status: 'active', payfast_token: 'tok-z' }
  ];
  payfastCalls = [];
  payfastBehaviour = ok;
  vi.stubGlobal('fetch', fakeFetch);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('apiSignature', () => {
  it('md5 over alphabetically sorted headers + passphrase, PHP-urlencoded', () => {
    const h = { version: 'v1', 'merchant-id': '10000100', timestamp: '2026-10-01T21:16:22' };
    expect(apiSignature(h, 'p')).toBe(
      md5('merchant-id=10000100&passphrase=p&timestamp=2026-10-01T21%3A16%3A22&version=v1'));
    expect(apiSignature(h, '')).toBe(md5('merchant-id=10000100&timestamp=2026-10-01T21%3A16%3A22&version=v1'));
  });
});

describe('cancelSubscriptionAtPayFast', () => {
  it('PUTs the cancel endpoint with signed headers and ?testing=true in sandbox', async () => {
    const r = await cancelSubscriptionAtPayFast('tok-1', ENV, new Date('2026-10-01T21:16:22.999Z'));
    expect(r.ok).toBe(true);
    const c = payfastCalls[0];
    expect(c.method).toBe('PUT');
    expect(c.url).toBe('https://api.payfast.co.za/subscriptions/tok-1/cancel?testing=true');
    expect(c.headers['merchant-id']).toBe('10055190');
    expect(c.headers.timestamp).toBe('2026-10-01T21:16:22');
    expect(c.headers.signature).toBe(apiSignature(
      { 'merchant-id': '10055190', version: 'v1', timestamp: '2026-10-01T21:16:22' }, 'pass phrase'));
  });

  it('omits ?testing=true in live mode', async () => {
    await cancelSubscriptionAtPayFast('tok-1', { PAYFAST_ENV: 'live', PAYFAST_MERCHANT_ID: '1', PAYFAST_MERCHANT_KEY: 'k' });
    expect(payfastCalls[0].url).toBe('https://api.payfast.co.za/subscriptions/tok-1/cancel');
  });

  it('reports failure on a PayFast error', async () => {
    payfastBehaviour = fail;
    expect((await cancelSubscriptionAtPayFast('t', ENV)).ok).toBe(false);
  });

  // Real response bodies captured from PayFast's sandbox (it answers HTTP 200 even on failure).
  it('treats an already-cancelled subscription as success, so retries stop', async () => {
    payfastBehaviour = () => new Response(
      JSON.stringify({ code: 400, status: 'failed', data: { response: false, message: 'Failure - The subscription status is cancelled' } }),
      { status: 200 });
    const r = await cancelSubscriptionAtPayFast('t', ENV);
    expect(r).toMatchObject({ ok: true, alreadyCancelled: true });
  });

  it('treats an unknown token (HTTP 200, code 400 "Failure") as a failure, not success', async () => {
    payfastBehaviour = () => new Response(
      JSON.stringify({ code: 400, status: 'failed', data: { response: false, message: 'Failure' } }), { status: 200 });
    expect((await cancelSubscriptionAtPayFast('t', ENV)).ok).toBe(false);
  });

  it('treats a 401 authorization failure as a failure', async () => {
    payfastBehaviour = () => new Response(
      JSON.stringify({ code: 401, status: 'failed', data: { response: 'Merchant authorization failed.', message: false } }), { status: 401 });
    const r = await cancelSubscriptionAtPayFast('t', ENV);
    expect(r.ok).toBe(false);
    expect(r.detail).toContain('authorization failed');
  });
});

describe('supersedeOtherSubscriptions', () => {
  it('cancels the older active plan at PayFast and marks it cancelled; keeps the new one and other people', async () => {
    const n = await supersedeOtherSubscriptions('a@b.co', 'new-ultra', ENV);
    expect(n).toBe(1);
    expect(payfastCalls).toHaveLength(1);
    expect(payfastCalls[0].url).toContain('/subscriptions/tok-old/cancel');
    expect(rows.find((r) => r.payment_id === 'old-pro').status).toBe('cancelled');
    expect(rows.find((r) => r.payment_id === 'new-ultra').status).toBe('active');
    expect(rows.find((r) => r.payment_id === 'other-person').status).toBe('active');
  });

  it('on a PayFast failure the old row is left superseded (not active, not cancelled) and the error is logged, not thrown', async () => {
    payfastBehaviour = fail;
    await expect(supersedeOtherSubscriptions('a@b.co', 'new-ultra', ENV)).resolves.toBe(1);
    expect(rows.find((r) => r.payment_id === 'old-pro').status).toBe('superseded');
    expect(rows.find((r) => r.payment_id === 'new-ultra').status).toBe('active');
    expect(console.error).toHaveBeenCalled();
  });

  it('does nothing when there is no other active plan', async () => {
    expect(await supersedeOtherSubscriptions('z@z.co', 'other-person', ENV)).toBe(0);
    expect(payfastCalls).toHaveLength(0);
  });

  it('never throws even if the database is unreachable', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('network down'); });
    await expect(supersedeOtherSubscriptions('a@b.co', 'new-ultra', ENV)).resolves.toBe(0);
  });
});

describe('supersede clears paid_through so a replaced plan can never outrank the chosen one', () => {
  it('nulls paid_through on the retired row', async () => {
    rows[0].paid_through = '2099-01-01T00:00:00.000Z';
    await supersedeOtherSubscriptions('a@b.co', 'new-ultra', ENV);
    expect(rows[0].status).toBe('cancelled');
    expect(rows[0].paid_through).toBeNull();
  });
});

describe('cancelActiveForEmail (the in-app cancel)', () => {
  const FUTURE = '2099-06-01T00:00:00.000Z';

  it('cancels the active plan at PayFast, keeps paid_through, and reports when access ends', async () => {
    rows = [{ payment_id: 'p1', email: 'a@b.co', status: 'active', payfast_token: 'tok-1', paid_through: FUTURE }];
    const r = await cancelActiveForEmail('a@b.co', ENV);
    expect(r).toEqual({ status: 'cancelled', accessUntil: FUTURE });
    expect(payfastCalls).toHaveLength(1);
    expect(rows[0].status).toBe('cancelled');
    expect(rows[0].paid_through).toBe(FUTURE); // the paid period survives the cancel
  });

  it('is idempotent: cancelling again reports already_cancelled with the same end date and calls PayFast no more', async () => {
    rows = [{ payment_id: 'p1', email: 'a@b.co', status: 'cancelled', payfast_token: 'tok-1', paid_through: FUTURE }];
    expect(await cancelActiveForEmail('a@b.co', ENV)).toEqual({ status: 'already_cancelled', accessUntil: FUTURE });
    expect(payfastCalls).toHaveLength(0);
  });

  it('a paid period that has already ended is "none", not access', async () => {
    rows = [{ payment_id: 'p1', email: 'a@b.co', status: 'cancelled', payfast_token: 'tok-1', paid_through: '2000-01-01T00:00:00.000Z' }];
    expect(await cancelActiveForEmail('a@b.co', ENV)).toEqual({ status: 'none' });
  });

  it('no subscription at all is "none"', async () => {
    rows = [];
    expect(await cancelActiveForEmail('nobody@x.co', ENV)).toEqual({ status: 'none' });
  });

  it('reports error (and leaves the plan active) when PayFast refuses, so the buyer is never told they are cancelled when they are not', async () => {
    rows = [{ payment_id: 'p1', email: 'a@b.co', status: 'active', payfast_token: 'tok-1', paid_through: FUTURE }];
    payfastBehaviour = fail;
    expect(await cancelActiveForEmail('a@b.co', ENV)).toEqual({ status: 'error' });
    expect(rows[0].status).toBe('active');
  });

  it('only touches the requesting email', async () => {
    rows = [
      { payment_id: 'p1', email: 'a@b.co', status: 'active', payfast_token: 'tok-1', paid_through: FUTURE },
      { payment_id: 'p2', email: 'z@z.co', status: 'active', payfast_token: 'tok-2', paid_through: FUTURE }
    ];
    await cancelActiveForEmail('a@b.co', ENV);
    expect(rows.find((r) => r.payment_id === 'p2').status).toBe('active');
  });
});

describe('retrySuperseded', () => {
  it('finishes a cancel that failed earlier', async () => {
    payfastBehaviour = fail;
    await supersedeOtherSubscriptions('a@b.co', 'new-ultra', ENV);
    expect(rows.find((r) => r.payment_id === 'old-pro').status).toBe('superseded');

    payfastBehaviour = ok; // PayFast recovers
    await retrySuperseded('a@b.co', ENV);
    expect(rows.find((r) => r.payment_id === 'old-pro').status).toBe('cancelled');
  });

  it('is a no-op (no PayFast call) when nothing is superseded', async () => {
    await retrySuperseded('a@b.co', ENV);
    expect(payfastCalls).toHaveLength(0);
  });
});
