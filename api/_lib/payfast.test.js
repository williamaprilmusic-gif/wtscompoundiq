// api/_lib/payfast.test.js
import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { sign, getConfig, isLive, isPayfastConfigured, supabaseHeaders, PRICES, FREQUENCY } from './payfast.js';
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
