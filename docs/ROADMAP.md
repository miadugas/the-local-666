# Grave Goods — Launch Roadmap

_Last updated: 2026-05-21_

**Where we are:** Backend v1 code-complete + verified locally (catalog, admin auth/editor/upload, cart, Stripe checkout→webhook→order, Resend receipts). Path to launch below.

**How to use this:** Phase-gated. We do **one phase at a time** with a go/skip checkpoint, not a batch run. Each box is a real success signal. Quick wins (Phase 0) come first to build momentum before the heavier box work.

**Pricing note:** Real prices are deliberately the **last** content step — set by Mia after final profit projections (Phase 7), entered via admin. Everything before that runs fine on placeholder prices.

---

## 🔑 Open decisions (resolve before Phase 2)

These change _how_ we deploy. Flagging instead of silently picking.

- [x] **D1 — Deploy architecture → Docker Compose** _(decided 2026-05-21)_. Postgres + backend + static-server as 3 services, managed in Portainer. Matches the box's existing Docker+Portainer; reproducible, trivial rollback/rebuild.
- [x] **D2 — Postgres → container** _(follows D1)_. Postgres as a container with a named volume.
- [x] **D3 — Static serving → Express serves `web/dist`** _(decided 2026-05-21)_. `cloudflared` can't serve files, so it needs an origin. Rather than add an nginx container, the `app` container's Express serves the built SPA (static + history fallback, ~5 lines) AND `/api`. `cloudflared` → `app:4000`. **3 containers** total (`postgres`, `app`, `cloudflared`); single origin, cookie-safe, minimal.
- [ ] **D4 — Stripe mode at launch: test vs live.** Soft-launch in test mode (no real charges) vs live `sk_live_` from day one. Decide in Phase 6.

---

## Phase 0 — Pre-deploy prep _(local, this Mac — quick wins)_

Prove the prod artifacts before touching the box.

- [x] `npm run build` clean (Node 20) — web → `web/dist`, backend → `backend/dist`, migrations copied
- [~] `npm run preview` — skipped; build clean, SPA render proof deferred to Phase 8 prod smoke
- [x] Smoke the built backend: `NODE_ENV=production node dist/index.js` boots (migrations + seed idempotent), `/api/products` → 200/13, `/api/admin/*` → 401
- [x] Audit `backend/.env.example` — all 15 keys the code reads are present
- [ ] Resolve D1–D4 above (or at least D1)
- [ ] Write the deploy runbook from this roadmap once D1 is picked

**Gate:** prod build runs locally → proceed to the box.

---

## Phase 1 — Discovery on the*litterbox *(read-only recon — DONE 2026-05-21)\_

- [x] SSH access confirmed (`mia@the-litterbox` / `10.0.0.142`)
- [x] OS: **Ubuntu 26.04 LTS**
- [x] **No host Node, no nvm** — fine, Node lives in the container
- [x] **No host Postgres** — no collision; Postgres goes in a container
- [x] Docker **29.4.1** healthy; Portainer up. Other containers: `homepage` (3001), `open-webui` (8080), `portainer` (9000/9443)
- [x] Free ports: **80, 443, 4000, 5432 all free**. Taken: 22, 9000, 9443, 3001, 8080
- [x] `cloudflared` **not installed** → will run as a container in the stack
- [x] **🚩 Domain on Namecheap DNS** (`dns1/dns2.registrar-servers.com`), NOT Cloudflare → see Phase 1.5
- [x] Disk: 860G free (4% of 935G). Home `/home/mia`; no `~/apps` yet → repo target `~/apps/grave-goods`

**Gate:** ✅ facts in hand. D1/D2 = Compose + Postgres container. D3 resolved below.

---

## Phase 1.5 — Cloudflare DNS migration _(ASYNC — start NOW, Mia-led)_

Cloudflare Tunnel needs the zone on Cloudflare. The domain is on Namecheap. This has propagation latency (minutes–hours), so kick it off in parallel with Phase 2.

- [ ] Add `gravegoodsgoodies.com` to a (free) Cloudflare account → Cloudflare assigns 2 nameservers
- [ ] At Namecheap: replace custom DNS with the 2 Cloudflare NS
- [ ] Wait for Cloudflare to report the zone **Active** (`dig NS gravegoodsgoodies.com +short` shows `*.ns.cloudflare.com`)
- [ ] Re-create any existing DNS records in Cloudflare (if the domain currently points anywhere)

**Gate:** zone Active on Cloudflare → unblocks Phase 5 (Tunnel) + Phase 6 (Resend DKIM).

---

## Phase 2 — Provision: Docker Compose stack _(can scaffold on this Mac — no box needed)_

3 containers: `postgres`, `app` (multi-stage build → Express serves API + `web/dist`), `cloudflared`.

