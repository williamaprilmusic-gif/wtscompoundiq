// api/entitlement/restore.test.js
import { describe, it, expect, afterEach, vi } from 'vitest';
import handler from './restore.js';

const run = async (req) => {
  const res = { code: 0, out: null, status(c) { this.code = c; return this; }, setHeader() {}, end(t) { try { this.out = JSON.parse(t); } catch { this.out = t; } } };
  await handler(req, res);
  return res;
};

const post = (email) => ({ method: 'POST', body: { email }, headers: {} });

afterEach(() => vi.unstubAllEnvs());

describe('POST /api/entitlement/restore (disabled until mailbox ownership can be proven)', () => {
  it('never issues a token and answers identically for every email, so it cannot reveal subscribers', async () => {
    vi.stubEnv('PAYFAST_ENV', 'sandbox');
    vi.stubEnv('PAYFAST_SANDBOX_MERCHANT_ID', '10000100');
    vi.stubEnv('PAYFAST_SANDBOX_MERCHANT_KEY', '46f0cd694581a');
    vi.stubEnv('ENTITLEMENT_SECRET', 'x'.repeat(40));
    vi.stubEnv('SUPABASE_URL', 'https://fake.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'svc');
    const a = await run(post('subscriber@example.com'));
    const b = await run(post('nobody@example.com'));
    expect(a.code).toBe(200);
    expect(a.out).toEqual({ status: 'unavailable' });
    expect(b.out).toEqual(a.out);
    expect(JSON.stringify(a.out)).not.toMatch(/entitlement|token/i);
  });

  it('rejects non-POST methods', async () => {
    const r = await run({ method: 'GET', headers: {} });
    expect(r.code).toBe(405);
  });
});
