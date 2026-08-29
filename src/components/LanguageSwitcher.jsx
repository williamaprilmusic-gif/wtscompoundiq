// src/components/LanguageSwitcher.jsx
// One reusable switcher, used both compact (header, any tab) and full-size (Start Here,
// so a new visitor can find it immediately without hunting through the header).
import React from 'react';
import './LanguageSwitcher.css';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher = ({ compact = false }) => {
  const { language, setLanguage, languages, t } = useLanguage();

  if (compact) {
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
  }

  return (
    <div className="language-switcher-full">
      {languages.map((l) => (
        <button
          key={l.code}
          className={`language-switcher-btn ${language === l.code ? 'active' : ''}`}
          onClick={() => setLanguage(l.code)}
        >
          {l.flag} {l.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
