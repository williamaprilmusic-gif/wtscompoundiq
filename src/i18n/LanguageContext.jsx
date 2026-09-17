// src/i18n/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, LANGUAGES } from './translations';

const LANGUAGE_KEY = 'wts_compoundiq_language';
const DEFAULT_LANGUAGE = 'en';

// Right-to-left scripts among LANGUAGES -- empty now that this build only carries
// English and Afrikaans (both left-to-right). Kept as a set (rather than removed
// outright) since re-adding a RTL language later is just one more entry here, not a
// redesign -- this app's CSS uses physical properties throughout (margin-left,
// flex-direction: row, icon ordering, etc.), so `dir` alone gets reading direction
// right without mirroring the layout.
const RTL_LANGUAGES = new Set();

const LanguageContext = createContext(null);

const getByPath = (obj, path) => path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_KEY);
      return LANGUAGES.some(l => l.code === stored) ? stored : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* ignore (private mode, storage full, etc.) */ }
  }, [language]);

  // Keeps <html lang> and dir in sync with the active language -- screen readers and
  // browser translation tools read `lang` to know what language the page is actually
  // in (it was hardcoded to "en" in index.html and never updated), and `dir` at least
  // gets RTL script reading direction right (see RTL_LANGUAGES above) even though the
  // rest of the layout isn't mirrored.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = useCallback((code) => {
    if (LANGUAGES.some(l => l.code === code)) setLanguageState(code);
  }, []);

  // Looks up `key` (dot path, e.g. "calculator.title") in the active language, falling
  // back to English if that key isn't translated yet (foundation-level coverage --
  // see translations.js), and finally to the key itself so a genuinely missing key is
  // visibly obvious in development rather than silently blank.
  //
  // `params`, when given, fills `{name}` placeholders in the resolved string with
  // `params.name` -- e.g. t('calculator.crossoverNote', { year: 5 }) turns
  // "...year {year} is when..." into "...year 5 is when...". Every value going in is
  // already caller-formatted (toLocaleString(), toFixed(), etc.), so this is plain
  // string substitution, not a number/date formatter -- it doesn't need to know
  // anything about the active language's numeral or currency conventions, which this
  // app keeps identical across languages (ZAR figures aren't reformatted per locale).
  // A placeholder with no matching param, or a param with no matching placeholder, is
  // left alone rather than throwing -- a missing translation for a newer key still
  // renders something (via the English fallback below) instead of crashing the tab.
  //
  // Memoized on `language` alone -- every consumer (App.jsx calls t() ~40 times per
  // render) would otherwise get a brand-new function and a brand-new context value
  // object on every single render of any component holding state, not just when the
  // language actually changes.
  const t = useCallback((key, params) => {
    const active = getByPath(translations[language], key);
    const fallback = active !== undefined ? active : getByPath(translations[DEFAULT_LANGUAGE], key);
    const raw = fallback !== undefined ? fallback : key;
    if (!params || typeof raw !== 'string') return raw;
    return Object.keys(params).reduce(
      (str, name) => str.split(`{${name}}`).join(params[name]),
      raw
    );
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, languages: LANGUAGES, t }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