- [ ] **Code change first:** Express serves `web/dist` (static + SPA history fallback) so the `app` container is self-contained (per D3)
- [ ] Multi-stage `Dockerfile` (`node:20`): build stage `npm ci` + `npm run build`; runtime stage copies `dist` + `web/dist`, runs `node backend/dist/index.js`
- [ ] `docker-compose.yml`: `postgres` (named volume + healthcheck), `app` (depends_on postgres healthy, reads `.env`), `cloudflared` (token-based, depends_on app)
- [ ] `.dockerignore` (node_modules, .env, .git)
- [ ] `postgres` stays internal to the compose network (no host 5432 exposure); `app` exposes 4000 only to the network for `cloudflared`

**Gate:** `docker compose up` locally (or on box) brings the stack healthy and `/api/products` answers.

---

## Phase 3 — Code + env onto the box

- [ ] Get repo on the box (git clone or push to the_litterbox remote)
- [ ] `npm install`
- [ ] Write `backend/.env` with **prod** values (STATUS §6). `NODE_ENV=production` (Secure cookie), prod `DATABASE_URL`, `FRONTEND_URL=https://gravegoodsgoodies.com`, Cloudinary/Stripe/Resend keys
- [ ] **Secrets discipline:** `sk_live_` + prod `whsec` go _only_ on the box — never repo/local/chat
- [ ] `npm run build` on the box (or build in the Docker image)

**Gate:** build succeeds in the prod environment.

---

## Phase 4 — Database

- [ ] `npm run db:migrate` — applies `001`–`004`
- [ ] Boot the backend → seed fills the 13 products from `seed-products.ts`
- [ ] Verify: `GET /api/products` returns 13 with real titles/descriptions
- [ ] Re-create the admin user from env (Phase 1 auth migration handles this on boot)

**Gate:** catalog live in prod DB; admin user exists.

---

## Phase 5 — Cloudflare Tunnel _(needs Phase 1.5 zone Active)_

- [ ] In Cloudflare Zero Trust: create a **named tunnel** → copy the tunnel **token**
- [ ] Put the token in env; `cloudflared` container runs `tunnel run` (token-based, no local config.yml, survives reboot via `restart: unless-stopped`)
- [ ] Public hostname route: `gravegoodsgoodies.com` → `http://app:4000` (single origin — Express serves both static + `/api`)
- [ ] **Same-origin check:** one hostname → `SameSite=Strict` session cookie survives → admin login works
- [ ] HTTPS loads the storefront over the public domain

**Gate:** storefront reachable at `https://gravegoodsgoodies.com`.

---

## Phase 6 — Prod integrations _(per D4)_

- [ ] **Stripe:** dashboard → add endpoint `https://gravegoodsgoodies.com/api/webhooks/stripe` → copy the **prod** `whsec` into env (different from the local CLI secret). Decide test vs live (D4).
- [ ] **Resend domain:** verify `gravegoodsgoodies.com` (SPF/DKIM DNS in Cloudflare) → set `EMAIL_FROM=Grave Goods <orders@gravegoodsgoodies.com>`. Until verified, `onboarding@resend.dev` only reaches Mia's own inbox.
- [ ] Check Resend plan quota for expected volume

**Gate:** a test order produces a real receipt to a non-owner address; webhook hits prod.

---

## Phase 7 — Pricing _(the deferred blocker — Mia-led)_

- [ ] Run **final profit projections** (Sticky Brand unit cost → desired margin → retail price per sticker)
- [ ] Mia sets retail price + real spec for each of the 13 products
- [ ] Enter via the **admin editor** (live prod DB is now source of truth)
- [ ] Sync `seed-products.ts` (or `pg_dump`) to the new prices so the cold-start baseline matches

**Gate:** every product has a real price + spec; seed re-synced.

---

## Phase 8 — Prod smoke test

- [ ] Storefront loads; all 13 products render with real prices
- [ ] Admin login over HTTPS → confirm **Secure** session cookie is set
- [ ] Image upload via admin (Cloudinary) works in prod
- [ ] Full checkout → Stripe (test card or live) → success page → **order row inserted** → **receipt email delivered**
- [ ] 401 on `/api/admin/*` without a session (server-side guard intact)

**Gate:** end-to-end works in prod exactly as it did locally.

---

## Phase 9 — Launch 🎉

- [ ] If launching live: flip Stripe to `sk_live_` + live webhook secret; do one real low-value test purchase
- [ ] Announce / share the link
- [ ] Tag the release commit

---

## Phase 10 — Post-launch _(nice-to-have, not blocking)_

- [ ] Backups: scheduled `pg_dump` of `grave_goods` (cron/launchd on the box)
- [ ] Basic uptime check on the Tunnel hostname
- [ ] Order/admin notification (email me on new order — already have Resend)
- [ ] Frontend wired to the live API if any page still reads `web/src/data/products.ts`
- [ ] Restock / sold-out flow exercised end-to-end

---

## Reference

- Status snapshot: `docs/STATUS.md`
- Prod env vars: STATUS §6
- the_litterbox: Ubuntu 26.04 / Ryzen 7600X3D / `10.0.0.142` / Docker+Portainer+Ollama, LAN-only (no public exposure yet)
- Seed baseline: `backend/src/data/seed-products.ts`
