// api/_lib/rateLimit.js
// A tiny fixed-window rate check, kept pure so it can be unit-tested. The caller holds
// the per-key timestamp list (e.g. in a module-level Map); this just prunes anything
// outside the window and decides whether one more request fits under `max`.
//
// Note on the serverless caveat: a module-level Map only lives as long as one warm
// function instance, so this is best-effort throttling, not a hard guarantee across
// the whole deployment. It's here to blunt casual abuse of an unauthenticated
// endpoint, not to be a security control.
export const checkRate = (timestamps, now, windowMs, max) => {
  const kept = (Array.isArray(timestamps) ? timestamps : []).filter((t) => now - t < windowMs);
  if (kept.length >= max) {
    return { allowed: false, timestamps: kept };
  }
  return { allowed: true, timestamps: [...kept, now] };
};
