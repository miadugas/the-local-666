# Backend v1 — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an Express + Postgres backend workspace for `grave-goods-store` with admin-only session-cookie authentication. No product, cart, Stripe, or Cloudinary work — those are later phases.

**Architecture:** Add two new npm workspaces (`backend/` and `shared/`) next to existing `web/`. Backend is Express 5 + TypeScript (ESM, `tsx` for dev, `tsc` for build). Postgres connection via `pg`. Sessions stored in DB, surfaced as `httpOnly SameSite=Strict` cookies. Single admin user seeded from env on first boot via bcrypt. Vite dev proxy forwards `/api/*` from `:5173` to `:4000` so the browser sees same-origin requests. Verification is `curl` (no test framework yet — see spec §9).

**Tech Stack:** Express 5, TypeScript 6, pg, bcrypt, cookie-parser, cors, dotenv, tsx, concurrently. Postgres database `grave_goods` (matches graveyard reference repo).

**Source spec:** [`docs/superpowers/specs/2026-05-20-backend-v1-phase-1-design.md`](../specs/2026-05-20-backend-v1-phase-1-design.md)

---

## File map

**Create:**

- `backend/package.json` — workspace package, runtime + dev deps, scripts
- `backend/tsconfig.json` — TS config (ESM, ES2022 target, NodeNext resolution)
- `backend/.env.example` — env template for Phase 1
- `backend/README.md` — env setup + curl verification walkthrough
- `backend/src/index.ts` — Express app entry + boot orchestration
- `backend/src/env.ts` — env loader + validator
- `backend/src/db/pool.ts` — pg Pool singleton
- `backend/src/db/migrate.ts` — migration runner CLI
- `backend/src/db/migrations/001_admin_and_sessions.sql` — first migration
- `backend/src/auth/cookies.ts` — set/clear session cookie
- `backend/src/auth/session.ts` — create/lookup/destroy session
- `backend/src/auth/middleware.ts` — `requireAuth`, `requireRole`
- `backend/src/auth/seed.ts` — first-boot admin user seeding
- `backend/src/routes/health.ts` — GET /api/health
- `backend/src/routes/admin.ts` — POST /api/admin/sign-in, /sign-out
- `backend/src/routes/me.ts` — GET /api/me
- `shared/package.json` — workspace package
- `shared/tsconfig.json` — TS config
- `shared/src/types.ts` — `AdminUser`, `SessionInfo`

**Modify:**

- `package.json` (root) — workspaces array, concurrently dep, dev/build/db:migrate scripts
- `web/vite.config.ts` — dev server proxy `/api/*` → `:4000`

---

## Conventions for every task

- Each task ends with `npm run build` from the appropriate workspace (or root for cross-workspace tasks) BEFORE the commit step. If the build fails, fix it inside the task.
- Backend dev verification uses brief `npm run dev --workspace backend` (terminate after Vite-equivalent boot confirmation) or direct `curl` against `:4000`.
- Database verification uses `psql $DATABASE_URL -c '\dt'` or similar — Mia has Postgres.app locally.
- Conventional commit messages.
- Never use `--no-verify` or `--amend`. Each task = one new commit.
- **DO NOT COMMIT in subagent dispatch mode** — orchestrator handles commits between tasks on user go.

---

## Task 1: Workspaces setup — root + shared + backend skeletons

**Files:**

- Create: `shared/package.json`, `shared/tsconfig.json`, `shared/src/types.ts`
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/src/index.ts`
- Modify: `package.json` (root)

Result of this task: `npm install` from root installs all three workspaces, root `npm run dev` spawns both `web` (vite) and `backend` (tsx hello-world Express on `:4000`), root `npm run build` builds all three. Backend serves nothing yet but doesn't crash.

- [ ] **Step 1.1: Create `shared/package.json`**

```json
{
  "name": "@grave-goods/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/types.ts",
  "types": "./src/types.ts",
  "exports": {
    ".": "./src/types.ts"
  },
  "scripts": {
    "build": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "~6.0.2"
  }
}
```

`shared` is type-only for Phase 1, so `main` points at the .ts source. Consumers (web + backend) compile it via their own TS configs.

- [ ] **Step 1.2: Create `shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 1.3: Create `shared/src/types.ts`**

