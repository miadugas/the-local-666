# Rebrand: Grave Goods → The Local 666

Living checklist. The sticker store is renaming **Grave Goods → The Local 666** and
re-homing on **thelocal666.com**. `gravegoodsgoodies.com` + the "Grave Goods" name
are kept for a _separate_ future product (gothic adult coloring books).

## Core principle

**Parallel-run.** Add the new beside the old, verify, flip once (Phase 4), retire the
old. Never rip-and-replace on a live store taking real money.

## Gotchas (do not trip these)

- 🔴 **Do NOT rename the docker compose project (`grave-goods`) or the Postgres
  volume (`grave-goods_pgdata`).** Renaming orphans the DB — products/orders/admin
  appear to vanish. Internal names stay; only customer-facing things change.
- The tunnel is **remotely-managed** (routing in the Cloudflare Zero Trust dashboard;
  `CLOUDFLARE_TUNNEL_TOKEN` only binds the container). Hostname changes need **no
  redeploy** — cloudflared picks up remote config live. App is reached at `app:4000`
  on the compose network.
- Two brands must stay **fully decoupled** — no shared Stripe account, Resend sender
  domain, or DB. Coloring books gets its own repo when it's ready.

## Decisions locked

- Name: **The Local 666** (wordmark: **The Local** = bone/white · **666** = brand-red)
- Brand-red token minted: `--color-brand-red: #ff1414` (hotter than warning
  `--color-acid-red: #e3151f`; brand-only, never a warning)
- Repo: rename `grave-goods-store` → `the-local-666` **in place** (Phase 6, last)
- `gravegoodsgoodies.com`: store vacates it; reserved for coloring books

---

## Phases

### P1 — New domain answers, alongside old 🟢 ✅ DONE (2026-05-24)

- [x] Domain added to Cloudflare (Connect a domain), NS pointed from Namecheap → active.
- [x] Deleted Namecheap parking records (A `@` + CNAME `www`). Left MX + TXT (P2).
- [x] Tunnel published-application-route added: `thelocal666.com → http://app:4000`
      (mirrors the gravegoodsgoodies entries). Apex-only.
- [x] Verified: `https://thelocal666.com` → 200 (Express SPA), `/api/products` → 200 JSON,
      TLS cert provisioned. CORS still `gravegoodsgoodies.com` (FRONTEND_URL, flips P4 —
      fine, SPA uses same-origin `/api`). Do not run real checkout here until P4.
- [x] BONUS: `www.thelocal666.com` → 301 → apex (proxied CNAME + "Redirect from WWW to
      root" rule). Verified path + query preserved. Cleaner than the old domain.

### P2 — Email sender on new domain 🟡 ✅ DONE (2026-05-24)

- [x] Fresh inbound `hello@thelocal666.com` (Cloudflare Email Routing). Deleted Namecheap
      MX+TXT first, enabled Routing (3 CF MX + DKIM + root SPF published — confirmed via
      dig), rule `hello@ → miadugas@outlook.com`, destination verified, test email landed.
      The stuck `gravegoodsgoodies` gate is beaten.
- [x] Resend sending domain `thelocal666.com` verified (green). Records confirmed via dig:
      `send` MX → feedback-smtp.us-east-1.amazonses.com · `send` SPF include:amazonses.com ·
      `resend._domainkey` DKIM. Same Resend account → existing RESEND_API_KEY works.
- [x] DMARC live (Cloudflare DMARC Management): `_dmarc` = `v=DMARC1; p=none;
rua=…@dmarc-reports.cloudflare.net`. Monitor mode, CF parses reports.
- [ ] **(P4 cutover)** flip `EMAIL_FROM` → `The Local 666 <orders@thelocal666.com>`.

Email architecture (clean separation — what the old domain never had):

- Root MX = CF inbound (`hello@`); `send.` MX = Resend bounce → no collision
- Root SPF = CF only; `send.` SPF = Resend → no collision
- DKIM `resend._domainkey`; DMARC `p=none` monitoring

### P3 — Stripe, additive 🟡 ✅ DONE (2026-05-24)

- [x] 2nd webhook endpoint created (live mode): `the-local-666` →
      `https://thelocal666.com/api/webhooks/stripe`, event `checkout.session.completed`,
      API `2020-03-02` (mirrors old `creative-jubilee`). New `whsec_` captured by Mia.
- [x] New endpoint left **DISABLED** until P4 (backend still holds OLD secret; a live new
      endpoint would 400 + trigger Stripe failing-webhook emails). Single-secret throughout
      → at P4: flip backend secret old→new, ENABLE new, DISABLE/DELETE old `creative-jubilee`.
- [ ] **(P4)** statement descriptor + success/cancel URLs flip at cutover. Account legal
      name "Grave Goods, LLC" can stay; only customer-facing descriptor changes.

### P4 — The flip (one coordinated push) 🔴

- [x] **P4a — brand code DONE + committed (e151870), NOT pushed.** Wordmark image,
      copy, `<title>`/OG, favicon, email + Stripe line-item names, mailto → hello@. Full
      build (vue-tsc + vite + backend tsc) green; wordmark verified in local preview
      (desktop + mobile). Live site UNCHANGED (`main` ahead of origin by 1).
- [x] **P4b — cutover DONE + DEPLOYED (2026-05-24).** Box `.env`: `FRONTEND_URL` +
      `EMAIL_FROM` → thelocal666. Stripe statement descriptor → `THE LOCAL 666`. Pushed
      e151870 → deploy green. Verified live: `<title>`, CORS origin = thelocal666,
      wordmark.png 200. (Webhook left on old endpoint here — moved in P5.)

### P5 — Retire the old 🟢 ✅ DONE (2026-05-24)

- [x] Webhook moved: box `.env` `STRIPE_WEBHOOK_SECRET` → new `whsec_`, then
      `docker compose --profile tunnel up -d --force-recreate app` to reload it.
      ⚠️ GOTCHA: env-only changes do NOT reload via `git push` — deploy is
      `up -d --build` (no `--force-recreate`), identical image → no recreate. Must
      force-recreate on the box (or add `--force-recreate` to deploy.yml — see P6).
- [x] Enabled `the-local-666` endpoint, disabled `creative-jubilee`.
- [x] **Money path verified — first real $5 payment.** Stripe `200` on new endpoint,
      statement = "THE LOCAL 666", confirmation email from `orders@thelocal666.com`.
- [x] Removed `gravegoodsgoodies.com` + `www` tunnel routes → old domain no longer
      resolves; store is thelocal666-only. (gravegoodsgoodies zone kept for coloring books.)

> ⚠️ **DELIVERABILITY WATCH:** first order email landed in Outlook **Junk**. NOT a
> misconfig — SPF/DKIM/DMARC all verified correct. It's a brand-new sending domain with
> zero reputation (+ `666` domain / "summoned/crypt" wording nudging spam score). Improves
> with sending history. If it persists for customers: warm-up, "check spam" note at
> checkout, or a dedicated send subdomain.

### P6 — Repo + docs, last 🟢

- [ ] `gh repo rename the-local-666` (auto-redirects; confirm self-hosted runner stays
      attached; update local remote URL).
- [ ] Update `CLAUDE.md` (brand name + de-stale: backend/Pinia/prices).
- [ ] Leave compose project / pg volume / server dir names as-is.
- [ ] (Optional infra) Add `--force-recreate` to deploy.yml's `up -d --build` so future
      env-only changes apply on deploy without a manual box recreate (see P5 gotcha).
