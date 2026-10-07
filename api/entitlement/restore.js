// api/entitlement/restore.js
// POST /api/entitlement/restore  { email }
//
// DISABLED (security): this used to re-issue a signed entitlement token for any email
// that had an active subscription, with no proof the caller owned that mailbox. Anyone
// who knew a subscriber's email could therefore get their paid tier for free, use the
// token to cancel their PayFast subscription, and tell subscribers from non-subscribers
// by the response. Until restore can prove mailbox ownership (a one-time link or code
// emailed to the address, which needs a transactional-email key), it never issues a
// token and gives the same answer whatever the email is, so it reveals nothing.
// People who lost their browser data are pointed at support instead.
import { rejectMethod, sendJson } from '../_lib/http.js';
import { paymentProvider } from '../_lib/provider.js';

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  if (!paymentProvider(process.env)) {
    // Demo mode: no real purchases exist, so there is nothing to restore.
    return sendJson(res, 200, { status: 'unconfigured' });
  }
  return sendJson(res, 200, { status: 'unavailable' });
}
