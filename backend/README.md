# grave-goods-store / backend

Express 5 + TypeScript + Postgres backend for the Grave Goods storefront.

## Phase 1 status

Phase 1 ships the backend skeleton + admin-only session-cookie auth. No product, cart, Stripe, or Cloudinary work yet — those are in later phases.

Source spec: `../docs/superpowers/specs/2026-05-20-backend-v1-phase-1-design.md`

## Local setup

### Prereqs

- Node.js 24+
- PostgreSQL running locally (Postgres.app on macOS)
- A database named `grave_goods`:
  ```bash
  psql -d postgres -c "CREATE DATABASE grave_goods"
  ```

### Env

```bash
cp .env.example .env
# Edit .env if you want a different ADMIN_EMAIL / ADMIN_PASSWORD
```

Never commit `.env` (it's gitignored).

### Install + migrate

From repo root:

```bash
npm install
npm run db:migrate
```

The migration is idempotent — safe to re-run.

### Run (from repo root)

```bash
npm run dev
```

Starts both backend (`:4000`) and web (`:5173`) via `concurrently`. Backend boots in this order:

1. Apply pending migrations
2. Seed admin user if `admin_users` is empty AND `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set
3. Listen on `PORT` (default 4000)

## Verify the auth flow (Phase 1 acceptance)

```bash
# 1. Health check
curl -i http://localhost:4000/api/health
# → 200 { "ok": true, "ts": "..." }

# 2. Sign in
TOKEN=$(curl -s -X POST http://localhost:4000/api/admin/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@gravegoodsgoodies.com","password":"change-me-admin"}' \
  -D - | grep -i 'set-cookie' | sed -E 's/.*session_token=([^;]+).*/\1/')
echo "$TOKEN"
# → token printed; sign-in returns 200 + { "user": { ... } }

# 3. Whoami
curl -i http://localhost:4000/api/me -b "session_token=$TOKEN"
# → 200 { "user": { ... } }

# 4. Sign out
curl -i -X POST http://localhost:4000/api/admin/sign-out -b "session_token=$TOKEN"
# → 204, cookie cleared

# 5. Whoami after sign-out
curl -i http://localhost:4000/api/me -b "session_token=$TOKEN"
# → 401

# 6. Wrong password
curl -i -X POST http://localhost:4000/api/admin/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@gravegoodsgoodies.com","password":"wrong"}'
# → 401

# 7. Proxy works in browser
curl -i http://localhost:5173/api/health
# → same 200 response (Vite proxies /api/* → :4000)
```

## Scripts

| Command                             | What it does                                                |
| ----------------------------------- | ----------------------------------------------------------- |
| `npm run dev --workspace backend`   | tsx watch mode on `:4000`                                   |
| `npm run build --workspace backend` | `tsc` → `backend/dist/` (also copies SQL migrations)        |
| `npm run start --workspace backend` | runs the built `dist/index.js`                              |
| `npm run db:migrate`                | applies pending migrations (from root or backend workspace) |

## Architecture

```
src/
├── index.ts               # Express app entry + boot orchestration
├── env.ts                 # env loader + validator
├── db/
│   ├── pool.ts            # pg Pool singleton
│   ├── migrate.ts         # migration runner CLI (npm run db:migrate)
│   └── migrations/
│       └── 001_admin_and_sessions.sql
├── auth/
│   ├── cookies.ts         # set/clear session cookie
│   ├── session.ts         # create/lookup/destroy session
│   ├── middleware.ts      # requireAuth, requireRole (used in later phases)
│   └── seed.ts            # first-boot admin seed from env
└── routes/
    ├── health.ts          # GET /api/health
    ├── admin.ts           # POST /api/admin/sign-in + /sign-out
    └── me.ts              # GET /api/me
```

Sessions: 32-byte hex token in `httpOnly SameSite=Strict` cookie, stored in Postgres `sessions` table, 30-day expiry. Passwords: bcrypt 12 rounds.

## Coming in later phases

- **Phase 2**: products table + read endpoints, frontend reads from API
- **Phase 3**: Cloudinary signed-upload + admin product editor UI
- **Phase 4**: Pinia cart store + CartDrawer
- **Phase 5**: Stripe Checkout + webhook + orders table
- **Phase 6**: Resend transactional email
