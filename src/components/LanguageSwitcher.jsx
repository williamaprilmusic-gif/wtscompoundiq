// src/components/LanguageSwitcher.jsx
// Lives in the persistent app header (App.jsx), visible on every tab -- previously
// also duplicated as a larger button-grid variant on Start Here specifically, removed
// since the header switcher already covers "find it immediately" without needing a
// second copy that could drift out of sync with the header one.
import React from 'react';
import './LanguageSwitcher.css';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <select
      className="language-switcher-compact"
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      aria-label={t('header.language')}
      title={t('header.language')}
    >
      {languages.map((l) => (
        <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;
