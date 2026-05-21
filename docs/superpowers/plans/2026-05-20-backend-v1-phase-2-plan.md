# Backend v1 Phase 2 — Product DB + Read API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `products` table as the catalog source of truth, seed it with the current 11-product catalog, and expose a public read API (`GET /api/products`, `GET /api/products/:slug`).

**Architecture:** Mirror the Phase 1 backend shape — a SQL migration, a boot-time idempotent seed (like `seedAdminIfEmpty`), a thin query module, and a public Express router. The shared `Product` type lives in `@grave-goods/shared` as the API contract. Frontend wiring and admin CRUD are out of scope.

**Tech Stack:** Express 5 (ESM), Postgres via `pg`, TypeScript 6, npm workspaces. `tsx` for dev, `tsc` for build.

**Verification approach:** The backend has no test runner. Following the Phase 1 pattern, each task verifies via `npm run build`, `npm run db:migrate`, `curl`, and `psql` — not a unit-test framework. Postgres (Postgres.app, PG 18.4) must be running with the `grave_goods` database.

**Source spec:** `docs/superpowers/specs/2026-05-20-backend-v1-phase-2-design.md`

---

## File Structure

**Create**

- `backend/src/db/migrations/002_products.sql` — products table + index
- `backend/src/data/seed-products.ts` — the 11-product seed data (backend-owned)
- `backend/src/products/seed.ts` — `seedProductsIfEmpty()` boot seed
- `backend/src/products/queries.ts` — `listProducts`, `getProductBySlug`, row→Product mapping
- `backend/src/routes/products.ts` — public `productsRouter`

**Modify**

- `shared/src/types.ts` — add `Product` contract
- `backend/package.json` — declare `@grave-goods/shared` dependency
- `backend/src/index.ts` — call `seedProductsIfEmpty()` in boot + mount `productsRouter`
- `CLAUDE.md` — correct the stale "Stripe Products is SoT" lines

---

## Task 1: Shared `Product` type + backend dependency wiring

**Files:**

- Modify: `shared/src/types.ts`
- Modify: `backend/package.json`

- [ ] **Step 1.1: Add the `Product` type to `shared/src/types.ts`**

Append to the file (after the existing `SessionInfo` type):

```ts
export type Product = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  accentHex: string;
  description: string | null;
  isSoldOut: boolean;
};
```

- [ ] **Step 1.2: Declare the shared package as a backend dependency**

In `backend/package.json`, add `@grave-goods/shared` to the `dependencies` block (alphabetical order, before `bcrypt`):

```json
  "dependencies": {
    "@grave-goods/shared": "*",
    "bcrypt": "^6.0.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^5.0.0",
    "pg": "^8.13.1"
  },
```

- [ ] **Step 1.3: Install so the workspace symlink is created**

Run from repo root:

```bash
npm install
```

Expected: completes without error. `node_modules/@grave-goods/shared` now symlinks to the `shared/` workspace.

- [ ] **Step 1.4: Build shared to confirm it compiles**

```bash
npm run build --workspace shared
```

Expected: success (`tsc --noEmit`, no output).

- [ ] **Step 1.5: Commit**

```bash
git add shared/src/types.ts backend/package.json package-lock.json
git commit -m "feat(shared): add Product type + wire shared dep into backend

Product is the public API contract (camelCase, no internal ordering or
timestamp fields). backend now depends on @grave-goods/shared so it can
import the type."
```

---

## Task 2: Migration `002_products.sql`

**Files:**

- Create: `backend/src/db/migrations/002_products.sql`

- [ ] **Step 2.1: Create the migration SQL**

```sql
-- 002_products.sql
-- Phase 2: product catalog. Local DB is the catalog source of truth.

CREATE TABLE products (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  spec          TEXT NOT NULL,
  price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
  accent_hex    TEXT NOT NULL,
  description   TEXT,
  is_sold_out   BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_display_order ON products(display_order);
```

- [ ] **Step 2.2: Run the migration**

```bash
npm run db:migrate --workspace backend
```

Expected:

```
[migrate] applied 002_products
[migrate] up complete
```

- [ ] **Step 2.3: Verify the table exists**

```bash
psql -d grave_goods -c "\d products"
```

Expected: shows all 11 columns and the `idx_products_display_order` index.

```bash
psql -d grave_goods -c "SELECT version FROM schema_migrations ORDER BY version"
```

Expected: shows both `001_admin_and_sessions` and `002_products`.

- [ ] **Step 2.4: Verify idempotency**

```bash
npm run db:migrate --workspace backend
```

Expected: `[migrate] skip 002_products (already applied)`.