```ts
/**
 * Shared types between backend (Express) and frontend (Vue) workspaces.
 *
 * Phase 1: auth-related types only. Product, Order, etc. land in later phases.
 */

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

- [ ] **Step 1.4: Create `backend/package.json`**

```json
{
  "name": "@grave-goods/backend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "tsx src/db/migrate.ts up"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^5.0.0",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^24.12.3",
    "@types/pg": "^8.11.10",
    "tsx": "^4.19.2",
    "typescript": "~6.0.2"
  }
}
```

- [ ] **Step 1.5: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": false
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 1.6: Create `backend/src/index.ts` (hello-world Express)**

```ts
import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.get("/", (_req, res) => {
  res.json({ name: "grave-goods backend", phase: 1 });
});

app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});
```

This is a placeholder that gets replaced by full boot orchestration in Task 7.

- [ ] **Step 1.7: Update root `package.json`**

Replace the entire file with:

```json
{
  "name": "grave-goods-store",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "workspaces": ["web", "backend", "shared"],
  "scripts": {
    "dev": "concurrently -n web,backend -c blue,magenta \"npm run dev --workspace web\" \"npm run dev --workspace backend\"",
    "build": "npm run build --workspace shared && npm run build --workspace web && npm run build --workspace backend",
    "preview": "npm run preview --workspace web",
    "db:migrate": "npm run db:migrate --workspace backend"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

- [ ] **Step 1.8: Install dependencies**

From repo root:

```bash
npm install
```

Expected: installs all three workspaces, ~70 new packages from backend (Express + pg + bcrypt + etc.), `concurrently` at root. No errors.

- [ ] **Step 1.9: Verify each workspace builds independently**

```bash
npm run build --workspace shared   # tsc --noEmit on type-only workspace
npm run build --workspace web      # existing vue-tsc + vite build
npm run build --workspace backend  # tsc → backend/dist/
```

All three should succeed. `backend/dist/index.js` should exist.

- [ ] **Step 1.10: Verify root `npm run dev` boots both**

```bash
PORT=4000 npm run dev
```

Expected: both processes start. Web logs `Local: http://localhost:5173/`. Backend logs `[backend] listening on http://localhost:4000`. Visit `http://localhost:4000/` and confirm JSON response. Then Ctrl+C to stop.

- [ ] **Step 1.11: Commit**

```bash
git add package.json shared backend
git commit -m "feat(backend): scaffold backend + shared workspaces

Add Express + TypeScript backend workspace and a shared types workspace
alongside the existing web SPA. Root npm run dev now spawns both via
concurrently. Backend is a hello-world Express app on :4000 — actual
endpoints land in subsequent tasks of Phase 1."
```

---

## Task 2: Env loader + .env.example

**Files:**

- Create: `backend/src/env.ts`
- Create: `backend/.env.example`
- Modify: `backend/src/index.ts` (use env loader)

- [ ] **Step 2.1: Create `backend/src/env.ts`**

```ts
import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  loadDotenv({ path: envPath });
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : fallback;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  port: Number(optional("PORT", "4000")),
  frontendUrl: optional("FRONTEND_URL", "http://localhost:5173"),
  adminEmail: process.env.ADMIN_EMAIL?.trim() ?? null,
  adminPassword: process.env.ADMIN_PASSWORD ?? null,
  adminFullName: optional("ADMIN_FULL_NAME", "Store Admin"),
  nodeEnv: optional("NODE_ENV", "development"),
};

export const isDev = env.nodeEnv !== "production";
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are nullable — seed.ts (Task 7) handles missing values by logging a warning and skipping.

- [ ] **Step 2.2: Create `backend/.env.example`**

```
# Phase 1 — backend skeleton + admin auth
DATABASE_URL=postgres://postgres:postgres@localhost:5432/grave_goods
PORT=4000
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@gravegoodsgoodies.com
ADMIN_PASSWORD=change-me-admin
ADMIN_FULL_NAME=Store Admin
NODE_ENV=development
```

- [ ] **Step 2.3: Replace `backend/src/index.ts` to use env loader**

```ts
import express from "express";
import { env } from "./env.js";

const app = express();

app.get("/", (_req, res) => {
  res.json({ name: "grave-goods backend", phase: 1 });
});

app.listen(env.port, () => {
  console.log(`[backend] listening on http://localhost:${env.port}`);
});
```

Note: import path uses `.js` extension (NodeNext ESM convention) even though source is `.ts`.

- [ ] **Step 2.4: Add a local `.env` and verify boot**

For local dev only (do NOT commit `.env`):

```bash
cp backend/.env.example backend/.env
# Edit backend/.env if needed
```

Then from root:

```bash
npm run dev --workspace backend
```

Expected: backend boots on the port from env. If `DATABASE_URL` is missing the process should throw `Missing required env var: DATABASE_URL` and exit non-zero.

- [ ] **Step 2.5: Confirm `.env` is gitignored**

`.gitignore` already excludes `.env*` patterns? If not, append:

```bash
grep -q "^\.env" .gitignore || echo -e "\n# env files\n.env\n.env.local\n.env.*.local" >> .gitignore
```

- [ ] **Step 2.6: Build**

```bash
npm run build --workspace backend
```

Expected: success.

- [ ] **Step 2.7: Commit**

```bash
git add backend/src/env.ts backend/.env.example backend/src/index.ts .gitignore
git commit -m "feat(backend): add env loader with required/optional validation

backend/src/env.ts loads .env if present and exposes a typed env object.
Required keys throw on missing/empty values; optional keys fall back."
```

---

## Task 3: pg pool + migration runner

**Files:**

- Create: `backend/src/db/pool.ts`
- Create: `backend/src/db/migrate.ts`

- [ ] **Step 3.1: Create `backend/src/db/pool.ts`**

```ts
import { Pool } from "pg";
import { env } from "../env.js";

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("[db] unexpected pool error", err);
});
```

- [ ] **Step 3.2: Create `backend/src/db/migrate.ts`**

```ts
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, "migrations");

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function listApplied(): Promise<Set<string>> {
  const result = await pool.query<{ version: string }>(
    "SELECT version FROM schema_migrations",
  );
  return new Set(result.rows.map((row) => row.version));
}

function listMigrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function applyMigration(filename: string): Promise<void> {
  const version = filename.replace(/\.sql$/, "");
  const sql = readFileSync(resolve(migrationsDir, filename), "utf8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [
      version,
    ]);
    await client.query("COMMIT");
    console.log(`[migrate] applied ${version}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[migrate] FAILED ${version}`, err);
    throw err;
  } finally {
    client.release();
  }
}

export async function up(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await listApplied();
  const files = listMigrationFiles();

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (applied.has(version)) {
      console.log(`[migrate] skip ${version} (already applied)`);
      continue;
    }
    await applyMigration(file);
  }
  console.log("[migrate] up complete");
}

const command = process.argv[2];

if (command === "up") {
  up()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
} else {
  console.error(`Unknown command: ${command ?? "(none)"}. Usage: migrate up`);
  process.exit(1);
}
```

- [ ] **Step 3.3: Create empty migrations directory**

```bash
mkdir -p backend/src/db/migrations
```

The actual SQL lands in Task 4.

- [ ] **Step 3.4: Verify migration runner against an empty database**

Make sure Postgres is running and `grave_goods` database exists:

```bash
psql -d postgres -c "CREATE DATABASE grave_goods" || true   # OK if it already exists
```

Then run:

```bash
npm run db:migrate
```

Expected output: `[migrate] up complete` with no migrations applied. `schema_migrations` table should exist:

```bash
psql -d grave_goods -c "\dt"
```

Should show `schema_migrations`.

- [ ] **Step 3.5: Build**

```bash
npm run build --workspace backend
```

Expected: success. `backend/dist/db/pool.js` and `backend/dist/db/migrate.js` exist.

- [ ] **Step 3.6: Commit**

```bash
git add backend/src/db
git commit -m "feat(backend): add pg pool + migration runner

backend/src/db/pool.ts exports a singleton pg Pool keyed off DATABASE_URL.
backend/src/db/migrate.ts is a CLI that applies SQL files from migrations/
in lexical order, tracking applied versions in schema_migrations. Each
migration runs in a transaction; failures rollback and exit non-zero."
```

---

## Task 4: First migration — admin_users + sessions

**Files:**

- Create: `backend/src/db/migrations/001_admin_and_sessions.sql`

- [ ] **Step 4.1: Create the migration SQL**

```sql
-- 001_admin_and_sessions.sql
-- Phase 1: admin users (single admin) + session storage.

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

