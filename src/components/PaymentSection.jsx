// src/components/PaymentSection.jsx
import React, { useState } from 'react';
import './PaymentSection.css';

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

export default function PaymentSection({ tier, price, country, onSuccess, onClose }) {
  const bankRedirectAvailable = country?.code === 'za';
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handlePaystackRedirect = () => {
    // Real Paystack Integration Key placeholder:
    if (!window.Paystack || typeof price !== 'number') {
      // No live Paystack script is loaded in this demo build, so fall back to the
      // local simulation instead of crashing when a user picks bank-redirect. Also
      // covers Enterprise, whose price is the string 'Custom' -- `price * 100` would
      // silently send Paystack a NaN amount if this path is ever wired up for real.
      simulateLocalPayment();
      return;
    }
    const handler = window.Paystack.setup({
      key: 'pk_test_your_real_paystack_public_key_here', // Replace with your live key
      email: 'user@example.com',
      amount: price * 100, // Paystack expects amount in cents (R199 = 19900 cents)
      currency: 'ZAR',
      label: `Upgrade to ${tier}`,
      callback: function(response) {
        alert('Payment Successful! Reference: ' + response.reference);
        onSuccess(tier);
      },
      onClose: function() {
        alert('Transaction closed or cancelled.');
      }
    });
    handler.openIframe();
  };

  const simulateLocalPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      alert("SIMULATION SUCCESSFUL! Tier upgraded locally for testing.");
      onSuccess(tier);
      setProcessing(false);
    }, 3000);
  };

  return (
    <div className="payment-overlay">
      <div className="payment-card">
        <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        <h3>Demo Upgrade <span className="demo-badge">No Charge</span></h3>
        <p className="payment-sub">You are previewing <strong>{tier}</strong> (normally <strong>{price}/mo</strong>). This is a demo checkout -- no card is charged and no payment is processed.</p>

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

          <button
            className="btn-pay now"
            onClick={paymentMethod === 'bank' && bankRedirectAvailable ? handlePaystackRedirect : simulateLocalPayment}
            disabled={processing}
          >
            {processing ? 'Simulating Upgrade...' : `Simulate Upgrade (No Charge)`}
          </button>
          <small className="secure-note">⚠️ Demo mode: no real payment processor is connected. No card details are collected, validated, or stored.</small>
        </div>
      </div>
    </div>
  );
}
