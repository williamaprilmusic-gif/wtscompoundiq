// api/_lib/itn.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// PayFast's source IPs are looked up in DNS; pin them so the IP check is deterministic.
vi.mock('node:dns/promises', () => ({
  default: { resolve4: async () => ['41.74.179.194'] },
  resolve4: async () => ['41.74.179.194']
}));

import handler from '../payfast/itn.js';
import { sign } from './payfast.js';

const PASS = 'itn test passphrase';
const PID = 'a50e31dd-be5b-44cd-a126-df04a27a88da';
const OLD_PID = '4273f638-0b38-4f88-a61a-5e86d5d21329';

let rows, validateCalls, validateVerdict, payfastApiCalls;

const fakeFetch = async (url, opts = {}) => {
  url = String(url);
  if (url.includes('/eng/query/validate')) { validateCalls.push(url); return new Response(validateVerdict); }
  if (url.startsWith('https://api.payfast.co.za/')) {
    payfastApiCalls.push(url);
    return new Response(JSON.stringify({ code: 200, status: 'success', data: { response: true } }), { status: 200 });
  }
  const u = new URL(url);
  const q = Object.fromEntries(u.searchParams);
  const val = (k) => (q[k] || '').replace(/^(eq|neq)\./, '');
  if (opts.method === 'PATCH') {
    rows.filter((r) => r.payment_id === val('payment_id')).forEach((r) => Object.assign(r, JSON.parse(opts.body)));
    return new Response(null, { status: 204 });
  }
  const hit = rows.filter((r) =>
    (!q.payment_id || (q.payment_id.startsWith('neq.') ? r.payment_id !== val('payment_id') : r.payment_id === val('payment_id'))) &&
    (!q.email || r.email === decodeURIComponent(val('email'))) &&
    (!q.status || r.status === val('status')));
  return new Response(JSON.stringify(hit), { status: 200 });
};

// A notification exactly as PayFast sends it: signed over ALL fields, blanks included.
const notice = (fields, { ip = '41.74.179.194', passphrase = PASS } = {}) => {
  const entries = Object.entries(fields);
  const body = Object.fromEntries([...entries, ['signature', sign(entries, passphrase, true)]]);
  return { method: 'POST', body, headers: { 'x-forwarded-for': ip } };
};
const COMPLETE = { m_payment_id: PID, pf_payment_id: '3423142', payment_status: 'COMPLETE', item_name: 'WTS CompoundIQ Pro (monthly)', amount_gross: '149.00', custom_str1: '', token: 'tok-new', merchant_id: '10055190' };
const CANCELLED = { m_payment_id: PID, pf_payment_id: '3423142', payment_status: 'CANCELLED', item_name: 'WTS CompoundIQ Pro (monthly)', custom_str1: '', merchant_id: '10055190' }; // no amount, as PayFast sends it

const run = async (req) => {
  const res = { code: 0, out: null, status(c) { this.code = c; return this; }, setHeader() {}, end(t) { try { this.out = JSON.parse(t); } catch { this.out = t; } } };
  await handler(req, res);
  return res;
};
const row = (id = PID) => rows.find((r) => r.payment_id === id);

