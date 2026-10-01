// api/_lib/payfast.test.js
import { describe, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { sign, getConfig, isLive, isPayfastConfigured, supabaseHeaders, paidThrough, activeSubscriptionsFor, PRICES, FREQUENCY } from './payfast.js';
import { paymentProvider } from './provider.js';

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

const PAYFAST_ENV = {
  PAYFAST_SANDBOX_MERCHANT_ID: '10000001',
  PAYFAST_SANDBOX_MERCHANT_KEY: 'sandboxkey',
  PAYFAST_SANDBOX_PASSPHRASE: 'sandbox pass',
  ENTITLEMENT_SECRET: 'ent_secret',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service'
};

describe('sign', () => {
  it('url-encodes PHP-style: + for spaces, %XX for ()@!\'*~, uppercase hex', () => {
    const got = sign([['item_name', 'WTS CompoundIQ Pro (monthly)'], ['email_address', 'a@b.co'], ['x', "it's!*~"]], '');
    expect(got).toBe(md5('item_name=WTS+CompoundIQ+Pro+%28monthly%29&email_address=a%40b.co&x=it%27s%21%2A%7E'));
  });

  it('appends the passphrase, and only when there is one', () => {
    const e = [['a', '1']];
    expect(sign(e, 'p w')).toBe(md5('a=1&passphrase=p+w'));
    expect(sign(e, '')).toBe(md5('a=1'));
  });

  it('skips the signature field itself', () => {
    expect(sign([['a', '1'], ['signature', 'zzz']], '')).toBe(md5('a=1'));
  });

  it('checkout skips blank fields; ITN (keepBlank) keeps them -- the bug that rejected real webhooks', () => {
    const e = [['a', '1'], ['custom_str1', ''], ['b', '2']];
    expect(sign(e, '')).toBe(md5('a=1&b=2'));
    expect(sign(e, '', true)).toBe(md5('a=1&custom_str1=&b=2'));
  });
});

describe('getConfig / isPayfastConfigured', () => {
  it('is sandbox unless PAYFAST_ENV or PAYFAST_MODE is "live"', () => {
    expect(isLive({})).toBe(false);
    expect(isLive({ PAYFAST_ENV: 'sandbox' })).toBe(false);
    expect(isLive({ PAYFAST_ENV: 'live' })).toBe(true);
    expect(isLive({ PAYFAST_MODE: 'live' })).toBe(true);
  });

  it('sandbox reads only PAYFAST_SANDBOX_* and never falls back to the live credentials', () => {
    const c = getConfig({ PAYFAST_MERCHANT_ID: 'LIVE', PAYFAST_MERCHANT_KEY: 'LIVEKEY' });
    expect(c.host).toBe('sandbox.payfast.co.za');
    expect(c.merchantId).toBe('');
    expect(c.merchantKey).toBe('');
  });

  it('live reads the real credentials and the live host', () => {
    const c = getConfig({ PAYFAST_ENV: 'live', PAYFAST_MERCHANT_ID: '1', PAYFAST_MERCHANT_KEY: 'k', PAYFAST_PASSPHRASE: 'p' });
    expect(c).toMatchObject({ live: true, host: 'www.payfast.co.za', merchantId: '1', merchantKey: 'k', passphrase: 'p' });
  });

  it('needs credentials, the entitlement secret and Supabase to count as configured', () => {
    expect(isPayfastConfigured(PAYFAST_ENV)).toBe(true);
    for (const missing of Object.keys(PAYFAST_ENV)) {
      if (missing === 'PAYFAST_SANDBOX_PASSPHRASE') continue; // optional
      const env = { ...PAYFAST_ENV };
      delete env[missing];
      expect(isPayfastConfigured(env), missing).toBe(false);
    }
  });
});

describe('supabaseHeaders', () => {
  it('legacy JWT keys go in apikey AND Authorization: Bearer', () => {
    expect(supabaseHeaders('eyJhbGciOi.payload.sig')).toMatchObject({
      apikey: 'eyJhbGciOi.payload.sig', Authorization: 'Bearer eyJhbGciOi.payload.sig'
    });
  });
  it('new sb_secret_ keys are sent as apikey only (they are not JWTs)', () => {
    const h = supabaseHeaders('sb_secret_abc123');
    expect(h.apikey).toBe('sb_secret_abc123');
    expect(h).not.toHaveProperty('Authorization');
  });
});

describe('paidThrough', () => {
  const NOW = new Date('2026-10-01T12:00:00Z');
  const DAY = 24 * 3600 * 1000;

  it("uses PayFast's billing_date (+1 day of slack) when it is sensible", () => {
    expect(paidThrough('2026-11-01', 'monthly', NOW)).toBe(new Date(Date.parse('2026-11-01') + DAY).toISOString());
  });
  it('falls back to one billing period (+slack) when billing_date is missing, junk, past, or absurdly far', () => {
    const month = new Date('2026-11-01T12:00:00Z').getTime() + DAY;
    const year = new Date('2027-10-01T12:00:00Z').getTime() + DAY;
    for (const bad of [undefined, '', 'not a date', '2020-01-01', '2099-01-01']) {
      expect(paidThrough(bad, 'monthly', NOW), String(bad)).toBe(new Date(month).toISOString());
      expect(paidThrough(bad, 'annual', NOW), String(bad)).toBe(new Date(year).toISOString());
    }
  });
});

describe('activeSubscriptionsFor', () => {
  const ENV = { SUPABASE_URL: 'https://fake.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc' };
  it('asks for active plans AND cancelled-but-still-paid ones, and sorts Ultra above Pro', async () => {
    let seen;
    vi.stubGlobal('fetch', async (url) => {
      seen = decodeURIComponent(String(url));
      return new Response(JSON.stringify([{ tier: 'Pro' }, { tier: 'Ultra' }]), { status: 200 });
    });
    const rows = await activeSubscriptionsFor('A@B.co', ENV, new Date('2026-10-01T00:00:00Z'));
    vi.unstubAllGlobals();
    expect(rows.map((r) => r.tier)).toEqual(['Ultra', 'Pro']);
    expect(seen).toContain('email=eq.a@b.co');
    expect(seen).toContain('status.eq.active');
    expect(seen).toContain('and(status.eq.cancelled,paid_through.gt.2026-10-01T00:00:00.000Z)');
    expect(seen).not.toContain('superseded');
  });
});

describe('PRICES', () => {
  it('match the advertised prices in TierPricing.jsx (what the card shows is what is charged)', () => {
    const src = readFileSync(new URL('../../src/components/TierPricing.jsx', import.meta.url), 'utf8');
    const grab = (tier) => {
      const block = src.slice(src.indexOf(`name: '${tier}'`));
      return {
        monthly: Number(/price:\s*(\d+)/.exec(block)[1]),
        annual: Number(/priceAnnual:\s*(\d+)/.exec(block)[1])
      };
    };
    expect(PRICES.Pro).toEqual(grab('Pro'));
    expect(PRICES.Ultra).toEqual(grab('Ultra'));
  });

  it('uses PayFast frequency codes 3 (monthly) and 6 (annual)', () => {
    expect(FREQUENCY).toEqual({ monthly: 3, annual: 6 });
  });
});

describe('paymentProvider', () => {
  const PAYSTACK_ENV = { PAYSTACK_SECRET_KEY: 'sk', ENTITLEMENT_SECRET: 'e', PAYSTACK_PLAN_PRO_MONTHLY: 'PLN_x' };

  it('is null (demo mode) with nothing configured', () => {
    expect(paymentProvider({})).toBeNull();
  });
  it('picks paystack, payfast, and prefers payfast when both are configured', () => {
    expect(paymentProvider(PAYSTACK_ENV)).toBe('paystack');
    expect(paymentProvider(PAYFAST_ENV)).toBe('payfast');
    expect(paymentProvider({ ...PAYSTACK_ENV, ...PAYFAST_ENV })).toBe('payfast');
  });
});
