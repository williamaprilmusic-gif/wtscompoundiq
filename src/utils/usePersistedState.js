// src/utils/usePersistedState.js
// A useState that survives a page reload -- for working data entered into a tab
// (Net Worth's items, Debt Payoff's debts, Invest's goals, ...) that previously lived
// only in component state and vanished on refresh, unlike the "Save This Plan"
// summaries elsewhere in the app. Same corrupt-JSON-safe read/write pattern used
// throughout the rest of the app's localStorage code, just factored into one place so
// three call sites don't each reimplement it slightly differently.
import { useState, useEffect, useRef } from 'react';

// Writes are debounced (see below), so anything that reads these keys straight out of
// localStorage instead of through the hook -- DataBackup's export, notably -- can
// otherwise read a stale value if it runs inside that debounce window (e.g. edit a
// field, immediately click "Export Backup"). Such a reader dispatches this event first
// to force every mounted usePersistedState to flush its latest value synchronously;
// listeners run synchronously in dispatch order, so by the time dispatchEvent returns,
// localStorage is caught up.
export const FLUSH_EVENT = 'wts_compoundiq:flush-persisted-state';

export function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      const parsed = JSON.parse(raw);
      // JSON.parse can succeed on well-formed JSON that's still the wrong shape (a
      // hand-edited value, a stale key from an older version, an imported backup with
      // a mismatched field) -- e.g. a string where callers expect an array and then
      // call .map/.filter on it. Treat a shape mismatch the same as corrupt JSON rather
      // than handing callers a value that doesn't match defaultValue's shape; otherwise
      // the bad value gets written straight back out below and the app can't recover
      // even by reloading.
      // `typeof null === 'object'`, so for a non-array, non-null defaultValue a plain
      // `typeof` comparison would let a stored `null` through as if it matched --
      // guard that case explicitly rather than relying on typeof alone.
      const wrongShape = Array.isArray(defaultValue)
        ? !Array.isArray(parsed)
        : parsed === null ? defaultValue !== null : typeof parsed !== typeof defaultValue;
      return wrongShape ? defaultValue : parsed;
    } catch {
      return defaultValue; // corrupt/foreign JSON in that key -- start fresh rather than crash
    }
  });

  // Kept in sync every render so the unmount-flush effect below can always see the
  // latest value without needing state in its own dependency array.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Debounced write: typing into a list (item name, debt balance, etc.) changes state
  // on every keystroke, and without debouncing that's a full JSON.stringify + a
  // synchronous localStorage write per keystroke. Coalesce rapid changes into one
  // write after things settle.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        /* ignore (private mode, storage full, etc.) -- the in-memory state still works
           for the rest of this session, it just won't survive a reload */
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [key, state]);

  // Two different ways an edit still inside the debounce window can otherwise be lost:
  // (1) tabs in this app fully unmount (rather than just hiding) when the user
  // navigates to another tab, which is a React-level unmount; (2) an actual browser
  // reload/close/back-navigation, which *isn't* a React unmount at all -- the JS
  // context is torn down before a cleanup function would run, so relying on unmount
  // alone still leaves a real (if narrow, ~300ms) window where hitting refresh right
  // after typing loses that last edit, on the one feature whose entire point is
  // surviving a reload. `pagehide` (not `unload`, which is unreliable/deprecated and
  // defeats the back-forward cache) covers the second case; both funnel through the
  // same flush so there's one place that does the actual write.
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(key, JSON.stringify(stateRef.current));
      } catch {
        /* ignore -- see above */
      }
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener(FLUSH_EVENT, flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener(FLUSH_EVENT, flush);
      flush(); // component unmount (e.g. switching tabs within the app)
    };
  }, [key]);

  return [state, setState];
}
