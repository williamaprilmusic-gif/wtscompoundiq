import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// getPaymentsConfig keeps a module-level cache, so load a fresh copy per test.
const load = async () => { vi.resetModules(); return import('./entitlement.js'); };

afterEach(() => vi.unstubAllGlobals());

describe('getPaymentsConfig', () => {
  beforeEach(() => vi.useRealTimers());

  it('a failed fetch is reported as failed, never as demo mode (demo grants a tier for free)', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('offline'); });
    const { getPaymentsConfig } = await load();
    const cfg = await getPaymentsConfig();
    expect(cfg.failed).toBe(true);
    expect(cfg.paymentsMode).not.toBe('demo');
  });

  it('treats a 5xx or a malformed answer as failed too', async () => {
    vi.stubGlobal('fetch', async () => new Response('boom', { status: 500 }));
    let { getPaymentsConfig } = await load();
    expect((await getPaymentsConfig()).failed).toBe(true);
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ hello: 'world' }), { status: 200 }));
    ({ getPaymentsConfig } = await load());
    expect((await getPaymentsConfig()).failed).toBe(true);
  });

  it('does not cache a failure: the next call retries and can succeed', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls += 1;
      if (calls === 1) throw new Error('blip');
      return new Response(JSON.stringify({ paymentsMode: 'live', provider: 'payfast', availablePlans: {} }), { status: 200 });
    });
    const { getPaymentsConfig } = await load();
    expect((await getPaymentsConfig()).failed).toBe(true);
    const second = await getPaymentsConfig();
    expect(second.paymentsMode).toBe('live');
    expect(calls).toBe(2);
  });

  it('only an explicit server answer of demo is demo mode, and a good answer is cached', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', async () => { calls += 1; return new Response(JSON.stringify({ paymentsMode: 'demo', availablePlans: {} }), { status: 200 }); });
    const { getPaymentsConfig } = await load();
    expect((await getPaymentsConfig()).paymentsMode).toBe('demo');
    await getPaymentsConfig();
    expect(calls).toBe(1);
  });
});
