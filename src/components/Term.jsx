// src/components/Term.jsx
// Click/tap a jargon word to reveal a one-line plain-English definition from the shared glossary.
import React, { useState } from 'react';
import './Term.css';
import { GLOSSARY } from '../data/glossary';
import { useLanguage } from '../i18n/LanguageContext';

const Term = ({ k, children }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  // Translated tooltip when one exists (glossary.<k>), else the English GLOSSARY entry.
  const translated = t(`glossary.${k}`);
  const definition = translated !== `glossary.${k}` ? translated : GLOSSARY[k];

  if (!definition) return <>{children}</>;

  return (
    <span className="term-wrap">
      <button
        type="button"
        className="term-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {children}
        <span className="term-hint">?</span>
      </button>
      {open && (
        <span className="term-tooltip" role="tooltip">
          {definition}
        </span>
      )}
    </span>
  );
};

export default Term;
