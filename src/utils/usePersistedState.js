// src/utils/usePersistedState.js
// A useState that survives a page reload -- for working data entered into a tab
// (Net Worth's items, Debt Payoff's debts, Invest's goals, ...) that previously lived
// only in component state and vanished on refresh, unlike the "Save This Plan"
// summaries elsewhere in the app. Same corrupt-JSON-safe read/write pattern used
// throughout the rest of the app's localStorage code, just factored into one place so
// three call sites don't each reimplement it slightly differently.
import { useState, useEffect } from 'react';

export function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue; // corrupt/foreign JSON in that key -- start fresh rather than crash
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore (private mode, storage full, etc.) -- the in-memory state still works
         for the rest of this session, it just won't survive a reload */
    }
  }, [key, state]);

  return [state, setState];
}
