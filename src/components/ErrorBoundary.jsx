// src/components/ErrorBoundary.jsx
// Top-level safety net: without this, one uncaught throw anywhere in the tree
// white-screens the entire app for the user. Class component is required here --
// componentDidCatch/getDerivedStateFromError have no hook equivalent.
import React from 'react';
import './ErrorBoundary.css';
import { translations } from '../i18n/translations';

// This boundary wraps LanguageProvider (see main.jsx), so it can't use the context --
// read the stored language directly and fall back to English.
const tr = (key) => {
  let lang = 'en';
  try { lang = localStorage.getItem('wts_compoundiq_language') || 'en'; } catch { /* ignore */ }
  return translations[lang]?.shell?.[key] ?? translations.en.shell[key];
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // No error-reporting service is wired up (this app sends nothing anywhere, by
    // design -- see the Privacy notice) -- this is purely a local dev breadcrumb.
    console.error('WTS CompoundIQ crashed:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">⚠️</div>
            <h1>{tr('errTitle')}</h1>
            <p>{tr('errBody')}</p>
            <button className="error-boundary-btn" onClick={this.handleReload}>{tr('errReload')}</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
