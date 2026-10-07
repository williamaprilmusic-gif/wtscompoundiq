// src/components/PaymentSection.jsx
import React, { useEffect, useState } from 'react';
import './PaymentSection.css';
import { getPaymentsConfig, PAYFAST_PENDING_KEY } from '../utils/entitlement';

const SA_BANKS = [
  'Absa Bank',
  'Standard Bank',
  'Nedbank',
  'FNB',
  'Capitec Bank',
  'African Bank',
  'Investec',
  'TymeBank',
  'Discovery Bank',
  'Bank Zero',
  'Bidvest Bank',
  'Sasfin Bank',
  'Mercantile Bank'
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PaymentSection({ tier, price, period = 'monthly', country, onSuccess, onClose, action = 'Upgrade' }) {
  // 'Upgrade' or 'Downgrade' -- App.jsx sets it from the current vs. target tier rank so
  // this screen's wording matches the pricing card the user just clicked.
  const actioning = `${action.slice(0, -1)}ing…`; // "Upgrading…" / "Downgrading…"
  const bankRedirectAvailable = country?.code === 'za';
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  // The app has no account system (see Terms § "No Account, Local-First Data") -- this
  // is the ONLY place anywhere in the app that ever asks for an email address, and only
  // because the payment processor requires one per transaction (for the receipt and to
  // de-duplicate a returning customer). In live mode it's posted to our /api/<provider>/init
  // and on to the processor; with PayFast it is also kept in the subscription record (see
  // the Privacy Policy, "Information We Do Collect") so a plan can be confirmed and restored.
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  // 'loading' until /api/config answers, then 'live' (real checkout), 'demo' (no charge,
  // only when the server says so) or 'unavailable' (config failed or this plan isn't offered).
  const [mode, setMode] = useState('loading');
  const [attempt, setAttempt] = useState(0); // bumped by "Try again" to re-fetch /api/config
  // Which processor is live: 'payfast' | 'paystack' (from /api/config).
  const [provider, setProvider] = useState('paystack');
  const periodLabel = period === 'annual' ? '/yr' : '/mo';
  const priceLabel = typeof price === 'number' ? `R${price.toLocaleString()}${periodLabel}` : price;

  useEffect(() => {
    let alive = true;
    getPaymentsConfig().then((cfg) => {
      if (!alive) return;
      const livePlan =
        cfg?.paymentsMode === 'live' &&
        Array.isArray(cfg.availablePlans?.[tier]) &&
        cfg.availablePlans[tier].includes(period) &&
        typeof price === 'number';
      // A failed config fetch or an unoffered plan is NEVER demo mode: demo grants the tier
      // for free, so only an explicit server answer of 'demo' may reach it.
      setMode(livePlan ? 'live' : cfg?.paymentsMode === 'demo' ? 'demo' : 'unavailable');
      setProvider(cfg?.provider === 'payfast' ? 'payfast' : 'paystack');
    });
    return () => { alive = false; };
  }, [tier, period, price, attempt]);

  // Escape closes the dialog.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // --- LIVE: hand off to the processor's hosted checkout --------------------------
  const startLiveCheckout = async () => {
    if (!EMAIL_RE.test(email.trim())) { setEmailError(true); return; }
    setProcessing(true);
    setCheckoutError('');
    try {
      if (provider === 'payfast') {
        const pfRes = await fetch('/api/payfast/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), tier, period })
        });
        const pf = await pfRes.json().catch(() => ({}));
        if (pfRes.ok && pf.action && pf.fields) {
          // Remember the receipt id so a slow webhook can be picked up on the next load.
          try { localStorage.setItem(PAYFAST_PENDING_KEY, pf.paymentId); } catch { /* ignore */ }
          // PayFast's checkout is a form POST, not a redirect URL (CSP form-action allows it).
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = pf.action;
          for (const [name, value] of Object.entries(pf.fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
          return;
        }
        setCheckoutError('Could not start checkout. Please try again.');
        setProcessing(false);
        return;
      }
      const res = await fetch('/api/paystack/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), tier, period })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.authorization_url) {
        // Leaves the SPA for Paystack's PCI-compliant page; on return App.jsx's mount
        // effect picks up ?reference= and verifies it.
        window.location.href = data.authorization_url;
        return;
      }
      setCheckoutError(data.message || 'Could not start checkout. Please try again.');
    } catch {
      setCheckoutError('Network error starting checkout. Please try again.');
    }
    setProcessing(false);
  };

  // --- DEMO: unchanged no-charge simulation -------------------------------------
  const simulateLocalPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      onSuccess(tier);
      setProcessing(false);
    }, 600);
  };

  if (mode === 'loading' || mode === 'unavailable') {
    const failed = mode === 'unavailable';
    return (
      <div className="payment-overlay">
        <div className="payment-card" role="dialog" aria-modal="true" aria-label="Checkout">
          <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
          <p className="payment-sub">
            {failed ? "Checkout isn't available right now. Please check your connection and try again." : 'Loading checkout…'}
          </p>
          {failed && (
            <button className="btn-pay now" onClick={() => { setMode('loading'); setAttempt((n) => n + 1); }}>
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'live') {
    return (
      <div className="payment-overlay">
        <div className="payment-card" role="dialog" aria-modal="true" aria-label={`${action} to ${tier}`}>
          <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
          <h3>{action} to {tier}</h3>
          <p className="payment-sub">
            <strong>{priceLabel}</strong>, billed {period === 'annual' ? 'yearly' : provider === 'payfast' ? 'monthly' : 'every 30 days'} via {provider === 'payfast' ? 'PayFast' : 'Paystack'}.
            {provider === 'payfast'
              ? ' You can cancel anytime from your PayFast account or the link in your PayFast receipt email.'
              : ' You can cancel anytime from the app.'}
          </p>

          <input
            type="email"
            className={`payment-email-input ${emailError ? 'has-error' : ''}`}
            placeholder="Email for your receipt"
            aria-label="Email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(false); }}
          />
          {emailError && <small className="payment-email-hint">Enter a valid email to continue.</small>}
          {checkoutError && <small className="payment-email-hint">{checkoutError}</small>}

          <button className="btn-pay now" onClick={startLiveCheckout} disabled={processing}>
            {processing ? 'Starting checkout…' : 'Continue to secure checkout →'}
          </button>
          <small className="secure-note">
            🔒 Card details are entered on {provider === 'payfast' ? "PayFast's" : "Paystack's"} own PCI-DSS-compliant page — never on this site.
          </small>
        </div>
      </div>
    );
  }

  // --- DEMO MODE (default when live payments aren't configured) ------------------
  return (
    <div className="payment-overlay">
      <div className="payment-card" role="dialog" aria-modal="true" aria-label={`Demo ${action}`}>
        <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        <h3>Demo {action} <span className="demo-badge">No Charge</span></h3>
        <p className="payment-sub">You are previewing <strong>{tier}</strong> (normally <strong>{priceLabel}</strong>). This is a demo checkout -- no card is charged and no payment is processed.</p>

        <input
          type="email"
          className="payment-email-input"
          placeholder="Email (optional in this demo)"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {bankRedirectAvailable && (
          <div className="payment-methods-toggle">
            <button
              className={paymentMethod === 'card' ? 'active' : ''}
              onClick={() => setPaymentMethod('card')}
            >
              Credit / Debit Card
            </button>
            <button
              className={paymentMethod === 'bank' ? 'active' : ''}
              onClick={() => setPaymentMethod('bank')}
            >
              Bank Redirect (Payfast/Paystack)
            </button>
          </div>
        )}

        <div className="payment-form">
          {paymentMethod === 'card' || !bankRedirectAvailable ? (
            <div className="card-fields">
              <input type="text" placeholder="Card Number (e.g. 4111 1111 1111 1111)" aria-label="Card number" />
              <div className="row">
                <input type="text" placeholder="MM / YY" aria-label="Card expiry (MM / YY)" style={{width:'50%'}} />
                <input type="text" placeholder="CVV" aria-label="Card CVV" style={{width:'50%'}} />
              </div>
              <input type="text" placeholder="Card Holder Name" aria-label="Card holder name" />
            </div>
          ) : (
            <div className="bank-fields">
              <select aria-label="Bank">
                {SA_BANKS.map((bank) => <option key={bank}>{bank}</option>)}
              </select>
              <input type="text" placeholder="Account Number / Phone Number" aria-label="Account number or phone number" />
            </div>
          )}

          <div id="payment-container"></div>

          <button className="btn-pay now" onClick={simulateLocalPayment} disabled={processing}>
            {processing ? actioning : `Simulate ${action} (No Charge)`}
          </button>
          <small className="secure-note">⚠️ Demo mode: no real payment processor is connected. No card details are collected, validated, or stored.</small>
        </div>
      </div>
    </div>
  );
}
