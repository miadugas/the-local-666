# Grave Goods — Build Status & Next Steps

_Last updated: 2026-05-21_

**TL;DR:** Backend v1 is **code-complete and verified end-to-end locally**. The store works: live catalog, admin (auth + editor + image upload), cart, Stripe checkout → webhook → order, and Resend receipts. Remaining work is **real prices/specs** and **deploy to the_litterbox** (where the live secrets, domain, and cookie checks all converge).

---

## 1. What's shipped ✅

### Stack

- Frontend: Vue 3 + Vite + TS, Tailwind v4, vue-router + Pinia
- Backend: Express 5 (ESM, `tsx` dev / `tsc` build), Postgres via `pg`, bcrypt session-cookie auth
- Catalog source of truth: **local Postgres `products` table** (not Stripe)

### Backend v1 — all 6 phases

- [x] **Phase 1** — backend skeleton + admin-only session-cookie auth (migrations runner, `admin_users` + `sessions`, `/api/admin/sign-in`/`sign-out`, `/api/me`)
- [x] **Phase 2** — `products` table + boot seed + public read API (`GET /api/products`, `/:slug`)
- [x] **Phase 3** — Cloudinary signed uploads + admin product CRUD (`/api/admin/products`, `/uploads/sign`); vue-router + Pinia admin editor
- [x] **Phase 4** — Pinia cart store (localStorage) + `CartDrawer`
- [x] **Phase 5** — Stripe hosted Checkout (`/api/checkout`) + raw-body webhook (`/api/webhooks/stripe`) + `orders` table
- [x] **Phase 6** — Resend order-confirmation email (best-effort, only on fresh insert)

### Design / polish

- [x] Torn-tape eyebrows (SVG-mask, randomized per section)
- [x] Self-hosted fonts (latin woff2; CDN dropped) — Permanent Marker / Bowlby One / Special Elite / Inter
- [x] Circular sticker discs (card + modal); all sticker art normalized to transparent PNGs
- [x] **Saint Luigi** added — catalog is now 13 products
- [x] Markdown product descriptions (sanitized render in modal + live preview in admin)
- [x] Admin editor: two-column layout (list left, sticky editor right)

### Credentials wired (local `.env`, gitignored)

- [x] **Cloudinary** — real creds; image upload works (`uploads/sign` → 200)
- [x] **Stripe** — `sk_test_` key; Stripe CLI + webhook secret (local `stripe listen`)
- [x] **Resend** — `re_` key; sending via `onboarding@resend.dev` (test sender)
- [x] Admin password changed from the placeholder

---

## 2. Verified end-to-end (proofs)

- [x] Admin login → `/admin` editor; edit/delete/sold-out; **Cloudinary image upload** (Saint Luigi uploaded via the UI)
- [x] Admin routes are **server-protected** — every `/api/admin/*` returns 401 without a valid session cookie (client router guard is UX-only)
- [x] Cart drawer: add / qty / remove / subtotal / persistence
- [x] **Stripe checkout** → hosted page → Visa `4242` → success page → webhook → **order #5 inserted** (`$12`, correct items/email/total)
- [x] **Resend** send accepted (returned an id) — receipt path works for the account-owner email

---

## 3. Running it locally

