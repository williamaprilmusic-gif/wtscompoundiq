import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
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