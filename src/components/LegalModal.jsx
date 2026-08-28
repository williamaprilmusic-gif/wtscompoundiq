// src/components/LegalModal.jsx
// A short, honest Privacy Policy + Terms of Use. Kept accurate to what the app
// actually does (no backend, nothing transmitted) rather than generic boilerplate --
// see DataBackup.jsx and every localStorage-only component this describes.
import React from 'react';
import './LegalModal.css';

export default function LegalModal({ onClose }) {
  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        <h2>Privacy &amp; Terms</h2>
        <p className="legal-updated">Last updated 2026-08-28</p>

        <section>
          <h3>Privacy</h3>
          <ul>
            <li><strong>No account, no signup.</strong> Nothing you enter is tied to an identity.</li>
            <li><strong>Nothing is transmitted anywhere.</strong> This app has no backend server and no
              database -- every number you enter, every saved plan, snapshot, and tier selection lives
              only in your own browser's local storage. Closing the tab doesn't lose it, but clearing
              your browser's site data, using a different browser, or switching devices does (use
              "Export Backup" in the footer to save a copy first).</li>
            <li><strong>No analytics, no trackers, no cookies, no third-party scripts.</strong> This is a
              deliberate, verifiable claim, not a legal disclaimer -- the only network request this app's
              own code makes is its own service worker caching its own files for offline use.</li>
            <li><strong>Backup files</strong> you export or import are plain JSON files that go directly
              between your browser and your own filesystem -- they never pass through any server.</li>
          </ul>
        </section>

        <section>
          <h3>Terms of Use</h3>
          <ul>
            <li><strong>Educational tool, not financial advice.</strong> Every projection, tax figure,
              exchange rate, and recommendation in this app is illustrative and simplified. Tax rules,
              contribution limits, and rates drift and vary by individual circumstance -- verify anything
              you intend to act on with a qualified professional and the relevant authority (SARS, IRS,
              HMRC, etc.) before making financial decisions.</li>
            <li><strong>No warranty.</strong> Figures are provided "as is," may contain errors, and may
              not reflect current law. Nothing here is guaranteed accurate, complete, or up to date.</li>
            <li><strong>The "Upgrade" / payment flow is a demo.</strong> No real payment processor is
              connected. No card details are collected, validated, or stored. "Upgrading" only changes a
              value in your own browser's local storage and unlocks tabs in this preview -- it is not a
              real purchase or subscription.</li>
            <li><strong>Use at your own risk.</strong> The maintainers of WTS CompoundIQ accept no
              liability for decisions made based on this app's output.</li>
          </ul>
        </section>

        <p className="legal-footer-note">Questions about a specific figure? Every country's tax and wrapper data
          shows its own "last verified" date in the Calculator and Tax Optimizer tabs.</p>
      </div>
    </div>
  );
}
