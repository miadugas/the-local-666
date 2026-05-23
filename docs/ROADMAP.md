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

## Phase 2 — Provision: Docker Compose stack _(scaffolded on this Mac — DONE 2026-05-22)_

3 services: `postgres`, `app` (Express serves API + `web/dist`), `cloudflared` (profile `tunnel`).

- [x] **Code change:** Express serves `web/dist` (static + SPA history fallback), gated on `!isDev` — verified locally (`/` + `/admin` → 200 html, `/api/*` intact)
- [x] **`Dockerfile`** — single-stage `node:20` (full image carries bcrypt's native toolchain; box has ample disk). `npm ci` → `npm run build` → `node backend/dist/index.js`
- [x] **`docker-compose.yml`** — `postgres` (named `pgdata` volume + `pg_isready` healthcheck, internal-only), `app` (waits for healthy postgres, `env_file: backend/.env`, `DATABASE_URL`→`postgres` service, host-local `127.0.0.1:4000`), `cloudflared` (profile `tunnel`, token-based)
- [x] **`.dockerignore`** — excludes host `node_modules`/`dist`/`.env` (no arm64 native modules or secrets in the image)
- [x] Compose YAML validated (parses; correct services/volume/profile/depends_on)

**Verification deferred to the box** — this Mac has no Docker daemon (arm64 vs the box's x86_64 anyway). `docker compose up -d --build` runs in Phase 3/4 on the_litterbox.

**Env files needed on the box (both gitignored):**

- `./.env` — `POSTGRES_PASSWORD`, `CLOUDFLARE_TUNNEL_TOKEN` (Phase 5)
- `./backend/.env` — `FRONTEND_URL`, Cloudinary / Stripe / Resend / `ADMIN_*` / `EMAIL_FROM`. (`NODE_ENV`/`PORT`/`DATABASE_URL` are set by compose and override env_file.)

---

## Phase 3 — Code + env onto the box

- [x] Repo on box at `~/apps/grave-goods-store` (rsync'd from Mac — `gh`/git auth sidestepped; `node_modules`/`dist`/`.env`/`.git` excluded)
- [x] `backend/.env` on box (copied from Mac, secrets never in chat); `FRONTEND_URL=https://gravegoodsgoodies.com`. `NODE_ENV`/`PORT`/`DATABASE_URL` set by compose. Still **test-mode** Stripe — switch in Phase 6.
- [x] Root `.env` on box: generated `POSTGRES_PASSWORD`, empty `CLOUDFLARE_TUNNEL_TOKEN`
- [x] `docker compose up -d --build` — image built (bcrypt compiled OK), 2 services up

**Gate:** ✅ image built in prod env; `grave-goods-app` + `grave-goods-postgres` running.

---

## Phase 4 — Database _(DONE 2026-05-22)_

- [x] Migrations `001`–`004` applied on boot (fresh containerized Postgres)
- [x] Seed inserted **13 products**; `GET /api/products` → 200/13
- [x] Admin user `admin@gravegoodsgoodies.com` created from env on first boot
- [x] SPA serves (`/` + `/admin` → 200 html); `/api/admin/*` → 401 guard intact

**Gate:** ✅ catalog + admin live in the prod container DB (volume `grave-goods_pgdata`).

---

## Phase 5 — Cloudflare Tunnel _(needs Phase 1.5 zone Active)_

- [x] Named tunnel `grave-goods` created in Zero Trust (Networks → Connectors); token on box in root `.env`
- [x] `cloudflared` container running (`--profile tunnel`), 4 edge connections (DEN/DFW), HEALTHY, `restart: unless-stopped`
- [x] Public hostname `gravegoodsgoodies.com` → `http://app:4000`. Old Hostinger apex `A` + `www` CNAME deleted to clear the conflict; Cloudflare created the proxied tunnel CNAME
- [x] HTTPS live: `https://gravegoodsgoodies.com/` → 200 html, `cf-ray …-DEN`; `/api/products` → 13
- [x] **Same-origin cookie check** — admin login over HTTPS works; `Secure`+`SameSite=Strict` session sticks. Cloudinary images load in prod too.
- [x] Added `www` published application route → `app:4000`; `https://www.gravegoodsgoodies.com` → 200. _(Both apex + www serve the app directly; add a canonical redirect later if SEO duplicate-content matters.)_

**Gate:** ✅ storefront + admin fully working at `https://gravegoodsgoodies.com`.

---

## Phase 6 — Prod integrations _(per D4)_

- [x] **Resend domain verified** (2026-05-22) via Resend's Cloudflare Auto-configure (SPF/DKIM/MX written + verified automatically). `EMAIL_FROM=Grave Goods <orders@gravegoodsgoodies.com>` set on box; app recreated. Region us-east-1.
- [x] **Stripe webhook** (Sandbox/test) — endpoint `https://gravegoodsgoodies.com/api/webhooks/stripe`, event `checkout.session.completed`, Snapshot payload. Endpoint `whsec` (len 38) on box, app recreated. Old Render endpoint (`gravegoods-krzk.onrender.com`) is stale — delete later. Flip to a _live_ endpoint at Phase 9 (D4).
- [ ] Check Resend plan quota for expected volume

**Gate:** a test order produces a real receipt to a non-owner address; webhook hits prod. _(Validated in Phase 8 smoke.)_

---

## Phase 7 — Pricing _(the deferred blocker — Mia-led)_

- [ ] Run **final profit projections** (Sticky Brand unit cost → desired margin → retail price per sticker)
- [ ] Mia sets retail price + real spec for each of the 13 products
- [ ] Enter via the **admin editor** (live prod DB is now source of truth)
- [ ] Sync `seed-products.ts` (or `pg_dump`) to the new prices so the cold-start baseline matches

**Gate:** every product has a real price + spec; seed re-synced.

---

## Phase 8 — Prod smoke test _(PASS 2026-05-22, test mode)_

- [x] Storefront loads; 13 products render (placeholder `$4` — real prices in Phase 7)
- [x] Admin login over HTTPS → `Secure` session cookie sticks (Phase 5)
- [x] Cloudinary images load in prod (admin + storefront)
- [x] **Full checkout → Stripe test card → success page → order #1 inserted (`status: paid`, $4, correct item) → receipt email delivered** from `orders@gravegoodsgoodies.com`
- [x] `/api/admin/*` → 401 without session

**Gate:** ✅ end-to-end works in prod. ⚠️ **Deliverability:** first receipt landed in Outlook **Junk** — expected for a cold sending domain. Before launch: confirm a **DMARC** record exists (`_dmarc` TXT), click "Not junk" to train, and let reputation warm up. Tracked in Phase 9.

---

## Phase 9 — Launch 🎉

- [ ] **Pricing in** (Phase 7 done) — real prices live in admin
- [ ] **Email deliverability:** confirm `_dmarc.gravegoodsgoodies.com` TXT exists (`v=DMARC1; p=none; rua=…`); send a couple test receipts and confirm inbox (not junk) placement
- [ ] **Flip Stripe live:** swap box `STRIPE_SECRET_KEY` → `sk_live_`, create a **live**-mode webhook endpoint (new `whsec`), update box env, recreate app; one real low-value purchase
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
