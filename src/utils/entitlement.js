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

// Cancel the paying subscription behind the stored entitlement (PayFast). The plan stays
// active until the period already paid for ends, so the caller must NOT drop the tier itself.
// Returns { status, accessUntil? }: 'cancelled' | 'already_cancelled' (both carry accessUntil),
// 'none' / 'unconfigured' / 'invalid' (nothing to cancel server-side -> local downgrade is
// all that's left), or 'error' (PayFast refused or the network failed -> tell the user).
export const cancelSubscription = async () => {
  const current = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
  if (!current) return { status: 'invalid' };
  try {
    const res = await fetch('/api/entitlement/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entitlement: current })
    });
    if (!res.ok) return { status: 'error' };
    const data = await res.json().catch(() => ({}));
    return { status: data.status || 'error', accessUntil: data.accessUntil || null };
  } catch {
    return { status: 'error' };
  }
};

// Recover a paid tier on a browser that has no token -- after clearing site data, or
// on a new device. The subscription still exists on Paystack keyed by the payer's
// email; the server checks it and re-issues a token. Returns
// { status, tier?, period? }: 'restored' (token stored), 'none' (no active
// subscription for that email), 'unconfigured' (payments off / demo mode),
// 'bad_email', or 'error'.
export const restoreEntitlement = async (email) => {
  try {
    const res = await fetch('/api/entitlement/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email || '').trim() })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.status === 'restored' && data.entitlement) {
      storeEntitlement(data.entitlement);
      return { status: 'restored', tier: data.tier, period: data.period };
    }
    if (['none', 'unconfigured', 'bad_email', 'unavailable'].includes(data.status)) return { status: data.status };
    return { status: 'error' };
  } catch {
    return { status: 'error' };
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

// --- PayFast return -------------------------------------------------------------
// PayFast sends the buyer back to /?payment=return&pid=<id>. Their ITN webhook (server to
// server) activates the subscription and can land a few seconds after the redirect, so
// this polls /api/payfast/verify briefly. If it still hasn't landed, the id is kept so the
// next load tries once more. Returns { tier, period, email } when granted, { pending: true }
// when still waiting, or null when there is nothing to do / it was cancelled.
export const PAYFAST_PENDING_KEY = 'wts_compoundiq_payfast_pending';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const consumePayfastReturn = async () => {
  let params;
  try { params = new URLSearchParams(window.location.search); } catch { return null; }
  const status = params.get('payment');
  const stored = (() => { try { return localStorage.getItem(PAYFAST_PENDING_KEY); } catch { return null; } })();
  const returning = status === 'return';
  const pid = returning ? params.get('pid') : stored;

  if (status) {
    try {
      ['payment', 'pid'].forEach((k) => params.delete(k));
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    } catch { /* ignore */ }
  }
  const forget = () => { try { localStorage.removeItem(PAYFAST_PENDING_KEY); } catch { /* ignore */ } };
  if (status === 'cancelled') { forget(); return null; }
  if (!pid || !UUID_RE.test(pid)) return null;

  const attempts = returning ? 10 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch('/api/payfast/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: pid })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'active' && data.entitlement) {
        storeEntitlement(data.entitlement);
        forget();
        return { tier: data.tier, period: data.period, email: data.email };
      }
      if (res.status === 402 || res.status === 404) { forget(); return null; } // failed / unknown
    } catch { /* network blip: keep trying */ }
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, 3000));
  }
  if (returning) {
    try { localStorage.setItem(PAYFAST_PENDING_KEY, pid); } catch { /* ignore */ }
    return { pending: true };
  }
  return null;
};

// Fetch runtime payment config (live vs demo). A good answer is cached for the page's
// lifetime. A FAILED fetch (network, 5xx, timeout) resolves to { failed: true } and is NOT
// cached: it must never read as "demo mode", which would hand out free upgrades whenever
// the config call hiccups. Callers treat `failed` as "checkout unavailable, try again".
let _configPromise = null;
export const getPaymentsConfig = () => {
  if (!_configPromise) {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 8000) : null;
    const p = fetch('/api/config', ctl ? { signal: ctl.signal } : undefined)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((c) => {
        if (timer) clearTimeout(timer);
        if (c && (c.paymentsMode === 'live' || c.paymentsMode === 'demo')) return c;
        if (_configPromise === p) _configPromise = null; // don't cache a failure
        return { failed: true, paymentsMode: null, provider: null, paystackPublicKey: null, availablePlans: {} };
      });
    _configPromise = p;
  }
  return _configPromise;
};
