// src/utils/entitlement.js
// Client-side handling of the signed entitlement token issued by /api/paystack/verify.
// The browser can't verify the HMAC (no secret), and doesn't need to -- the server does
// that on every /api/entitlement/refresh. The client only needs to: store it, read the
// tier out of it for the UI, and notice when it has expired so it can stop unlocking.
//
// This sits alongside the existing plain `wts_compoundiq_tier` string: when a valid
// entitlement is present it is the source of truth for the tier; otherwise the app
// behaves exactly as before (demo upgrades, manually-set tier).

const KEY = 'wts_compoundiq_entitlement';
// 'Enterprise' is kept here only so an already-issued Enterprise entitlement token still
// reads as valid (paid) rather than being silently voided -- the tier itself is gone,
// and App.jsx maps a returned 'Enterprise' to 'Ultra' on load.
const PAID = new Set(['Pro', 'Ultra', 'Enterprise']);

const b64urlToJson = (part) => {
  const pad = part.length % 4 === 0 ? '' : '='.repeat(4 - (part.length % 4));
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return JSON.parse(atob(b64));
};

// Returns { token, tier, period, email, exp } or null. Decodes only -- does NOT prove
// authenticity; treats an unparseable or clearly-expired token as absent.
export const readEntitlement = () => {
  let token;
  try { token = localStorage.getItem(KEY); } catch { return null; }
  if (!token || !token.includes('.')) return null;
  try {
    const payload = b64urlToJson(token.split('.')[0]);
    if (!payload || typeof payload.exp !== 'number' || !PAID.has(payload.tier)) return null;
    if (Date.now() / 1000 >= payload.exp) return null;
    return { token, tier: payload.tier, period: payload.period, email: payload.email, exp: payload.exp };
  } catch {
    return null;
  }
};

export const storeEntitlement = (token) => {
  try { localStorage.setItem(KEY, token); } catch { /* private mode / quota */ }
};

export const clearEntitlement = () => {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
};

// Ask the server to re-check the subscription with Paystack and rotate the token.
// Returns one of: 'renewed' | 'kept' | 'grace' (still entitled, token maybe updated),
// 'lapsed' | 'invalid' | 'unconfigured' (drop entitlement), or 'error' (leave as-is).
export const refreshEntitlement = async () => {
  const current = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
  if (!current) return 'invalid';
  try {
    const res = await fetch('/api/entitlement/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entitlement: current })
    });
    if (!res.ok) return 'error';
    const data = await res.json();
    if (['renewed', 'kept', 'grace'].includes(data.status)) {
      if (data.entitlement) storeEntitlement(data.entitlement);
      return data.status;
    }
    if (['lapsed', 'invalid', 'unconfigured'].includes(data.status)) {
      clearEntitlement();
      return data.status;
    }
    return 'error';
  } catch {
    return 'error';
  }
};

// One-time capture of ?reference= / ?trxref= after a Paystack redirect. Verifies with
// the server, stores the returned entitlement, and cleans the URL. Returns the granted
// { tier, period } on success, or null.
export const consumePaystackRedirect = async () => {
  let params;
  try { params = new URLSearchParams(window.location.search); } catch { return null; }
  const ref = params.get('reference') || params.get('trxref') || params.get('paystack_ref');
  if (!ref) return null;

  const stripUrl = () => {
    try {
      ['reference', 'trxref', 'paystack_ref'].forEach((k) => params.delete(k));
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    } catch { /* ignore */ }
  };

  try {
    const res = await fetch('/api/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: ref })
    });
    const data = await res.json().catch(() => ({}));
    stripUrl();
    if (res.ok && data.entitlement) {
      storeEntitlement(data.entitlement);
      return { tier: data.tier, period: data.period, email: data.email };
    }
    return null;
  } catch {
    stripUrl();
    return null;
  }
};

// Fetch runtime payment config (live vs demo). Cached for the page's lifetime.
let _configPromise = null;
export const getPaymentsConfig = () => {
  if (!_configPromise) {
    _configPromise = fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((c) => c || { paymentsMode: 'demo', paystackPublicKey: null, availablePlans: {} });
  }
  return _configPromise;
};