- [ ] **Step 2.5: Commit**

```bash
git add backend/src/db/migrations/002_products.sql
git commit -m "feat(backend): migration 002 — products table

products (id, slug UNIQUE, title, spec, price_cents, accent_hex,
description, is_sold_out, display_order, created_at, updated_at) with a
CHECK on non-negative price and an index on display_order for ordered
catalog reads."
```

---

## Task 3: Seed data file

**Files:**

- Create: `backend/src/data/seed-products.ts`

- [ ] **Step 3.1: Create `backend/src/data/seed-products.ts`**

Ported verbatim from `web/src/data/products.ts`: `id → slug`, `price (4) → priceCents (400)`, `ring → accentHex`, `description? → description` (`null` when absent), `displayOrder` = array index. All `spec` values are `'3" die-cut vinyl'`.

```ts
// Backend-owned product seed data, ported from web/src/data/products.ts.
// The local DB is the catalog source of truth once seeded; this file only
// populates an empty table on first boot.

export type SeedProduct = {
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  accentHex: string;
  description: string | null;
  displayOrder: number;
};

export const SEED_PRODUCTS: readonly SeedProduct[] = [
  {
    slug: "protect-trans-kids",
    title: "Protect Trans Kids",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#5BCEFA",
    description:
      "Trans kids exist, trans kids deserve protection, trans kids are not a debate. Slap this on a laptop, a locker, or every door at your kid's school district HQ.",
    displayOrder: 0,
  },
  {
    slug: "cops-arent-your-friends",
    title: "Cops Aren't Your Friends",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#2ad6a0",
    description:
      "They're not. They never have been. Stick it somewhere a friendly officer might see it — your bumper, your laptop, the door of the cafe with the 'free coffee for cops' sign.",
    displayOrder: 1,
  },
  {
    slug: "you-are-not-immune",
    title: "You Are Not Immune to Propaganda",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#150b1c",
    description: null,
    displayOrder: 2,
  },
  {
    slug: "class-consciousness",
    title: "All The Cool Kids Have Class Consciousness",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f4ecd8",
    description: null,
    displayOrder: 3,
  },
  {
    slug: "follow-your-leader",
    title: "Follow Your Leader",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f4ecd8",
    description: null,
    displayOrder: 4,
  },
  {
    slug: "devour-feculence",
    title: "Devour Feculence",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#a3e635",
    description: null,
    displayOrder: 5,
  },
  {
    slug: "throbbing-middle-finger",
    title: "Throbbing Middle Finger to God",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#150b1c",
    description: null,
    displayOrder: 6,
  },
  {
    slug: "deny-defend-depose",
    title: "Deny Defend Depose",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#a8c8f0",
    description: null,
    displayOrder: 7,
  },
  {
    slug: "scream-fuck-die",
    title: "Scream Fuck Die",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#34d399",
    description: null,
    displayOrder: 8,
  },
  {
    slug: "magical-stardust",
    title: "Magical Piece of Stardust",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f0bcc7",
    description:
      "You are a magical piece of stardust having a small terrestrial moment. Behave accordingly. Pairs well with bathroom mirrors and the back of any van that's seen too many highway miles.",
    displayOrder: 9,
  },
  {
    slug: "i-did-that",
    title: "I Did That",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f4ecd8",
    description: null,
    displayOrder: 10,
  },
] as const;
```

- [ ] **Step 3.2: Build to confirm it compiles**

```bash
npm run build --workspace backend
```

Expected: success. (No runtime behavior yet — this file is only imported in Task 4.)

- [ ] **Step 3.3: Commit**

```bash
git add backend/src/data/seed-products.ts
git commit -m "feat(backend): add product seed data (11 stickers)

Backend-owned seed data ported from web/src/data/products.ts: price in
cents, ring renamed accent_hex, explicit display_order. Used only to
populate an empty products table on first boot."
```

---

## Task 4: Boot seed — `seedProductsIfEmpty()`

**Files:**

- Create: `backend/src/products/seed.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 4.1: Create `backend/src/products/seed.ts`**

```ts
import { pool } from "../db/pool.js";
import { SEED_PRODUCTS } from "../data/seed-products.js";