- [ ] **Step 4.2: Run the migration**

```bash
npm run db:migrate
```

Expected:

```
[migrate] applied 001_admin_and_sessions
[migrate] up complete
```

- [ ] **Step 4.3: Verify tables exist**

```bash
psql -d grave_goods -c "\dt" | grep -E "admin_users|sessions"
```

Both rows should appear.

```bash
psql -d grave_goods -c "SELECT version FROM schema_migrations"
```

Should show `001_admin_and_sessions`.

- [ ] **Step 4.4: Verify idempotency**

```bash
npm run db:migrate
```

Expected: `[migrate] skip 001_admin_and_sessions (already applied)`.

- [ ] **Step 4.5: Commit**

```bash
git add backend/src/db/migrations/001_admin_and_sessions.sql
git commit -m "feat(backend): migration 001 — admin_users + sessions tables

Two tables: admin_users (id, email, password_hash, full_name, created_at)
with unique email; sessions (session_token PK, admin_user_id FK,
expires_at, created_at) with an index on expires_at for cleanup queries."
```

---

## Task 5: Cookie + session modules

**Files:**

- Create: `backend/src/auth/cookies.ts`
- Create: `backend/src/auth/session.ts`

- [ ] **Step 5.1: Create `backend/src/auth/cookies.ts`**

```ts
import type { Response } from "express";
import { isDev } from "../env.js";

export const SESSION_COOKIE = "session_token";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: !isDev,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.cookie(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: !isDev,
    path: "/",
    maxAge: 0,
  });
}
```

- [ ] **Step 5.2: Create `backend/src/auth/session.ts`**

```ts
import { randomBytes } from "node:crypto";
import { pool } from "../db/pool.js";

const SESSION_DURATION_DAYS = 30;

export type SessionLookup = {
  sessionToken: string;
  adminUserId: number;
  expiresAt: Date;
  user: {
    id: number;
    email: string;
    fullName: string;
    createdAt: Date;
  };
};

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(adminUserId: number): Promise<string> {
  const token = generateSessionToken();
  await pool.query(
    `INSERT INTO sessions (session_token, admin_user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' days')::INTERVAL)`,
    [token, adminUserId, SESSION_DURATION_DAYS],
  );
  return token;
}

export async function lookupSession(
  token: string | undefined,
): Promise<SessionLookup | null> {
  if (!token) return null;

  const result = await pool.query<{
    session_token: string;
    admin_user_id: number;
    expires_at: Date;
    user_id: number;
    email: string;
    full_name: string;
    user_created_at: Date;
  }>(
    `SELECT
       s.session_token,
       s.admin_user_id,
       s.expires_at,
       u.id AS user_id,
       u.email,
       u.full_name,
       u.created_at AS user_created_at
     FROM sessions s
     JOIN admin_users u ON u.id = s.admin_user_id
     WHERE s.session_token = $1
       AND s.expires_at > NOW()
     LIMIT 1`,
    [token],
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];

  return {
    sessionToken: row.session_token,
    adminUserId: row.admin_user_id,
    expiresAt: row.expires_at,
    user: {
      id: row.user_id,
      email: row.email,
      fullName: row.full_name,
      createdAt: row.user_created_at,
    },
  };
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await pool.query("DELETE FROM sessions WHERE session_token = $1", [token]);
}
```

- [ ] **Step 5.3: Build**

```bash
npm run build --workspace backend
```

Expected: success. No code uses these modules yet but they should compile cleanly.

- [ ] **Step 5.4: Commit**

```bash
git add backend/src/auth/cookies.ts backend/src/auth/session.ts
git commit -m "feat(backend): session + cookie helpers

session.ts: createSession generates a 32-byte hex token, inserts a
sessions row with NOW() + 30 days expiry. lookupSession returns the
admin user + session info or null (excluding expired rows). destroySession
deletes by token.

cookies.ts: setSessionCookie/clearSessionCookie with httpOnly,
SameSite=Strict, Secure in production, 30-day Max-Age."
```

---

## Task 6: Auth middleware

**Files:**

- Create: `backend/src/auth/middleware.ts`

- [ ] **Step 6.1: Create `backend/src/auth/middleware.ts`**

