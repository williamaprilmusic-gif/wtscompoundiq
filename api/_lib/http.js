// api/_lib/http.js
// Small shared helpers for the Vercel Node serverless functions in this folder.

export const sendJson = (res, status, obj) => {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
};

// Only allow the given method(s); reply 405 otherwise. Returns true if the request
// should stop here.
export const rejectMethod = (req, res, allowed) => {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!list.includes(req.method)) {
    res.setHeader('Allow', list.join(', '));
    sendJson(res, 405, { error: 'method_not_allowed' });
    return true;
  }
  return false;
};

// Parse a JSON body whether the platform pre-parsed it (req.body is an object) or not
// (req.body is a string, or we have to read the stream). Returns {} on empty/invalid.
export const readJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
};

// Read the raw (unparsed) body as a string -- needed for webhook signature checks,
// which must hash exactly what Paystack sent.
export const readRawBody = async (req) => {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString('utf8');
};

// Best-effort absolute origin of the deployment, for building Paystack callback URLs.
export const originFromRequest = (req) => {
  const envUrl = process.env.PUBLIC_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return host ? `${proto}://${host}` : '';
};
