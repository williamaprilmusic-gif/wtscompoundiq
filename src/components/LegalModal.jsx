// src/components/LegalModal.jsx
// The app's legal centre: Terms & Conditions, Privacy Policy, and Refund & Cancellation
// Policy in one modal with a document switcher. Content lives in legalDocs.jsx; this file
// is just the shell -- section numbers come from array position so the prose's
// "Section N" cross-references are the only thing to keep in sync by hand.
import React, { useState } from 'react';
import './LegalModal.css';
import { LEGAL_DOCS } from './legalDocs';

export default function LegalModal({ onClose, initialDoc = 'terms' }) {
  const [activeId, setActiveId] = useState(initialDoc);
  const doc = LEGAL_DOCS.find(d => d.id === activeId) || LEGAL_DOCS[0];

  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Legal documents">
        <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>

        <div className="legal-doc-switch" role="tablist" aria-label="Choose a document">
          {LEGAL_DOCS.map((d, i) => (
            <button
              key={d.id}
              role="tab"
              aria-selected={d.id === activeId}
              className={d.id === activeId ? 'active' : ''}
              onClick={() => { setActiveId(d.id); }}
            >
              {d.tab}
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>

        <div className="legal-doc-body" key={doc.id}>
          <p className="legal-eyebrow">{doc.docLabel}</p>
          <h2>{doc.title}</h2>
          <p className="legal-updated">
            Effective {doc.effective} · Last updated {doc.updated}
          </p>

          {doc.callout && (
            <div className="legal-callout">
              <span className="legal-callout-tag">{doc.callout.tag}</span>
              {doc.callout.body}
            </div>
          )}

          {doc.sections.map((s, i) => (
            <section className="legal-clause" key={i}>
              <h3><span className="legal-num">{i + 1}</span>{s.heading}</h3>
              {s.body}
            </section>
          ))}

          <p className="legal-footer-note">
            This is a substantive review against POPIA, the CPA, ECTA, GDPR, and PAIA — not a
            formal legal opinion from a practicing attorney. Placeholder fields and the
            inline "[Flag for counsel: …]" notes still need a qualified attorney's sign-off
            and your real company details before these documents are relied on.
          </p>
        </div>
      </div>
    </div>
  );
}