```ts
import type { Request, Response, NextFunction } from "express";
import { lookupSession, type SessionLookup } from "./session.js";
import { SESSION_COOKIE } from "./cookies.js";

// Augment Express Request to carry auth info — used by downstream handlers.
declare module "express-serve-static-core" {
  interface Request {
    auth?: SessionLookup;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const session = await lookupSession(token);

  if (!session) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  req.auth = session;
  next();
}

/**
 * Role gate. Phase 1 has only admin users, so this is effectively a no-op
 * after requireAuth. Exists so Phase 3 CRUD endpoints can wire it cleanly.
 */
export function requireRole(_role: "admin") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    // Future: check req.auth.user.role === _role once roles exist.
    next();
  };
}
```

- [ ] **Step 6.2: Build**

```bash
npm run build --workspace backend
```

Expected: success. Module augmentation for `Request.auth` works.

- [ ] **Step 6.3: Commit**

```bash
git add backend/src/auth/middleware.ts
git commit -m "feat(backend): requireAuth and requireRole middleware

requireAuth reads session_token cookie, looks up an active session, and
attaches req.auth or returns 401. requireRole is currently a no-op gate
that exists so Phase 3 CRUD endpoints can wire it without refactoring."
```

---

## Task 7: Admin seed + boot orchestration

**Files:**

- Create: `backend/src/auth/seed.ts`
- Modify: `backend/src/index.ts` (full boot orchestration: env → pool → migrate → seed → listen)

- [ ] **Step 7.1: Create `backend/src/auth/seed.ts`**

```ts
import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";
import { env } from "../env.js";

const BCRYPT_ROUNDS = 12;

export async function seedAdminIfEmpty(): Promise<void> {
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM admin_users",
  );
  const count = Number(countResult.rows[0]?.count ?? "0");

  if (count > 0) {
    console.log(`[seed] admin_users has ${count} row(s) — skipping seed`);
    return;
  }

  if (!env.adminEmail || !env.adminPassword) {
    console.warn(
      "[seed] admin_users is empty but ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping. Add them and restart, or create the admin via SQL.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, BCRYPT_ROUNDS);

  await pool.query(
    `INSERT INTO admin_users (email, password_hash, full_name)
     VALUES ($1, $2, $3)`,
    [env.adminEmail, passwordHash, env.adminFullName],
  );

  console.log(`[seed] created admin user ${env.adminEmail}`);
}
```

- [ ] **Step 7.2: Replace `backend/src/index.ts` with full boot orchestration**

```ts
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env, isDev } from "./env.js";
import { pool } from "./db/pool.js";
import { up as migrateUp } from "./db/migrate.js";
import { seedAdminIfEmpty } from "./auth/seed.js";

async function boot(): Promise<void> {
  // 1. Run pending migrations
  await migrateUp();

  // 2. Seed admin user if needed
  await seedAdminIfEmpty();

  // 3. Build the Express app
  const app = express();

  app.use(cookieParser());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  // Routes registered in later tasks (Task 8 health, Task 9 admin, Task 10 me)
  app.get("/", (_req, res) => {
    res.json({ name: "grave-goods backend", phase: 1 });
  });

  // Error handler — JSON shape, no stack in prod
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("[error]", err);
      const message = isDev ? err.message : "Internal server error";
      res.status(500).json({ message });
    },
  );

  app.listen(env.port, () => {
    console.log(`[backend] listening on http://localhost:${env.port}`);
  });
}

boot().catch((err) => {
  console.error("[boot] failed", err);
  pool.end().finally(() => process.exit(1));
});
```

Note: the trailing `_next` parameter on the error handler is required by Express's 4-arg signature even though unused.

- [ ] **Step 7.3: Verify boot**

From repo root, with `backend/.env` set:

```bash
npm run dev --workspace backend
```

Expected output:

```
[migrate] skip 001_admin_and_sessions (already applied)
[migrate] up complete
[seed] created admin user admin@gravegoodsgoodies.com   (first boot only)
[backend] listening on http://localhost:4000
```

On second boot the seed line becomes:

```
[seed] admin_users has 1 row(s) — skipping seed
```

- [ ] **Step 7.4: Verify admin user in DB**

```bash
psql -d grave_goods -c "SELECT id, email, full_name, created_at FROM admin_users"
```

Should show one row with the seed values.

- [ ] **Step 7.5: Build**

```bash
npm run build --workspace backend
```

Expected: success.

- [ ] **Step 7.6: Commit**

```bash
git add backend/src/auth/seed.ts backend/src/index.ts
git commit -m "feat(backend): boot orchestration — migrate, seed admin, listen

