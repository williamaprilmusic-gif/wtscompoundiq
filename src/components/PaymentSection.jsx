// src/components/PaymentSection.jsx
import React, { useEffect, useState } from 'react';
import './PaymentSection.css';
import { getPaymentsConfig } from '../utils/entitlement';

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

export default function PaymentSection({ tier, price, period = 'monthly', country, onSuccess, onClose }) {
  const bankRedirectAvailable = country?.code === 'za';
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  // The app has no account system (see Terms § "No Account, Local-First Data") -- this
  // is the ONLY place anywhere in the app that ever asks for an email address, and only
  // because Paystack requires one per transaction (for the receipt and to de-duplicate
  // a returning customer). In live mode it's posted to our /api/paystack/init and then
  // straight on to Paystack; this app never stores it.
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  // 'loading' until /api/config answers, then 'live' (real Paystack) or 'demo' (no charge).
  const [mode, setMode] = useState('loading');
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
      setMode(livePlan ? 'live' : 'demo');
    });
    return () => { alive = false; };
  }, [tier, period, price]);

  // --- LIVE: hand off to Paystack's hosted checkout -------------------------------
  const startLiveCheckout = async () => {
    if (!EMAIL_RE.test(email.trim())) { setEmailError(true); return; }
    setProcessing(true);
    setCheckoutError('');
    try {
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

  if (mode === 'loading') {
    return (
      <div className="payment-overlay">
        <div className="payment-card">
          <p className="payment-sub">Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (mode === 'live') {
    return (
      <div className="payment-overlay">
        <div className="payment-card">
          <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
          <h3>Upgrade to {tier}</h3>
          <p className="payment-sub">
            <strong>{priceLabel}</strong>, billed {period === 'annual' ? 'yearly' : 'every 30 days'} via Paystack.
            You can cancel anytime from the app.
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
            🔒 Card details are entered on Paystack's own PCI-DSS-compliant page — never on this site.
          </small>
        </div>
      </div>
    );
  }

  // --- DEMO MODE (default when live payments aren't configured) ------------------
  return (
    <div className="payment-overlay">
      <div className="payment-card">
        <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        <h3>Demo Upgrade <span className="demo-badge">No Charge</span></h3>
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
            {processing ? 'Upgrading…' : `Simulate Upgrade (No Charge)`}
          </button>
          <small className="secure-note">⚠️ Demo mode: no real payment processor is connected. No card details are collected, validated, or stored.</small>
        </div>
      </div>
    </div>
  );
}
