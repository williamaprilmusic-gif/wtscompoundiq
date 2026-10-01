# Live payments (PayFast or Paystack subscriptions)

> **PayFast** is the preferred provider and is described first below; the Paystack
> sections that follow still work unchanged. If both are configured, PayFast wins
> (`api/_lib/provider.js`). `GET /api/config` reports which one is live.

## PayFast

Same entitlement-token design as Paystack (signed token in the browser, re-checked on
every load), with one difference: PayFast can't be asked "does this email have an active
subscription?", so a small Supabase table (`public.subscriptions`, RLS on, no public
policies, service-role access only) records each checkout and is kept current by
PayFast's **ITN webhook**.

1. **Checkout** — `POST /api/payfast/init { email, tier, period }` stores a `pending`
   row and returns a signed form. The browser POSTs it to PayFast's hosted page.
   Amounts come from `PRICES` in `api/_lib/payfast.js`, **never** from the browser;
   `payfast.test.js` fails if they drift from `TierPricing.jsx`.
2. **Webhook** — PayFast calls `POST /api/payfast/itn`. It only activates the row after
   four checks: signature (ITN signatures *include* blank fields), source IP is PayFast,
   amount matches our price, and PayFast's own `/eng/query/validate` says VALID. Every
   rejection is logged with its reason (Vercel → Logs).
3. **Return** — PayFast sends the buyer to `/?payment=return&pid=…`; the app polls
   `POST /api/payfast/verify` until the webhook has landed, then stores the same signed
   entitlement token Paystack issues.
4. **Revalidate / restore** — `/api/entitlement/refresh` and `/restore` read the table
   instead of calling Paystack. A cancelled subscription (webhook `CANCELLED`) lapses
   on the next load.

### PayFast environment variables

| Variable | What it is |
| --- | --- |
| `PAYFAST_ENV` | `sandbox` (default, no real money) or `live`. `PAYFAST_MODE` also works. |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` | **Live** merchant credentials (PayFast dashboard → Settings → Integration). Used only when `PAYFAST_ENV=live`. |
| `PAYFAST_SANDBOX_MERCHANT_ID`, `PAYFAST_SANDBOX_MERCHANT_KEY`, `PAYFAST_SANDBOX_PASSPHRASE` | Your own free account from sandbox.payfast.co.za. Used only in sandbox. PayFast's shared test merchant (10000100) rejects signed requests, so don't use it. |
| `ENTITLEMENT_SECRET` | Long random string; signs entitlement tokens (same as Paystack). |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | The billing project. The service-role key bypasses RLS — server only, never `VITE_`-prefixed. |
| `PUBLIC_BASE_URL` | Optional origin override for the return/notify URLs. |

### Cancelling and what a buyer keeps

- **In-app**: the pricing modal's "Downgrade to Basic" calls `POST /api/entitlement/cancel`
  (authenticated by the signed entitlement token). It cancels the subscription at PayFast
  (`PUT /subscriptions/:token/cancel`) and the app keeps the tier until the paid period ends.
  It also works from the buyer's PayFast account / receipt email; PayFast's CANCELLED
  notice then reaches `/api/payfast/itn`.
- **End of period**: each successful payment sets `subscriptions.paid_through` (PayFast's
  `billing_date`, +1 day). A `cancelled` row still entitles the buyer until `paid_through`.
  A plan replaced by a newer purchase is `superseded` with `paid_through` cleared, so it never
  counts. Failed payments (`failed`) cut access immediately.
- **Webhook rules**: access-granting notices (COMPLETE) get all four checks. Access-removing
  ones (CANCELLED/FAILED) rely on signature + PayFast source IP (+ matching token), because
  PayFast's validate endpoint answers INVALID for them.

### Known gaps before launch

- Annual-plan renewal reminders (CPA §14, 40–80 business days ahead, in-app + email) are
  promised in the Terms but **not built**; no email sender is configured in production. Needed
  before the first annual renewal (~12 months after the first annual sale).
- Upgrading mid-period cancels the old plan without crediting its unused time (policy decision
  flagged in the Refund Policy).

Going live: set `PAYFAST_ENV=live`, redeploy, then make one small real purchase yourself
before announcing, and delete the two "[Remove this paragraph once live billing is switched
on.]" demo-mode paragraphs in the Terms (§7) and Refund Policy (Overview).

---

# Paystack

The app ships in **demo mode** — the upgrade modal simulates a charge and unlocks the
tier locally, nothing is billed. It switches itself to **live mode** the moment the
environment variables below are set on the Vercel project. No code change, no redeploy
of logic — just env vars + a redeploy to pick them up.

## How it works

The app has no user accounts and no database, so a paid tier is represented by a
**signed entitlement token** stored in the browser (next to the existing
`wts_compoundiq_tier` value):

1. **Checkout** — user picks Pro/Ultra, enters an email. `POST /api/paystack/init`
   creates a Paystack subscription transaction for the matching plan code and returns
   `authorization_url`. The browser redirects there (Paystack's own PCI-DSS page).
2. **Return** — Paystack redirects back to `/?reference=…`. On load the app calls
   `POST /api/paystack/verify`, which confirms the transaction with Paystack and, on
   success, returns an HMAC-signed token `{ email, tier, period, iat, exp }`. The token
   is stored; its tier unlocks immediately.
3. **Revalidation** — every subsequent app load calls `POST /api/entitlement/refresh`
   with the token. The server re-checks Paystack for an active subscription on that
   email and either rotates the token (sliding ~35-day / ~370-day expiry) or tells the
   client the subscription **lapsed**, which downgrades it to Basic. If the server or
   Paystack is unreachable, a still-valid token is kept (offline grace) so an outage
   never locks a paying user out.
4. **Webhook** — `POST /api/paystack/webhook` verifies Paystack's `x-paystack-signature`
   and logs subscription events. With no datastore it can't push state to a specific
   browser, so step 3 is the actual enforcement path; the webhook is a logging hook and
   a ready seam for a future KV/DB (record `email -> status` there for instant effect).

A forged token fails the HMAC check server-side and unlocks nothing through the
verified path. (A user editing `localStorage` by hand can still flip the *legacy*
`wts_compoundiq_tier` string, exactly as before this change — tighten that later by
gating `canAccess` on a verified entitlement if it matters.)

## Environment variables (set in Vercel → Project → Settings → Environment Variables)

| Variable | Scope | What it is |
| --- | --- | --- |
| `PAYSTACK_SECRET_KEY` | server only | `sk_live_…` (or `sk_test_…`). Never `VITE_`-prefixed. |
| `ENTITLEMENT_SECRET` | server only | Any long random string (e.g. `openssl rand -hex 32`). Signs entitlement tokens. Rotating it invalidates all outstanding tokens. |
| `PAYSTACK_PUBLIC_KEY` | server (exposed via `/api/config`) | `pk_live_…`. Optional; only used if you later switch to an inline widget. |
| `PAYSTACK_PLAN_PRO_MONTHLY` | server | Paystack **Plan code** (`PLN_…`) for Pro monthly. |
| `PAYSTACK_PLAN_PRO_ANNUAL` | server | `PLN_…` for Pro annual. |
| `PAYSTACK_PLAN_ULTRA_MONTHLY` | server | `PLN_…` for Ultra monthly. |
| `PAYSTACK_PLAN_ULTRA_ANNUAL` | server | `PLN_…` for Ultra annual. |
| `PUBLIC_BASE_URL` | server | Optional. Override for the checkout callback origin (e.g. `https://wtscompoundiq.vercel.app`). Auto-detected from request headers if unset. |

