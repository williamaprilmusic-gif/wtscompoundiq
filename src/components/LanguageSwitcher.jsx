// src/components/LanguageSwitcher.jsx
// Lives in the persistent app header (App.jsx), visible on every tab -- previously
// also duplicated as a larger button-grid variant on Start Here specifically, removed
// since the header switcher already covers "find it immediately" without needing a
// second copy that could drift out of sync with the header one.
//
// Wrapped in a pill with a 🌐 glyph and its own caret so a non-English speaker can
// spot it at a glance rather than hunting through identical-looking header controls;
// the element is still a native <select> (best keyboard + mobile picker behaviour),
// just restyled. Its rendered text shows the current flag + language name.
import React from 'react';
import './LanguageSwitcher.css';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <span className="language-switcher" title={t('header.language')}>
      <span className="language-switcher-icon" aria-hidden="true">🌐</span>
      <select
        className="language-switcher-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label={t('header.language')}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
        ))}
      </select>
      <span className="language-switcher-caret" aria-hidden="true">▾</span>
    </span>
  );
};

export default LanguageSwitcher;