On startup the backend now: runs migrations, seeds the admin user from
env if admin_users is empty (idempotent), mounts cookieParser + CORS +
JSON body parser, and listens. The seed warns and skips if env creds
are missing instead of throwing."
```

---

## Task 8: GET /api/health

**Files:**

- Create: `backend/src/routes/health.ts`
- Modify: `backend/src/index.ts` (wire route)

- [ ] **Step 8.1: Create `backend/src/routes/health.ts`**

```ts
import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});
```

- [ ] **Step 8.2: Wire it into `backend/src/index.ts`**

In `backend/src/index.ts`, add the import at the top with the other route imports (it will be the first):

```ts
import { healthRouter } from "./routes/health.js";
```

Then inside `boot()`, AFTER the body parser and BEFORE the root `/` placeholder route, add:

```ts
app.use(healthRouter);
```

Remove the placeholder `app.get("/", ...)` block since we now have a real route.

The resulting boot section should look like:

```ts
  app.use(cookieParser());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use(healthRouter);

  // Error handler — JSON shape, no stack in prod
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
```

- [ ] **Step 8.3: Restart backend + verify**

```bash
# In backend dev shell (Ctrl+C and re-run if running)
npm run dev --workspace backend
```

In another shell:

```bash
curl -i http://localhost:4000/api/health
```

Expected:

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
...
{"ok":true,"ts":"2026-05-20T..."}
```

- [ ] **Step 8.4: Build**

```bash
npm run build --workspace backend
```

Expected: success.

- [ ] **Step 8.5: Commit**

```bash
git add backend/src/routes/health.ts backend/src/index.ts
git commit -m "feat(backend): GET /api/health liveness endpoint

Returns 200 with { ok: true, ts: <iso> }. No auth required."
```

---

## Task 9: POST /api/admin/sign-in + /sign-out

**Files:**

- Create: `backend/src/routes/admin.ts`
- Modify: `backend/src/index.ts` (wire route)

- [ ] **Step 9.1: Create `backend/src/routes/admin.ts`**

```ts
import bcrypt from "bcrypt";
import { Router } from "express";
import { pool } from "../db/pool.js";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  setSessionCookie,
} from "../auth/cookies.js";
import { createSession, destroySession } from "../auth/session.js";

export const adminRouter = Router();

adminRouter.post("/api/admin/sign-in", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  // Look up admin user
  const result = await pool.query<{
    id: number;
    email: string;
    password_hash: string;
    full_name: string;
    created_at: Date;
  }>(
    `SELECT id, email, password_hash, full_name, created_at
     FROM admin_users
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [email],
  );

  const user = result.rows[0];
  if (!user) {
    // Do not leak existence — same response as wrong password
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // Create session + set cookie
  const token = await createSession(user.id);
  setSessionCookie(res, token);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      createdAt: user.created_at.toISOString(),
    },
  });
});

adminRouter.post("/api/admin/sign-out", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  await destroySession(token);
  clearSessionCookie(res);
  res.status(204).send();
});
```

- [ ] **Step 9.2: Wire into `backend/src/index.ts`**

Add the import:

```ts
import { adminRouter } from "./routes/admin.js";
```

After `app.use(healthRouter);` add:

```ts
app.use(adminRouter);
```

- [ ] **Step 9.3: Verify sign-in**

```bash
curl -i -X POST http://localhost:4000/api/admin/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@gravegoodsgoodies.com","password":"change-me-admin"}'
```

Expected: `HTTP/1.1 200 OK`, `Set-Cookie: session_token=...; HttpOnly; SameSite=Strict; Path=/`, JSON body `{ "user": { "id": 1, ... } }`. Save the token for later steps.

- [ ] **Step 9.4: Verify wrong password → 401**

```bash
curl -i -X POST http://localhost:4000/api/admin/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@gravegoodsgoodies.com","password":"wrong"}'
```

Expected: `HTTP/1.1 401`, `{ "message": "Invalid email or password" }`.

- [ ] **Step 9.5: Verify non-existent email → 401 (same response, no leak)**

```bash
curl -i -X POST http://localhost:4000/api/admin/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"email":"nobody@example.com","password":"any"}'
```

Expected: `HTTP/1.1 401`, same message.

- [ ] **Step 9.6: Verify sign-out**

Using the token from Step 9.3:

```bash
curl -i -X POST http://localhost:4000/api/admin/sign-out \
  -b "session_token=<token-from-9.3>"
