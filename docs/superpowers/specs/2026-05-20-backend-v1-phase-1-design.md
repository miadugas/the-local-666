# Backend v1 — Phase 1: Backend Skeleton + Admin Auth — Design Spec

**Date:** 2026-05-20
**Status:** Approved design, pending implementation plan
**Scope:** Phase 1 of 6 in the Backend v1 build-out. Stand up an Express + Postgres backend workspace with admin-only session-cookie auth. No product, cart, Stripe, or Cloudinary work — those land in later phases.

---

## 1. Context

Current `grave-goods-store` is a static Vue 3 SPA with 11 products hand-maintained in `web/src/data/products.ts`. CLAUDE.md has long-locked decisions about the eventual backend (Express 5 + TS, Postgres on the_litterbox, Stripe hosted Checkout, Cloudinary signed uploads, Resend email). The graveyard reference repo (`github.com/miadugas/graveyard`) ships a complete Express + Postgres + sessions + admin + Cloudinary + Stripe + cart implementation that we are porting in pieces.

This phase is the foundation. After Phase 1, the backend exists, an admin user exists, and the admin can sign in / out via cookies. There is no admin UI yet — verification is via four `curl` commands.

**Catalog SoT pivot:** The CLAUDE.md decision that "Stripe Products is the catalog source of truth" is being walked back to "local Postgres DB is the catalog source of truth" (graveyard pattern). This pivot is acknowledged here but the catalog table itself does not exist until Phase 2. CLAUDE.md gets updated when Phase 2 lands.

---

## 2. Phase decomposition (full Backend v1)

This spec covers Phase 1 only. The full Backend v1 build-out is:

| Phase | Scope                                                        | Rough days |
| ----- | ------------------------------------------------------------ | ---------- |
| **1** | **Backend skeleton + admin auth + session cookies**          | **1**      |
| 2     | Product DB schema + read API + frontend reads from API       | 1          |
| 3     | Cloudinary signed-upload + admin product editor UI           | 1.5        |
| 4     | Pinia cart store + CartDrawer + cart state machine           | 1          |
| 5     | Stripe Checkout + webhook + orders persistence               | 1.5        |
| 6     | Resend order-confirmation email (+ optional customer lookup) | 0.5–1      |

Each phase ships independently and is approved through its own spec → plan → execute cycle in a separate session.

---

## 3. Workspace + tooling

### Structure

```
grave-goods-store/
├── web/                       # existing Vue 3 SPA — unchanged this phase
├── backend/                   # NEW
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts           # Express app entry + boot orchestration
│   │   ├── env.ts             # env var loader + validator
│   │   ├── db/
│   │   │   ├── pool.ts        # pg Pool factory (singleton)
│   │   │   ├── migrate.ts     # migration runner CLI
│   │   │   └── migrations/
│   │   │       └── 001_admin_and_sessions.sql
│   │   ├── auth/
│   │   │   ├── session.ts     # create / lookup / destroy session
│   │   │   ├── cookies.ts     # set / clear session cookie helpers
│   │   │   ├── middleware.ts  # requireAuth, requireRole('admin')
│   │   │   └── seed.ts        # first-boot admin seed from env
│   │   └── routes/
│   │       ├── admin.ts       # POST /api/admin/sign-in, /sign-out
│   │       ├── me.ts          # GET /api/me
│   │       └── health.ts      # GET /api/health
│   ├── .env.example
│   └── README.md
├── shared/                    # NEW
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── types.ts           # AdminUser, SessionInfo
└── package.json               # workspaces: ["web", "backend", "shared"]
```

### Build + dev tooling

- **TypeScript 6** (matches `web/` workspace), ESM.
- **`tsx`** for dev (watch + reload).
- **`tsc`** for production build.
- **`concurrently`** at root for `npm run dev` to spawn both `web` and `backend` in parallel.

### Dependencies (backend workspace)

Runtime:

- `express` (^5.0.0)
- `pg` (^8.x) — Postgres driver
- `bcrypt` (^5.x) — password hashing
- `cookie-parser` — parse `req.cookies`
- `cors` — same-origin in prod, allow dev frontend origin
- `dotenv` — env loading

Dev:

- `tsx`, `typescript`, `@types/express`, `@types/pg`, `@types/bcrypt`, `@types/cookie-parser`, `@types/cors`, `@types/node`

### Root `package.json` changes

- `workspaces`: `["web", "backend", "shared"]`
- New scripts:
  - `dev`: `concurrently -n web,backend -c blue,magenta "npm run dev --workspace web" "npm run dev --workspace backend"`
  - `build`: `npm run build --workspace shared && npm run build --workspace web && npm run build --workspace backend`
  - `db:migrate`: `npm run db:migrate --workspace backend`

---

## 4. Database

### Connection

`pg` `Pool` configured from `DATABASE_URL`. Single shared instance exported from `backend/src/db/pool.ts`. Default config: `max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000`.

### Migration tool

