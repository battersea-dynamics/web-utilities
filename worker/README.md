# gazza.ltd delivery Worker (shop.gazza.ltd)

Delivers paid downloads after a Stripe payment. **Nothing here is live until you do the steps below.**

## What it does
| Address | What it is for |
|---|---|
| `POST /webhook/stripe` | Stripe tells the Worker "someone paid" (`checkout.session.completed`). Signature is checked with `STRIPE_WEBHOOK_SECRET`. |
| `GET /thanks?session_id=…` | Thank-you page Stripe sends Winter Arc buyers to. Checks the payment with the Stripe API and shows the download buttons straight away (even if the webhook hasn't arrived yet). |
| `GET /api/download-link?session_id=…` | Used by the existing `gazza.ltd/mtd-tracker-thanks/` page. Returns `{ url, files[] }`. |
| `GET /d/<token>` | The download link itself. Streams the file from the private R2 bucket. Each link works for **72 hours and 5 downloads** (matches the terms of sale). The Winter Arc buyer gets two links (colour + printer-friendly), each with its own 5 downloads. |

- Which product was bought is worked out from the Payment Link's **metadata `product`** (`mtd-tracker` or `winter-arc-tracker`). `client_reference_id` keeps carrying the consent version (`ccr-2026-10-v1`) and is copied into the email.
- Products and their files are listed in `src/products.js`.
- Delivery records live in KV and delete themselves after 72 hours (matches the privacy policy).
- Email via Resend is **optional**: if `RESEND_API_KEY` is not set, no email is sent and the on-screen page still works. Policy decision: download links are shown on screen only and the site's legal pages say no download link is emailed, so leave `RESEND_API_KEY` unset in production. (`src/email.js` is kept but unused.)

## Files expected in R2 (bucket `gazza-downloads`)
| Object key (type exactly, including the folder) | File |
|---|---|
| `winter-arc/winter-arc-tracker-A4.pdf` | colour PDF |
| `winter-arc/winter-arc-tracker-A4-printer-friendly.pdf` | printer-friendly PDF |
| `mtd-tracker/mtd-readiness-tracker-2027-28.xlsx` | MTD workbook (when ready) |

## Step-by-step setup (Cloudflare dashboard, then Stripe)

### 1. Create the private R2 bucket and upload the PDFs
1. Go to dash.cloudflare.com → left menu **Storage & databases → R2 object storage** (if asked, enable R2; the free tier needs a card on file but 10 GB is free).
2. **Create bucket** → name `gazza-downloads` → location Automatic → **Create bucket**.
3. Do **not** turn on "Public access" or connect a custom domain to the bucket. It must stay private.
4. In the bucket, click **Upload** → before choosing files, create a folder/prefix `winter-arc` (Add folder / type the prefix) → upload `winter-arc-tracker-A4.pdf` and `winter-arc-tracker-A4-printer-friendly.pdf`. Check the object names show as `winter-arc/winter-arc-tracker-A4.pdf` etc.

### 2. Create the KV namespace
1. Left menu **Storage & databases → Workers KV** → **Create instance / Create namespace** → name `gazza-downloads` → **Create**.
2. Copy its **ID** (a long hex string). Edit `worker/wrangler.toml` and replace `REPLACE_WITH_KV_NAMESPACE_ID` with it (or ask me to do it in this PR — it is not secret).

### 3. Deploy the Worker
Option A (dashboard, no software): **Workers & Pages → Create → Import a repository** → pick GitHub `battersea-dynamics/web-utilities` → **Root directory: `worker`** → Build command blank, Deploy command `npx wrangler deploy` → production branch `main` → **Deploy**. It deploys whenever this code is on `main`, so only do this after this PR is merged.
Option B (terminal): `cd worker && npm install && npx wrangler login && npx wrangler deploy`.

Check: Workers & Pages → `gazza-shop` → **Settings → Bindings** shows `FILES` (R2 `gazza-downloads`) and `DOWNLOADS` (KV). If not, add them there with exactly those names.

### 4. Add the secrets
Workers & Pages → `gazza-shop` → **Settings → Variables and Secrets → Add** → type **Secret**:
- `STRIPE_SECRET_KEY` — Stripe → Developers → API keys → Secret key (`sk_test_…` while testing, later `sk_live_…`). A **restricted key** with read access to Checkout Sessions is enough.
- `STRIPE_WEBHOOK_SECRET` — from step 6 (`whsec_…`).
- `RESEND_API_KEY` — optional, Resend → API Keys → Create (Sending access). In Resend also add and verify domain `gazza.ltd` (it gives DNS records to add in Cloudflare DNS) so mail can come from `orders@gazza.ltd`.
Click **Deploy** after saving. (Terminal alternative: `npx wrangler secret put STRIPE_SECRET_KEY` etc.)

### 5. Custom domain shop.gazza.ltd
`gazza-shop` → **Settings → Domains & Routes → Add → Custom domain** → `shop.gazza.ltd` → **Add**. (wrangler.toml also requests it.) Visit https://shop.gazza.ltd — it should say "gazza.ltd delivery service".

### 6. Stripe (do it all in **Test mode** first — toggle top right)
**Product & Payment Link**
1. Product catalogue → **Add product** → name "Winter Arc 90-Day Habit Tracker", one-off price **£4.50 GBP** → Save.
2. Payment Links → **New** → choose that product, quantity fixed at 1.
3. **After payment** tab → "Don't show confirmation page" → redirect to
   `https://shop.gazza.ltd/thanks?session_id={CHECKOUT_SESSION_ID}` (type the curly-bracket part exactly).
4. **Advanced → Metadata** → key `product`, value `winter-arc-tracker`. (For the MTD link: value `mtd-tracker` and redirect `https://gazza.ltd/mtd-tracker-thanks/?session_id={CHECKOUT_SESSION_ID}`.)
5. Consent: the instant-download tick box is on the gazza.ltd product page, and the site adds `?client_reference_id=ccr-2026-10-v1` to the link automatically — nothing to set in Stripe. Optional extra: Options → "Require customers to accept your terms of service" with link `https://gazza.ltd/terms-of-sale/` (needs a public business website set in Stripe settings).
6. Create link → copy it (`https://buy.stripe.com/…`).

**Webhook**
1. Developers → **Webhooks / Event destinations → Add endpoint** → URL `https://shop.gazza.ltd/webhook/stripe`.
2. Events: `checkout.session.completed` (and `checkout.session.async_payment_succeeded`) → Add.
3. Open it → **Signing secret → Reveal** → paste into the `STRIPE_WEBHOOK_SECRET` secret (step 4).

### 7. Test (still in Test mode)
1. Open the test Payment Link with `?client_reference_id=ccr-2026-10-v1` on the end, pay with card `4242 4242 4242 4242`, any future date, any CVC.
2. You should land on the thank-you page with two download buttons; both PDFs should download. If Resend is set, an email arrives.
3. Stripe → Webhooks → your endpoint should show a `200` delivery.

### 8. Go live
1. Switch Stripe to **Live mode** and repeat step 6 (products, links and webhooks are separate in live mode).
2. Replace the two Worker secrets with the live `sk_live_…` key and the live webhook's `whsec_…`.
3. Edit **`src/data/shop.js`** in the site, line:
   `export const WINTER_ARC_PAYMENT_LINK = 'https://buy.stripe.com/REPLACE_ME';`
   → put the live link between the quotes. That is the only change: the page's "Coming soon" button turns into the tick box + "Buy" button automatically once the link no longer contains `REPLACE_ME`. (MTD: same for `STRIPE_PAYMENT_LINK`.)
4. Commit to `main` → Cloudflare Pages rebuilds gazza.ltd in a couple of minutes.

## Developers
`cd worker && npm test` (node:test, no dependencies). Local run: `npx wrangler dev` with a `.dev.vars` file (git-ignored) holding the secrets.
