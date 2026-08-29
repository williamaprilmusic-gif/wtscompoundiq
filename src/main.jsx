import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

// Registers public/sw.js so the manifest's installability criteria are actually met
// and the app shell/assets are available offline after a first visit. Guarded so a
// dev server without HTTPS/localhost support, or a browser without the API, just
// skips this instead of throwing. Registered after 'load' so it never competes with
// the initial render for bandwidth/CPU.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support is a bonus, not a requirement */ });
  });
}

// Every number field across the app starts at (or can return to) 0 -- without this,
// clicking into one and typing "5000" produces "05000" (the existing value sits
// wherever the cursor landed, it doesn't get replaced). Select-on-focus fixes that for
// every number input in the app at once, current and future, without touching each of
// the dozens of individual form fields. `focusin` (unlike plain `focus`) bubbles, so
// one listener at the document root catches all of them via delegation.
document.addEventListener('focusin', (e) => {
  if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
    e.target.select();
  }
});