Raw SQL files in `backend/src/db/migrations/` named `NNN_description.sql` (zero-padded per CLAUDE.md naming convention). A small custom runner in `backend/src/db/migrate.ts`:

- Maintains a `schema_migrations(version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW())` table.
- Applies migrations in lexical order, skipping any already applied.
- Idempotent: re-running is a no-op.
- CLI: `npm run db:migrate up` (apply pending). No `down` for v1 — re-create the DB to roll back.
- Wraps each migration in a transaction.

### Phase 1 schema

```sql
-- backend/src/db/migrations/001_admin_and_sessions.sql

CREATE TABLE admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  session_token TEXT PRIMARY KEY,
  admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

Database name: **`grave_goods`** (matches graveyard, stable identity over time).

---

## 5. Auth model

### Sessions

- Cookie-based.
- 32-byte random token, hex-encoded (`crypto.randomBytes(32).toString('hex')`).
- 30-day expiry (`expires_at = NOW() + INTERVAL '30 days'`).
- Stored in Postgres `sessions` table.
- Expired sessions are not actively swept in Phase 1 (cleanup job lands later); lookup excludes them via `WHERE expires_at > NOW()`.

### Cookie config

```ts
{
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
}
```

Cookie name: `session_token`.

### Password hashing

`bcrypt` with **12 rounds**. Industry default; ~250ms per hash on modern hardware.

### Admin seeding

On backend boot, after migrations run, check `SELECT COUNT(*) FROM admin_users`. If zero, read `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME` from env and insert a row with the hashed password. Idempotent — never overwrites an existing user.

If env vars are missing on a fresh DB, log a warning and skip seeding. Admin can be created later via SQL.

### Middleware

- `requireAuth(req, res, next)` — reads `session_token` cookie, looks up active session, attaches `req.user` (admin user record), or returns 401.
- `requireRole(role: 'admin')(req, res, next)` — assumes `requireAuth` already ran, checks `req.user.role === role`. (All users are admins in Phase 1, so this is a no-op gate. It exists now so Phase 3's CRUD endpoints can attach it cleanly.)

Both exist in Phase 1 but no endpoints use them yet (sign-in / sign-out / me handle their own auth state, health is public).

---

## 6. HTTP endpoints

### Middleware stack

```ts
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
```

CORS only matters in dev (cross-origin between :5173 and :4000). In prod, frontend and backend are same-origin via the Cloudflare Tunnel, so CORS becomes a no-op.

### Endpoints

| Method | Path                  | Auth   | Body / params                         | Response                                                          |
| ------ | --------------------- | ------ | ------------------------------------- | ----------------------------------------------------------------- |
| `POST` | `/api/admin/sign-in`  | public | `{ email: string, password: string }` | 200 `{ user: AdminUser }` + `Set-Cookie: session_token=...` / 401 |
| `POST` | `/api/admin/sign-out` | cookie | —                                     | 204 + `Set-Cookie: session_token=; Max-Age=0`                     |
| `GET`  | `/api/me`             | cookie | —                                     | 200 `{ user: AdminUser }` / 401                                   |
| `GET`  | `/api/health`         | public | —                                     | 200 `{ ok: true, ts: '<iso>' }`                                   |

### Response shape

```ts
// shared/src/types.ts
export type AdminUser = {
  id: number;
  email: string;
  fullName: string;
  createdAt: string; // ISO 8601
};

export type SessionInfo = {
  expiresAt: string; // ISO 8601
};
```

Backend response bodies serialize Postgres `snake_case` columns to TS `camelCase` keys.

### Error responses

Consistent JSON shape: `{ message: string }`. No stack traces in prod. Status codes: 400 (bad input), 401 (unauthenticated), 403 (authenticated but forbidden), 404, 500.

---

## 7. Dev workflow

### Ports

- Backend: **`4000`** (matches graveyard `.env.example`).
- Frontend: `5173` (current).

### Vite dev proxy

`web/vite.config.ts` gets:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  },
},
```

This way the browser sees same-origin requests to `/api/*`. Cookies flow naturally. CORS is technically active in dev but is permissive.

### Root scripts

```json
"scripts": {
  "dev": "concurrently -n web,backend -c blue,magenta \"npm run dev --workspace web\" \"npm run dev --workspace backend\"",
  "build": "npm run build --workspace shared && npm run build --workspace web && npm run build --workspace backend",
  "db:migrate": "npm run db:migrate --workspace backend"
}
```

### Backend scripts

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "db:migrate": "tsx src/db/migrate.ts up"
}
```

### Boot orchestration (`backend/src/index.ts`)

On startup, in order:

1. Load + validate env vars (`src/env.ts` throws on missing required keys).
2. Connect pg pool.
3. Run pending migrations.
4. Seed admin user if `admin_users` is empty and env vars are present.
5. Register middleware + routes.
6. Listen on `PORT`.
7. Log `[backend] listening on http://localhost:<port>`.

---

