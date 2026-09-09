// src/components/FAQModal.jsx
// Thin modal shell around <FAQHelper>, opened from the footer link next to
// "Privacy & Terms" and "Take the Tour". Same overlay/click-outside/close-button
// pattern as LegalModal. The FAQ content itself (including the Power Tools rundown)
// lives in FAQHelper.jsx and is shared with the Upgrade Plan screen.
import React from 'react';
import './FAQModal.css';
import FAQHelper from './FAQHelper';

export default function FAQModal({ onClose }) {
  return (
    <div className="faq-overlay" onClick={onClose}>
      <div
        className="faq-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Frequently asked questions"
      >
        <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="faq-modal-title">❓ Frequently Asked Questions</h2>
        <FAQHelper />
      </div>
    </div>
  );
}