export async function seedProductsIfEmpty(): Promise<void> {
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM products",
  );
  const count = Number(countResult.rows[0]?.count ?? "0");

  if (count > 0) {
    console.log(`[seed] products has ${count} row(s) — skipping seed`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const product of SEED_PRODUCTS) {
      await client.query(
        `INSERT INTO products
           (slug, title, spec, price_cents, accent_hex, description, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          product.slug,
          product.title,
          product.spec,
          product.priceCents,
          product.accentHex,
          product.description,
          product.displayOrder,
        ],
      );
    }
    await client.query("COMMIT");
    console.log(`[seed] inserted ${SEED_PRODUCTS.length} products`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[seed] product seed FAILED", err);
    throw err;
  } finally {
    client.release();
  }
}
```

- [ ] **Step 4.2: Wire it into `backend/src/index.ts`**

Add the import alongside the existing `seedAdminIfEmpty` import:

```ts
import { seedProductsIfEmpty } from "./products/seed.js";
```

In `boot()`, after the `seedAdminIfEmpty()` call, add:

```ts
// 2b. Seed product catalog if needed
await seedProductsIfEmpty();
```

- [ ] **Step 4.3: Build**

```bash
npm run build --workspace backend
```

Expected: success.

- [ ] **Step 4.4: Verify first-boot seed**

```bash
cd backend && npx tsx src/index.ts > /tmp/p2-seed.log 2>&1 & sleep 3; grep -E "seed|listening" /tmp/p2-seed.log; pkill -f "tsx src/index.ts"; cd ..
```

Expected output includes:

```
[seed] admin_users has 1 row(s) — skipping seed
[seed] inserted 11 products
[backend] listening on http://localhost:4000
```

- [ ] **Step 4.5: Verify row count + idempotent re-seed**

```bash
psql -d grave_goods -tAc "SELECT COUNT(*) FROM products"
```

Expected: `11`.

```bash
cd backend && npx tsx src/index.ts > /tmp/p2-seed2.log 2>&1 & sleep 3; grep "products" /tmp/p2-seed2.log; pkill -f "tsx src/index.ts"; cd ..
```

Expected: `[seed] products has 11 row(s) — skipping seed`.

- [ ] **Step 4.6: Commit**

```bash
git add backend/src/products/seed.ts backend/src/index.ts
git commit -m "feat(backend): seed product catalog on boot if empty

seedProductsIfEmpty inserts the 11 seed products in a single transaction
when the table is empty, and skips otherwise. Wired into boot after the
admin seed."
```

---

## Task 5: Read API — queries + router

**Files:**

- Create: `backend/src/products/queries.ts`
- Create: `backend/src/routes/products.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 5.1: Create `backend/src/products/queries.ts`**

```ts
import { pool } from "../db/pool.js";
import type { Product } from "@grave-goods/shared";

type ProductRow = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  price_cents: number;
  accent_hex: string;
  description: string | null;
  is_sold_out: boolean;
};

const SELECT_COLUMNS =
  "id, slug, title, spec, price_cents, accent_hex, description, is_sold_out";

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    spec: row.spec,
    priceCents: row.price_cents,
    accentHex: row.accent_hex,
    description: row.description,
    isSoldOut: row.is_sold_out,
  };
}