```

Expected: `HTTP/1.1 204`, `Set-Cookie: session_token=; ... Max-Age=0`. In Postgres:

```bash
psql -d grave_goods -c "SELECT COUNT(*) FROM sessions"
```

Should be `0`.

- [ ] **Step 9.7: Build**

```bash
npm run build --workspace backend
```

Expected: success.

- [ ] **Step 9.8: Commit**

```bash
git add backend/src/routes/admin.ts backend/src/index.ts
git commit -m "feat(backend): admin sign-in + sign-out endpoints

POST /api/admin/sign-in verifies bcrypt password, creates a session,
sets the httpOnly cookie. Wrong password and unknown email return the
same 401 message (no existence leak). Missing email or password is 400.

POST /api/admin/sign-out destroys the session by cookie token and
clears the cookie. Returns 204."
```

---

## Task 10: GET /api/me

**Files:**

- Create: `backend/src/routes/me.ts`
- Modify: `backend/src/index.ts` (wire route)

- [ ] **Step 10.1: Create `backend/src/routes/me.ts`**

```ts
import { Router } from "express";
import { lookupSession } from "../auth/session.js";
import { SESSION_COOKIE } from "../auth/cookies.js";

export const meRouter = Router();

meRouter.get("/api/me", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const session = await lookupSession(token);

  if (!session) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  res.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      createdAt: session.user.createdAt.toISOString(),
    },
  });
});
```

- [ ] **Step 10.2: Wire into `backend/src/index.ts`**

Add the import:

```ts
import { meRouter } from "./routes/me.js";
```

After `app.use(adminRouter);` add:

```ts
app.use(meRouter);
```

- [ ] **Step 10.3: Verify `/api/me` with valid session**

Sign in first to get a fresh token:

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/admin/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@gravegoodsgoodies.com","password":"change-me-admin"}' \
  -D - | grep -i 'set-cookie' | sed -E 's/.*session_token=([^;]+).*/\1/')
echo "$TOKEN"
```

Then:

```bash
curl -i http://localhost:4000/api/me -b "session_token=$TOKEN"
```

Expected: `HTTP/1.1 200`, JSON body with `{ "user": { ... } }`.

- [ ] **Step 10.4: Verify `/api/me` without session → 401**

```bash
curl -i http://localhost:4000/api/me
```

Expected: `HTTP/1.1 401`, `{ "message": "Authentication required" }`.

- [ ] **Step 10.5: Verify `/api/me` after sign-out → 401**

```bash
curl -s -X POST http://localhost:4000/api/admin/sign-out -b "session_token=$TOKEN" > /dev/null
curl -i http://localhost:4000/api/me -b "session_token=$TOKEN"
```

Expected: `HTTP/1.1 401`.

- [ ] **Step 10.6: Build**

```bash
npm run build --workspace backend
```

Expected: success.

- [ ] **Step 10.7: Commit**

```bash
git add backend/src/routes/me.ts backend/src/index.ts
git commit -m "feat(backend): GET /api/me whoami endpoint

Returns the authenticated admin user (200) or 401 if no valid session
cookie is present."
```

---

## Task 11: Vite dev proxy

**Files:**

- Modify: `web/vite.config.ts`

- [ ] **Step 11.1: Read current `web/vite.config.ts`**

```bash
cat web/vite.config.ts
```

You'll likely see something like:

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
});
```

- [ ] **Step 11.2: Add the proxy config**

Replace the file with (preserving any existing plugins):

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
```

If the current file has additional configuration, preserve all of it and only add the `server.proxy` block.

- [ ] **Step 11.3: Verify the proxy**

Start the full dev environment from root:

```bash
npm run dev
```

Both web (`:5173`) and backend (`:4000`) should boot. Then in another shell:

```bash
curl -i http://localhost:5173/api/health
```

