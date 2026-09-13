# Live payments (Paystack subscriptions)

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