```bash
npm install
npm run dev          # web :5173 + backend :4000 (concurrently)
# webhooks (separate terminal, needs Stripe CLI):
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

- Storefront: http://localhost:5173
- Admin: http://localhost:5173/admin/login (`admin@gravegoodsgoodies.com`)
- Postgres: `grave_goods` on localhost:5432 (Postgres.app)
- Re-seed after seed edits: `psql grave_goods -c "TRUNCATE products RESTART IDENTITY"` then boot (seed only fills an empty table)

---

## 4. Launch blockers / not done ⛔

- [ ] **Real prices/specs** — all still placeholder `$4` / `3" die-cut` (except Deny Defend Depose `$3` / `2.5"`). Needs Sticky Brand order costs; editable in the admin.
- [ ] **Resend domain** — verify `gravegoodsgoodies.com` (SPF/DKIM DNS), then set `EMAIL_FROM=Grave Goods <orders@gravegoodsgoodies.com>`. Until then `onboarding@resend.dev` **only delivers to your own inbox** — real customers get nothing. (Also: check the Resend plan quota.)
- [ ] **Stripe production** — create a real webhook endpoint in the dashboard (→ a _different_ prod `whsec`); the `sk_live_` key goes only on the_litterbox, never in repo/local/chat. Decide test-mode vs live for launch day.
- [ ] **Deploy** — see §5.

---

## 5. Projected next steps — deploy to the_litterbox

Target: **the_litterbox (10.0.0.142) behind a Cloudflare Tunnel.** Approach chosen: **hands-on, step by step.**

1. **Discovery** — SSH access; Node version (nvm); is PostgreSQL installed/running; current Cloudflare Tunnel state; is anything already served there.
2. **Provision** — Node (via nvm), PostgreSQL: create the `grave_goods` DB + role.
3. **Code** — get the repo onto the box; `npm install`; `npm run build` (web → `web/dist`, backend → `backend/dist`).
4. **Env** — write `backend/.env` with prod values. **`NODE_ENV=production`** (so the session cookie gets `Secure`), prod `DATABASE_URL`, `FRONTEND_URL` = the public URL, plus the Cloudinary / Stripe / Resend keys.
5. **DB** — `npm run db:migrate`; boot seeds the 13 products from `seed-products.ts` (which now carries the real titles + descriptions).
6. **Serve** — process manager (pm2 or systemd) for the backend (`node dist/index.js`, :4000); serve `web/dist` as static. Decide static host (nginx/caddy, or the tunnel routes `/` → static and `/api` → :4000).
7. **Cloudflare Tunnel** — route the public hostname → static site + `/api` → backend. **Keep frontend + API same-site** (single origin) or `SameSite=Strict` will drop the session cookie and admin login fails.
8. **Stripe prod webhook** — dashboard → add endpoint `https://<domain>/api/webhooks/stripe` → copy the prod `whsec` into env.
9. **Resend domain** — verify `gravegoodsgoodies.com`; switch `EMAIL_FROM`.
10. **Smoke test in prod** — storefront loads; admin login over HTTPS (confirm `Secure` cookie set); image upload; a checkout → order row + receipt email.
11. **Launch.**

### Deploy-day gotchas (already logged)

- **Cookie:** `session_token` is `httpOnly` + `SameSite=Strict` + `Secure` when `!isDev`. Verify `NODE_ENV=production` is actually set, and that frontend/API are same-site.
- **Catalog SoT:** after launch, the **prod DB** is the source of truth; the seed file is only the cold-start baseline. Re-sync the seed file (or `pg_dump`) before any DB wipe.
- **Secrets:** `.env` is gitignored — never commit. Live Stripe key + prod webhook secret live only on the box.

---

## 6. Production env vars (`backend/.env` on the_litterbox)

```
DATABASE_URL=postgres://…@localhost:5432/grave_goods
PORT=4000
FRONTEND_URL=https://<public-domain>
NODE_ENV=production            # REQUIRED for Secure cookie
ADMIN_EMAIL=…
ADMIN_PASSWORD=…
ADMIN_FULL_NAME=…
CLOUDINARY_CLOUD_NAME=…
CLOUDINARY_API_KEY=…
CLOUDINARY_API_SECRET=…
CLOUDINARY_FOLDER=grave-goods/products
STRIPE_SECRET_KEY=…            # sk_live_ at launch
STRIPE_WEBHOOK_SECRET=…        # prod whsec from dashboard endpoint
RESEND_API_KEY=…
EMAIL_FROM=Grave Goods <orders@gravegoodsgoodies.com>   # after domain verify
```

---

## 7. Reference

- Specs/plans: `docs/superpowers/specs/` and `docs/superpowers/plans/` (`2026-05-20/21-backend-v1-phase-N-*`)
- Seed (catalog baseline): `backend/src/data/seed-products.ts` (synced from live DB 2026-05-21)
- Recent commits: `d9ceb7f` (seed sync) · `0636ba9` (markdown) · `ef98eb2` (admin layout) · `76d472a` (sticker art + Saint Luigi) · `e518d1f` (circular discs) · `a1a0041` (self-host fonts)
