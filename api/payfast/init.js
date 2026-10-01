// api/payfast/init.js
// POST /api/payfast/init  { email, tier, period }
// Returns { action, fields, paymentId }: the signed form the browser POSTs to PayFast's
// hosted page. A pending subscription row is stored first so the ITN webhook has
// something to match when PayFast confirms the payment.
import crypto from 'node:crypto';
import { rejectMethod, readJsonBody, sendJson, originFromRequest } from '../_lib/http.js';
import { isPayfastConfigured, getConfig, PRICES, FREQUENCY, sign, db } from '../_lib/payfast.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  if (!isPayfastConfigured(process.env)) return sendJson(res, 503, { error: 'payments_not_configured' });

  const { email, tier, period } = await readJsonBody(req);
  const amount = PRICES[tier]?.[period];
  if (!amount || !FREQUENCY[period]) return sendJson(res, 400, { error: 'unknown_plan', tier, period });
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim()) || email.length > 254) {
    return sendJson(res, 400, { error: 'invalid_email' });
  }

  const cfg = getConfig(process.env);
  const origin = originFromRequest(req);
  const paymentId = crypto.randomUUID();
  const price = amount.toFixed(2);

  try {
    await db('subscriptions', {
      method: 'POST',
      body: { payment_id: paymentId, email: email.trim().toLowerCase(), tier, period }
    });
  } catch (err) {
    console.error('payfast init: could not create subscription row', err.message);
    return sendJson(res, 500, { error: 'checkout_failed' });
  }

  // Field order matters: PayFast signs them in exactly this order.
  const entries = [
    ['merchant_id', cfg.merchantId],
    ['merchant_key', cfg.merchantKey],
    ['return_url', `${origin}/?payment=return&pid=${paymentId}`],
    ['cancel_url', `${origin}/?payment=cancelled`],
    ['notify_url', `${origin}/api/payfast/itn`],
    ['email_address', email.trim()],
    ['m_payment_id', paymentId],
    ['amount', price],
    ['item_name', `WTS CompoundIQ ${tier} (${period})`],
    ['subscription_type', '1'],
    ['recurring_amount', price],
    ['frequency', String(FREQUENCY[period])],
    ['cycles', '0']
  ];
  entries.push(['signature', sign(entries, cfg.passphrase)]);

  return sendJson(res, 200, {
    action: `https://${cfg.host}/eng/process`,
    paymentId,
    fields: Object.fromEntries(entries)
  });
}
