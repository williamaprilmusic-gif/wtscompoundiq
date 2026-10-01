// api/_lib/payfast.js
// PayFast + Supabase helpers shared by /api/payfast/* and the entitlement endpoints.
// PayFast is the second payment provider next to Paystack (see provider.js for how one
// is chosen). Secrets are server-side env vars only -- nothing here reaches the bundle.
import crypto from 'node:crypto';

// Server-side source of truth for what a checkout costs: the browser only says which
// tier/period it wants, never an amount. MUST match the numeric price/priceAnnual fields
// in src/components/TierPricing.jsx (payfast.test.js enforces that).
export const PRICES = {
  Pro: { monthly: 149, annual: 1199 },
  Ultra: { monthly: 249, annual: 1999 }
};
// PayFast subscription frequency codes: 3 = monthly, 6 = annual.
export const FREQUENCY = { monthly: 3, annual: 6 };

// PAYFAST_ENV (or PAYFAST_MODE) = 'live' charges real money; anything else is sandbox.
export const isLive = (env = process.env) => (env.PAYFAST_MODE || env.PAYFAST_ENV) === 'live';

// Sandbox deliberately has no built-in test merchant: PayFast's shared one (10000100)
// rejects every signature. Use your own free sandbox account's PAYFAST_SANDBOX_* values.
export function getConfig(env = process.env) {
  const live = isLive(env);
  const p = live ? 'PAYFAST_' : 'PAYFAST_SANDBOX_';
  return {
    live,
    merchantId: env[`${p}MERCHANT_ID`] || '',
    merchantKey: env[`${p}MERCHANT_KEY`] || '',
    passphrase: env[`${p}PASSPHRASE`] ?? '',
    host: live ? 'www.payfast.co.za' : 'sandbox.payfast.co.za'
  };
}

// True once everything the PayFast path needs is present. Gates it the same way
// isCheckoutConfigured() gates Paystack -- otherwise the app stays in demo mode.
export const isPayfastConfigured = (env = process.env) => {
  const c = getConfig(env);
  return Boolean(
    c.merchantId && c.merchantKey && env.ENTITLEMENT_SECRET &&
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
  );
};

// PHP-style urlencode (what PayFast signs against): encodeURIComponent leaves !'()*~
// unescaped and uses %20 for spaces, PHP does the opposite on both counts.
const pfEncode = (v) =>
  encodeURIComponent(String(v).trim())
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, '+');

// `entries` must be [key, value][] in the order PayFast sends / expects them.
// Checkout signatures skip blank fields; ITN (webhook) signatures KEEP them
// (`custom_str1=`), so the webhook passes keepBlank=true.
export function sign(entries, passphrase, keepBlank = false) {
  let s = entries
    .filter(([k, v]) => k !== 'signature' && v != null && (keepBlank || v !== ''))
    .map(([k, v]) => `${k}=${pfEncode(v)}`)
    .join('&');
  if (passphrase) s += `&passphrase=${pfEncode(passphrase)}`;
  return crypto.createHash('md5').update(s).digest('hex');
}

// Minimal Supabase REST client using the service-role key (bypasses RLS; the
// subscriptions table has no public policies). Throws on any non-2xx so callers fail
// loudly instead of half-saving.
// Supabase has two server-key formats: the legacy service_role JWT ("eyJ...") and the newer
// secret key ("sb_secret_..."). Legacy keys go in both headers; the new ones are NOT JWTs and
// must only be sent as `apikey` (putting one in Authorization makes the gateway reject it).
export const supabaseHeaders = (key) => ({
  apikey: key,
  ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }),
  'Content-Type': 'application/json'
});

export async function db(path, { method = 'GET', body } = {}, env = process.env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars are not configured');
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: supabaseHeaders(key),
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path} -> ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Active PayFast subscriptions for an email, best tier first (Ultra over Pro).
export async function activeSubscriptionsFor(email, env = process.env) {
  const rows = await db(
    `subscriptions?email=eq.${encodeURIComponent(String(email).toLowerCase())}&status=eq.active&select=tier,period`,
    {},
    env
  );
  const rank = { Ultra: 2, Pro: 1 };
  return (rows || []).sort((a, b) => (rank[b.tier] || 0) - (rank[a.tier] || 0));
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