export async function listProducts(): Promise<Product[]> {
  const result = await pool.query<ProductRow>(
    `SELECT ${SELECT_COLUMNS} FROM products ORDER BY display_order, id`,
  );
  return result.rows.map(mapRow);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const result = await pool.query<ProductRow>(
    `SELECT ${SELECT_COLUMNS} FROM products WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}
```

- [ ] **Step 5.2: Create `backend/src/routes/products.ts`**

Express 5 forwards rejected promises from async handlers to the error middleware automatically, so no try/catch is needed here.

```ts
import { Router } from "express";
import { getProductBySlug, listProducts } from "../products/queries.js";

export const productsRouter = Router();

productsRouter.get("/api/products", async (_req, res) => {
  const products = await listProducts();
  res.json(products);
});

productsRouter.get("/api/products/:slug", async (req, res) => {
  const product = await getProductBySlug(req.params.slug);
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json(product);
});
```

- [ ] **Step 5.3: Mount the router in `backend/src/index.ts`**

Add the import alongside the other route imports:

```ts
import { productsRouter } from "./routes/products.js";
```

After `app.use(meRouter);` add:

```ts
app.use(productsRouter);
```

- [ ] **Step 5.4: Build (also proves the backend→shared import resolves)**

```bash
npm run build --workspace backend
```

Expected: success. If `tsc` reports it cannot find `@grave-goods/shared` or rejects its `.ts` export: in `shared/package.json` change `"build": "tsc --noEmit"` to emit declarations (`"build": "tsc --declaration --emitDeclarationOnly --outDir dist"`), add `"types": "./dist/types.d.ts"` and `"exports": { ".": { "types": "./dist/types.d.ts", "default": "./src/types.ts" } }`, run `npm run build --workspace shared`, then rebuild the backend. (Type-only import, so dev via `tsx` is unaffected either way.)

- [ ] **Step 5.5: Verify the read API end-to-end**

```bash
cd backend && npx tsx src/index.ts > /tmp/p2-api.log 2>&1 & sleep 3
echo "=== list count (expect 11) ==="
curl -s http://localhost:4000/api/products | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d)); print(d[0])"
echo "=== ordered by display_order (first slug expect protect-trans-kids) ==="
curl -s http://localhost:4000/api/products | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['slug'])"
echo "=== by slug (expect 200 + description) ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/products/magical-stardust
curl -s http://localhost:4000/api/products/magical-stardust | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['priceCents'], d['accentHex'], d['isSoldOut']); print(d['description'][:30])"
echo "=== unknown slug (expect 404) ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/products/does-not-exist
pkill -f "tsx src/index.ts"; cd ..
```

Expected:

- list count `11`, first item is a full product object
- first slug `protect-trans-kids`
- `200`, then `400 #f0bcc7 False`, description starts `You are a magical piece of star`
- `404`

- [ ] **Step 5.6: Commit**

```bash
git add backend/src/products/queries.ts backend/src/routes/products.ts backend/src/index.ts
git commit -m "feat(backend): public product read API

GET /api/products returns all products ordered by display_order (sold-out
included, flagged via isSoldOut). GET /api/products/:slug returns one
product or 404. Queries map snake_case rows to the shared camelCase
Product contract."
```

---

## Task 6: Correct the stale catalog-SoT notes in `CLAUDE.md`

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 6.1: Find every stale Stripe-SoT reference**

```bash
grep -n "source of truth\|Stripe Products" CLAUDE.md
```

Expected matches (line numbers may differ): the "Other locked decisions" bullet and the "Placeholders / TODOs" price line. Read `CLAUDE.md` before editing (it is large and auto-formatted).

- [ ] **Step 6.2: Fix the "Other locked decisions" bullet**

Replace:

```markdown
- **No Shopify, no Medusa, no Snipcart.** Stripe Products is the catalog source of truth (when wired).
```

With:

```markdown
- **No Shopify, no Medusa, no Snipcart.** The local Postgres `products` table is the catalog source of truth. Stripe is used only at checkout (Phase 5) via inline `price_data` line_items — there are no Stripe Products.
```

- [ ] **Step 6.3: Fix the "Placeholders / TODOs" price line**

Replace:

```markdown
- Product prices in `web/src/data/products.ts` are uniform `$4` placeholders. Real prices come from Stripe Products (phase 5).
```

With:

```markdown
- Product prices are uniform `$4` (`400` cents) placeholders. The catalog now lives in the Postgres `products` table (seeded from `backend/src/data/seed-products.ts`); real prices come from Sticky Brand order costs, set via the Phase 3 admin editor. `web/src/data/products.ts` still backs the UI until the frontend is wired to the API.
```

- [ ] **Step 6.4: Verify no stale references remain**

```bash
grep -n "source of truth\|Stripe Products" CLAUDE.md
```

Expected: the only "source of truth" hit is the new local-DB line; no "Stripe Products" claims remain as the SoT.

- [ ] **Step 6.5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: correct catalog source-of-truth to local Postgres

The catalog SoT is the local products table, not Stripe Products. Stripe
is used only at checkout via inline price_data. Updates the locked-decision
bullet and the placeholder-prices note accordingly."
```

---

## Self-Review notes

**Spec coverage:**

- Migration `002_products.sql` (schema §Data model) → Task 2
- Boot-time idempotent seed + backend-owned data file (§Seed) → Tasks 3, 4
- Shared `Product` contract (§Shared contract) → Task 1
- Public read API `GET /api/products` + `/:slug` with 404 (§Read API, §Error handling) → Task 5
- `CLAUDE.md` SoT correction (§Catalog source of truth) → Task 6
- Acceptance items 1–7 (§Testing/acceptance) → distributed: migrate idempotency (Task 2), seed + idempotency + count (Task 4), list/by-slug/404 + root build (Task 5)

**Placeholder scan:** No "TBD"/"TODO" except the legitimate roadmap pointer in the spec. Every code step shows complete code; every command shows expected output.

**Type consistency:** `Product` (Task 1) ↔ `mapRow` output (Task 5) ↔ DB columns (Task 2) ↔ `SeedProduct`/seed insert (Tasks 3, 4) all use the same field names. The seed insert omits `is_sold_out` (DB default false) and `id`/timestamps (DB-generated); the read projection omits `display_order`/timestamps, matching the `Product` contract.
