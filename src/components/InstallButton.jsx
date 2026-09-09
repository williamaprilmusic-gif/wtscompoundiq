// src/components/InstallButton.jsx
// Footer entry point for installing the app to a device. The PWA plumbing (manifest +
// service worker) already lives in index.html / public/; this just surfaces it:
//  - Chrome / Edge / Android fire `beforeinstallprompt`, which we stash and replay from
//    a click (the only way the native install dialog is allowed to open).
//  - iOS Safari has no such event -- installing is a manual "Share -> Add to Home
//    Screen", so we show a one-line how-to instead.
//  - Already running installed (display-mode: standalone) -> render nothing.
import React, { useEffect, useState } from 'react';
import './InstallButton.css';

const isStandalone = () => {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
};

const isIOS = () => {
  try {
    return /iP(hone|ad|od)/.test(window.navigator.userAgent) && !window.MSStream;
  } catch {
    return false;
  }
};

export default function InstallButton() {
  const [deferred, setDeferred] = useState(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  // No captured prompt and not iOS -> the browser either can't install or already
  // offers it in its own menu; don't show a button that would do nothing.
  if (!deferred && !isIOS()) return null;

  const onClick = async () => {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch { /* dismissed */ }
      setDeferred(null);
      return;
    }
    setShowIosHelp((v) => !v);
  };

  return (
    <>
      {' '}· <button className="footer-link-btn install-btn" onClick={onClick}>📲 Install app</button>
      {showIosHelp && (
        <span className="install-ios-help">
          {' '}— tap the <strong>Share</strong> icon, then <strong>Add to Home Screen</strong>.
        </span>
      )}
    </>
  );
}
