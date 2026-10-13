// src/components/PaymentSection.jsx
import React, { useEffect, useState } from 'react';
import './PaymentSection.css';
import { getPaymentsConfig, PAYFAST_PENDING_KEY } from '../utils/entitlement';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t } = useLanguage();
  // 'Upgrade' or 'Downgrade' -- App.jsx sets it from the current vs. target tier rank so
  // this screen's wording matches the pricing card the user just clicked. The values stay
  // English identifiers; the wording shown comes from the translations.
  const isDowngradeAction = action === 'Downgrade';
  const actioning = t(isDowngradeAction ? 'payment.downgrading' : 'payment.upgrading');
  const actionTitle = t(isDowngradeAction ? 'payment.downgradeTo' : 'payment.upgradeTo', { tier });
  const actionWord = t(isDowngradeAction ? 'payment.actionDowngrade' : 'payment.actionUpgrade');
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
  const periodLabel = period === 'annual' ? t('payment.perYr') : t('payment.perMo');
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
        setCheckoutError(t('payment.startError'));
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
      setCheckoutError(data.message || t('payment.startError'));
    } catch {
      setCheckoutError(t('payment.networkError'));
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
        <div className="payment-card" role="dialog" aria-modal="true" aria-label={t('payment.checkoutAria')}>
          <button className="close-btn" onClick={onClose} aria-label={t('payment.close')}>&times;</button>
          <p className="payment-sub">
            {failed ? t('payment.unavailable') : t('payment.loading')}
          </p>
          {failed && (
            <button className="btn-pay now" onClick={() => { setMode('loading'); setAttempt((n) => n + 1); }}>
              {t('payment.tryAgain')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'live') {
    return (
      <div className="payment-overlay">
        <div className="payment-card" role="dialog" aria-modal="true" aria-label={actionTitle}>
          <button className="close-btn" onClick={onClose} aria-label={t('payment.close')}>&times;</button>
          <h3>{actionTitle}</h3>
          <p className="payment-sub">
            <strong>{priceLabel}</strong>{t('payment.billedRest', { period: t(period === 'annual' ? 'payment.billedYearly' : provider === 'payfast' ? 'payment.billedMonthly' : 'payment.billedEvery30'), provider: provider === 'payfast' ? 'PayFast' : 'Paystack' })}
            {provider === 'payfast'
              ? t('payment.cancelPayfast')
              : t('payment.cancelApp')}
          </p>

          <input
            type="email"
            className={`payment-email-input ${emailError ? 'has-error' : ''}`}
            placeholder={t('payment.emailPlaceholder')}
            aria-label={t('payment.emailAria')}
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(false); }}
          />
          {emailError && <small className="payment-email-hint">{t('payment.emailInvalid')}</small>}
          {checkoutError && <small className="payment-email-hint">{checkoutError}</small>}

          <button className="btn-pay now" onClick={startLiveCheckout} disabled={processing}>
            {processing ? t('payment.starting') : t('payment.continue')}
          </button>
          <small className="secure-note">
            {t('payment.secureNote', { provider: provider === 'payfast' ? 'PayFast' : 'Paystack' })}
          </small>
        </div>
      </div>
    );
  }

  // --- DEMO MODE (default when live payments aren't configured) ------------------
  return (
    <div className="payment-overlay">
      <div className="payment-card" role="dialog" aria-modal="true" aria-label={t('payment.demoTitle', { action: actionWord })}>
        <button className="close-btn" onClick={onClose} aria-label={t('payment.close')}>&times;</button>
        <h3>{t('payment.demoTitle', { action: actionWord })} <span className="demo-badge">{t('payment.demoBadge')}</span></h3>
        <p className="payment-sub">{t('payment.demoSub', { tier, price: priceLabel })}</p>

        <input
          type="email"
          className="payment-email-input"
          placeholder={t('payment.demoEmail')}
          aria-label={t('payment.emailAria')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {bankRedirectAvailable && (
          <div className="payment-methods-toggle">
            <button
              className={paymentMethod === 'card' ? 'active' : ''}
              onClick={() => setPaymentMethod('card')}
            >
              {t('payment.card')}
            </button>
            <button
              className={paymentMethod === 'bank' ? 'active' : ''}
              onClick={() => setPaymentMethod('bank')}
            >
              {t('payment.bank')}
            </button>
          </div>
        )}

        <div className="payment-form">
          {paymentMethod === 'card' || !bankRedirectAvailable ? (
            <div className="card-fields">
              <input type="text" placeholder={t('payment.cardNumber')} aria-label={t('payment.cardNumberAria')} />
              <div className="row">
                <input type="text" placeholder={t('payment.expiry')} aria-label={t('payment.expiryAria')} style={{width:'50%'}} />
                <input type="text" placeholder="CVV" aria-label={t('payment.cvvAria')} style={{width:'50%'}} />
              </div>
              <input type="text" placeholder={t('payment.holder')} aria-label={t('payment.holderAria')} />
            </div>
          ) : (
            <div className="bank-fields">
              <select aria-label={t('payment.bankAria')}>
                {SA_BANKS.map((bank) => <option key={bank}>{bank}</option>)}
              </select>
              <input type="text" placeholder={t('payment.account')} aria-label={t('payment.accountAria')} />
            </div>
          )}

          <div id="payment-container"></div>

          <button className="btn-pay now" onClick={simulateLocalPayment} disabled={processing}>
            {processing ? actioning : t('payment.simulate', { action: actionWord })}
          </button>
          <small className="secure-note">{t('payment.demoNote')}</small>
        </div>
      </div>
    </div>
  );
}
