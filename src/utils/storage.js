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