## 8. `.env.example` (Phase 1 fields)

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/grave_goods
PORT=4000
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@gravegoodsgoodies.com
ADMIN_PASSWORD=change-me-admin
ADMIN_FULL_NAME=Store Admin
NODE_ENV=development
```

Stripe / Cloudinary / Resend env vars appear in later phases.

---

## 9. Out of scope (Phase 1)

- Product table, product endpoints — **Phase 2**
- Frontend admin login UI, vue-router setup — **Phase 3**
- Cloudinary upload endpoint + admin product editor — **Phase 3**
- Pinia cart store + CartDrawer — **Phase 4**
- Stripe Checkout integration + orders table — **Phase 5**
- Resend transactional email — **Phase 6**
- Production deployment to the_litterbox (Cloudflare Tunnel routing, systemd / PM2 service, etc.) — separate ops task after Phase 1 verified locally
- Customer accounts of any kind (locked out per "admin-only, guest checkout" decision)
- Test framework — there is none in this project yet. Phase 1 verification is `npm run build` + four `curl` commands. A test framework is justified when domain logic is worth testing, probably Phase 4 or 5.
- Session sweep job for expired rows — lookup excludes expired rows via `WHERE expires_at > NOW()`. Sweep cron can be added later.
- Rate limiting on sign-in — defer until there's a real attack surface (post-launch).
- Password reset flow — admin can reset by env var on next boot (drop the row, re-seed). Real reset UI is post-launch.
- Audit logging — not in Phase 1.

---

## 10. Acceptance criteria

1. `npm install` from root installs all three workspaces (`web`, `backend`, `shared`) cleanly.
2. `npm run dev` from root starts both backend (`:4000`) and frontend (`:5173`) without errors.
3. `npm run build` from root produces clean output for both `shared` and `backend`, plus the existing `web` build.
4. A reachable Postgres database `grave_goods` accepts connections from `DATABASE_URL`.
5. `npm run db:migrate` applies `001_admin_and_sessions.sql` and is idempotent on second run.
6. On first backend boot with an empty `admin_users` table and the seed env vars set, an admin user is created. Second boot logs that seeding is skipped.
7. `curl -i http://localhost:4000/api/health` → `200` with body `{ "ok": true, "ts": "<iso>" }`.
8. `curl -i -X POST http://localhost:4000/api/admin/sign-in -H 'Content-Type: application/json' -d '{"email":"admin@gravegoodsgoodies.com","password":"change-me-admin"}'` → `200` with body `{ "user": { ... } }` and `Set-Cookie: session_token=...; HttpOnly; SameSite=Strict; Path=/`.
9. `curl -i http://localhost:4000/api/me -b "session_token=<token-from-step-8>"` → `200` with `{ "user": { ... } }`.
10. `curl -i -X POST http://localhost:4000/api/admin/sign-out -b "session_token=<token>"` → `204` + cookie cleared (`Set-Cookie: session_token=; Max-Age=0`).
11. `curl -i http://localhost:4000/api/me -b "session_token=<token>"` after sign-out → `401`.
12. Sign-in with wrong password → `401`. Sign-in with non-existent email → `401` (same response — do not leak existence).
13. Sending a forged or expired `session_token` to `/api/me` → `401`.
14. Visiting `http://localhost:5173/api/health` (via Vite proxy) returns the same 200 health response as the direct backend call.
15. CLAUDE.md is not edited in Phase 1 (the Stripe-Products-as-SoT walk-back is documented in Phase 2's spec when products land).

---

## 11. Risks + open questions

- **Postgres availability on the_litterbox**: Mia's dev machine uses Postgres.app locally (per global CLAUDE.md), but the_litterbox needs Postgres running for production. Out of scope for this phase but worth queueing as an ops task.
- **`bcrypt` native compile on Node 24**: bcrypt has been known to break on newer Node releases. If the install fails, fall back to `bcryptjs` (pure JS, slower but no native build). Plan implementer should handle this gracefully.
- **`concurrently` output mixing**: with both servers logging to the same terminal, output can interleave. The `-n web,backend -c blue,magenta` flags prefix and color the streams. Acceptable for dev.
- **No admin UI to verify**: Mia has to use `curl` for Phase 1 verification. She's a senior dev so this is fine, but documenting the four commands clearly in `backend/README.md` is part of the deliverable.

---

## 12. Hand-off to writing-plans

After approval, this spec hands off to `superpowers:writing-plans` which produces a multi-task implementation plan. The plan will likely decompose into ~8–12 atomic commits:

1. Add `backend/` + `shared/` workspaces (skeleton, package.jsons, tsconfigs)
2. Root `package.json` workspaces + scripts
3. env loader + .env.example
4. pg pool + migration runner
5. First migration SQL
6. Session module + cookies module
7. Auth middleware
8. Admin seed
9. `/api/health`
10. `/api/admin/sign-in` + `/api/admin/sign-out`
11. `/api/me`
12. Vite dev proxy + concurrent dev script
13. `backend/README.md` with curl verification steps
14. Final verification grep + build + curl walkthrough

Each commit individually buildable. No commits with broken builds.
