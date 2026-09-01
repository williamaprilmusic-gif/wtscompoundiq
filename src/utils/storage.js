// src/utils/storage.js
// Small shared helper for reading a JSON array out of localStorage defensively --
// corrupt/foreign JSON in a key (a hand-edited value, an incompatible imported backup,
// private-mode quirks) should read back as "nothing there" rather than crash whatever
// tries to use it. Originally a local function inside Dashboard.jsx; extracted so
// PowerTools.jsx's cross-tool "pull from X" shortcuts can read the same history keys
// without reimplementing the same try/catch + Array.isArray guard a second time.
export const readJSONArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; } // corrupt/foreign JSON in that key -- treat as no data rather than crash
};

// Mirror of readJSONArray for the write side. The "Log Balance" snapshot buttons in
// EmergencyFund/DebtPayoff/NetWorth call this straight from an onClick with no try/catch
// of their own -- wrapped here (same rationale as savePlanSection in planStorage.js and
// every write in usePersistedState.js) so Safari private-browsing or a full quota, both
// of which make setItem throw, degrades to "this snapshot didn't persist" instead of
// throwing out of the handler and leaving the in-memory history/chart un-updated too.
export const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore (private mode, storage full, etc.) -- caller still updates its own state */ }
};