Expected: same response as `http://localhost:4000/api/health` (200 + `{ "ok": true, "ts": ... }`). The browser sees same-origin so cookies flow naturally.

- [ ] **Step 11.4: Build**

```bash
npm run build --workspace web
```

Expected: success. Vite config doesn't affect the build output, but make sure no syntax errors snuck in.

- [ ] **Step 11.5: Commit**

```bash
git add web/vite.config.ts
git commit -m "feat(web): Vite dev proxy /api → backend :4000

In development the browser hits same-origin /api/* routes; Vite forwards
them to the backend on :4000. Cookies flow naturally with no CORS
gymnastics. Production deployment behind the_litterbox + Cloudflare
Tunnel will route /api the same way."
```

---

## Task 12: backend/README.md + final acceptance check

**Files:**

- Create: `backend/README.md`

- [ ] **Step 12.1: Create `backend/README.md`**

````markdown
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
| `npm run build --workspace backend` | `tsc` → `backend/dist/`                                     |
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
````

- [ ] **Step 12.2: Run the full acceptance walkthrough**

Execute every curl command in the README's "Verify the auth flow" section against a running dev environment. Every command should produce the expected output. If any fails, fix the underlying code in the appropriate task (don't accumulate fixes here).

- [ ] **Step 12.3: Run full root build**

```bash
npm run build
```

Expected: all three workspaces build cleanly.

- [ ] **Step 12.4: Confirm scope**

```bash
git status --short
```

Expected: only `backend/README.md` is new since the last commit (Task 11). If anything else has accumulated, that's a sign of unintended churn — investigate before committing.

- [ ] **Step 12.5: Commit**

```bash
git add backend/README.md
git commit -m "docs(backend): add README with setup + auth flow verification

Documents local prereqs (Postgres, env), commands, the seven-curl
acceptance walkthrough, the directory layout, and a roadmap pointer
to subsequent phases."
```

---

## Self-review notes

**Spec coverage:**

- §3 workspace + tooling → Task 1
- §4 database (pool, migration runner, schema) → Tasks 3, 4
- §5 auth model (cookies, sessions, middleware, seed, hashing) → Tasks 5, 6, 7
- §6 endpoints (health, sign-in, sign-out, me) + middleware stack → Tasks 7 (stack), 8, 9, 10
- §7 dev workflow (ports, proxy, root scripts, boot order) → Tasks 1 (scripts), 7 (boot order), 11 (proxy)
- §8 .env.example → Task 2
- §9 out of scope → respected (no products, no admin UI, no Cloudinary, no Stripe)
- §10 acceptance criteria 1-15 → distributed across all tasks; final walkthrough in Task 12

**Placeholder scan:** No "TBD", no "TODO" except the intentional FALLBACK_DESCRIPTION pattern (not in this plan) and the legitimate roadmap pointer in README. Every step has actual code or exact command.

**Type consistency:**

- `SessionLookup` type defined in `session.ts` (Task 5), consumed by `middleware.ts` (Task 6) ✓
- `SESSION_COOKIE` constant exported from `cookies.ts` (Task 5), imported by `middleware.ts` (Task 6), `admin.ts` (Task 9), `me.ts` (Task 10) ✓
- `env` object shape defined in `env.ts` (Task 2), consumed by `pool.ts`, `cookies.ts`, `seed.ts`, `index.ts` ✓
- `pool` named export from `pool.ts` (Task 3), consumed by `migrate.ts`, `session.ts`, `seed.ts`, `admin.ts` ✓

**Cross-task signature checks:**

- `createSession(adminUserId: number): Promise<string>` defined Task 5, called Task 9 ✓
- `lookupSession(token: string | undefined): Promise<SessionLookup | null>` defined Task 5, called Task 6 + Task 10 ✓
- `destroySession(token: string | undefined): Promise<void>` defined Task 5, called Task 9 ✓
- `setSessionCookie(res, token: string): void` defined Task 5, called Task 9 ✓
- `clearSessionCookie(res): void` defined Task 5, called Task 9 ✓
- `seedAdminIfEmpty(): Promise<void>` defined Task 7, called Task 7 boot ✓
- `up(): Promise<void>` exported from `migrate.ts` Task 3, called as `migrateUp()` in Task 7 boot ✓
