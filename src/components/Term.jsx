// src/components/Term.jsx
// Click/tap a jargon word to reveal a one-line plain-English definition from the shared glossary.
import React, { useState } from 'react';
import './Term.css';
import { GLOSSARY } from '../data/glossary';

const Term = ({ k, children }) => {
  const [open, setOpen] = useState(false);
  const definition = GLOSSARY[k];

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
