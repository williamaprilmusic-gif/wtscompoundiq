// api/backup/email.js
// POST /api/backup/email  { email, backup }
//
// Optional convenience: emails the caller a JSON copy of their own app data (the same
// blob the in-app "Save to device" export produces) as an attachment, so they can move
// it to another device or keep an off-machine copy. There is no account and nothing is
// stored server-side -- the blob is held in memory only for the moment it takes to
// hand it to the email provider, then discarded.
//
// Because the endpoint is unauthenticated (there are no accounts), it is deliberately
// narrow: it only ever sends to the address supplied in the same request, caps the
// payload size, and best-effort rate-limits per IP+email. It stays inert until an
// email provider is configured (RESEND_API_KEY + EMAIL_FROM), mirroring how the
// Paystack paths stay in demo mode until their keys are set.
import { rejectMethod, readJsonBody, sendJson } from '../_lib/http.js';
import { checkRate } from '../_lib/rateLimit.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_BYTES = 512 * 1024; // a real backup is a few KB; this is a generous abuse cap
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;

// Per-warm-instance throttle. See api/_lib/rateLimit.js on why this is best-effort.
const hits = new Map();

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return sendJson(res, 200, { status: 'unconfigured' });
  }

  const { email, backup } = await readJsonBody(req);
  const clean = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) {
    return sendJson(res, 400, { status: 'bad_email' });
  }

  if (!backup || typeof backup !== 'object' || typeof backup.data !== 'object' || backup.data === null) {
    return sendJson(res, 400, { status: 'bad_payload' });
  }
  const json = JSON.stringify(backup, null, 2);
  if (Buffer.byteLength(json, 'utf8') > MAX_BYTES) {
    return sendJson(res, 413, { status: 'too_large' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const key = `${ip}|${clean}`;
  const gate = checkRate(hits.get(key), Date.now(), RATE_WINDOW_MS, RATE_MAX);
  hits.set(key, gate.timestamps);
  if (!gate.allowed) {
    return sendJson(res, 429, { status: 'rate_limited' });
  }

  const filename = `wts-compoundiq-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const text = [
    'Attached is a JSON backup of your WTS CompoundIQ data, taken from the app at your request.',
    '',
    'To restore it: open the app, scroll to the footer, choose "Import Backup", and pick this file.',
    '',
    'Keep this file somewhere safe -- it contains the financial-planning figures you entered.',
    'If you did not request this, you can ignore and delete this email; nothing was changed.'
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: clean,
        subject: 'Your WTS CompoundIQ backup',
        text,
        attachments: [{ filename, content: Buffer.from(json, 'utf8').toString('base64') }]
      })
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return sendJson(res, 502, { status: 'error', detail: detail.slice(0, 200) });
    }
    return sendJson(res, 200, { status: 'sent' });
  } catch (err) {
    return sendJson(res, 502, { status: 'error', message: err.message });
  }
}