Live mode activates when `PAYSTACK_SECRET_KEY` **and** `ENTITLEMENT_SECRET` **and** at
least one `PAYSTACK_PLAN_*` code are all present. Set only Pro codes and Ultra simply
stays demo-only, etc.

## One-time Paystack setup

1. Create a Paystack account, complete business verification (FICA/KYC), add your SA
   bank account for settlement.
2. **Plans**: Paystack Dashboard → Plans → create four — Pro monthly (R149), Pro annual
   (R1,199), Ultra monthly (R249), Ultra annual (R1,999), currency ZAR, billing
   interval monthly / annually respectively. Copy each `PLN_…` code into the env vars
   above. (Keep the amounts in sync with `src/components/TierPricing.jsx` — the numeric
   `price` / `priceAnnual` fields there are the source of truth for what's advertised.)
3. **Webhook**: Dashboard → Settings → API Keys & Webhooks → set the webhook URL to
   `https://<your-domain>/api/paystack/webhook`.
4. Deploy. Confirm `GET /api/config` returns `"paymentsMode":"live"`.

## Local development

`vercel dev` runs the `/api` functions locally. Put the same vars in `.env.local`
(git-ignored). Without them, `npm run dev` just serves the app in demo mode — the
`/api/*` calls fail and the client falls back cleanly.

## Legal

`src/components/legalDocs.jsx` already describes Paystack as the processor throughout.
Two paragraphs are marked `[Remove this paragraph once live billing is switched on.]`
(Terms §7, Refund §1) — delete those when you go live, and fill the remaining
`<Fill>` company details. An admitted SA attorney should review before launch.

## CSP

`vercel.json`'s `connect-src 'self'` is fine — the browser only calls same-origin
`/api/*`, and the Paystack hand-off is a full-page redirect. If you ever switch to
Paystack's **inline** widget you'll need to add `https://checkout.paystack.com` to
`script-src` and `frame-src`.

## Optional: emailing yourself a backup

Separate from payments, but the same "stays inert until configured" pattern:
`POST /api/backup/email` lets a user send themselves a JSON copy of their own saved
data (the same file "Save to Device" produces) as an email attachment. It routes
through [Resend](https://resend.com), a transactional email provider — nothing is
stored server-side either way.

| Variable | Scope | What it is |
| --- | --- | --- |
| `RESEND_API_KEY` | server only | `re_…` from the Resend dashboard. |
| `EMAIL_FROM` | server only | The verified sender address, e.g. `WTS CompoundIQ <backups@yourdomain.co.za>`. Resend requires the domain to be verified first. |

Without both set, the endpoint returns `{ status: 'unconfigured' }` and the app's
"Email a Copy" button tells the user to use "Save to Device" instead — no build or code
change needed either way. The endpoint also caps the payload size and applies a
best-effort per-IP+email rate limit (`api/_lib/rateLimit.js`) since it's unauthenticated
by design (no accounts to authenticate against). `src/components/legalDocs.jsx` names
Resend as the processor for this optional feature — update that paragraph if you switch
providers.