beforeEach(() => {
  Object.assign(process.env, {
    PAYFAST_ENV: 'sandbox', PAYFAST_SANDBOX_MERCHANT_ID: '10055190', PAYFAST_SANDBOX_MERCHANT_KEY: 'k',
    PAYFAST_SANDBOX_PASSPHRASE: PASS, SUPABASE_URL: 'https://fake.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc'
  });
  rows = [
    { payment_id: PID, email: 'a@b.co', tier: 'Pro', period: 'monthly', status: 'pending', payfast_token: null },
    { payment_id: OLD_PID, email: 'a@b.co', tier: 'Ultra', period: 'monthly', status: 'active', payfast_token: 'tok-old' }
  ];
  validateCalls = []; payfastApiCalls = []; validateVerdict = 'VALID';
  vi.stubGlobal('fetch', fakeFetch);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('COMPLETE (grants access: full checks)', () => {
  it('activates a pending subscription, validates with PayFast, and cancels the buyer\'s older plan', async () => {
    const r = await run(notice(COMPLETE));
    expect(r.code).toBe(200);
    expect(validateCalls).toHaveLength(1);
    expect(row().status).toBe('active');
    expect(row().payfast_token).toBe('tok-new');
    expect(row(OLD_PID).status).toBe('cancelled');
    expect(payfastApiCalls[0]).toContain('/subscriptions/tok-old/cancel');
  });

  it('records paid_through from billing_date, and a renewal pushes it forward', async () => {
    const next = new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().slice(0, 10); // a realistic next billing date
    await run(notice({ ...COMPLETE, billing_date: next }));
    expect(row().paid_through).toBe(new Date(Date.parse(next) + 24 * 3600 * 1000).toISOString());
  });

  it('does not activate when PayFast says INVALID', async () => {
    validateVerdict = 'INVALID';
    const r = await run(notice(COMPLETE));
    expect(r.code).toBe(400);
    expect(row().status).toBe('pending');
  });

  it('rejects a notification with NO amount (a missing amount used to slip past as NaN)', async () => {
    const { amount_gross, ...noAmount } = COMPLETE; // eslint-disable-line no-unused-vars
    const r = await run(notice(noAmount));
    expect(r.code).toBe(400);
    expect(row().status).toBe('pending');
  });

  it('rejects the wrong amount', async () => {
    const r = await run(notice({ ...COMPLETE, amount_gross: '1.00' }));
    expect(r.code).toBe(400);
    expect(row().status).toBe('pending');
  });

  it('ignores a late/retried COMPLETE for a plan the buyer already cancelled', async () => {
    rows[0].status = 'cancelled';
    const r = await run(notice(COMPLETE));
    expect(r.code).toBe(200);
    expect(row().status).toBe('cancelled');
  });

  it('does not extend paid_through again when PayFast retries the same payment', async () => {
    rows[0].status = 'active';
    rows[0].last_pf_payment_id = '3423142';
    rows[0].paid_through = '2026-01-01T00:00:00.000Z';
    const next = new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const r = await run(notice({ ...COMPLETE, billing_date: next }));
    expect(r.code).toBe(200);
    expect(row().paid_through).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects a notification for a different merchant', async () => {
    const r = await run(notice({ ...COMPLETE, merchant_id: '99999999' }));
    expect(r.code).toBe(400);
    expect(row().status).toBe('pending');
  });

  it('ignores a late COMPLETE for a row we deliberately superseded', async () => {
    rows[0].status = 'superseded';
    const r = await run(notice(COMPLETE));
    expect(r.code).toBe(200);
    expect(row().status).toBe('superseded');
  });

  it('a renewal of an already-active plan does not cancel the buyer\'s other plans', async () => {
    rows[0].status = 'active';
    rows[0].payfast_token = 'tok-new';
    await run(notice(COMPLETE));
    expect(row(OLD_PID).status).toBe('active');
    expect(payfastApiCalls).toHaveLength(0);
  });
});

describe('CANCELLED / FAILED (removes access: signature + source IP)', () => {
  beforeEach(() => { rows[0].status = 'active'; rows[0].payfast_token = 'tok-new'; });

  it('marks the subscription cancelled even though it has no amount and PayFast\'s validate would say INVALID', async () => {
    validateVerdict = 'INVALID'; // what the sandbox really answered for a cancellation
    const r = await run(notice(CANCELLED));
    expect(r.code).toBe(200);
    expect(row().status).toBe('cancelled');
    expect(validateCalls).toHaveLength(0); // not consulted for access removal
  });

  it('keeps paid_through on cancel, so the buyer keeps what they paid for', async () => {
    rows[0].paid_through = '2099-06-01T00:00:00.000Z';
    await run(notice(CANCELLED));
    expect(row().status).toBe('cancelled');
    expect(row().paid_through).toBe('2099-06-01T00:00:00.000Z');
  });

  it('marks a failed payment failed', async () => {
    await run(notice({ ...CANCELLED, payment_status: 'FAILED' }));
    expect(row().status).toBe('failed');
  });

  it('rejects a cancellation whose token is not the one we stored', async () => {
    const r = await run(notice({ ...CANCELLED, token: 'someone-elses-token' }));
    expect(r.code).toBe(400);
    expect(row().status).toBe('active');
  });

  it('accepts a cancellation carrying the matching token', async () => {
    await run(notice({ ...CANCELLED, token: 'tok-new' }));
    expect(row().status).toBe('cancelled');
  });
});

describe('authentication still applies to every notification', () => {
  it('rejects a bad signature (wrong passphrase)', async () => {
    const r = await run(notice(CANCELLED, { passphrase: 'wrong' }));
    expect(r.code).toBe(400);
    expect(row().status).toBe('pending');
  });

  it('rejects a source IP that is not PayFast', async () => {
    const r = await run(notice(CANCELLED, { ip: '6.6.6.6' }));
    expect(r.code).toBe(400);
    expect(row().status).toBe('pending');
  });

  it('rejects an unknown payment id', async () => {
    const r = await run(notice({ ...CANCELLED, m_payment_id: '00000000-0000-4000-8000-000000000000' }));
    expect(r.code).toBe(400);
  });

  it('ignores a status it does not act on, without changing anything', async () => {
    const r = await run(notice({ ...CANCELLED, payment_status: 'PENDING' }));
    expect(r.code).toBe(200);
    expect(row().status).toBe('pending');
  });
});
