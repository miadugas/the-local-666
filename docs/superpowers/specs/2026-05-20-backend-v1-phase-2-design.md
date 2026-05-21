# Backend v1 — Phase 2: Product DB + Read API (backend slice)

**Date:** 2026-05-20
**Status:** Approved (design)
**Depends on:** Phase 1 (backend skeleton + admin auth) — complete.

## Goal

Stand up the `products` table as the catalog source of truth, seed it with the
current 11-product catalog, and expose a public read API. This is the **backend
slice only** — wiring the Vue frontend to the API is a separate follow-up.

## Scope

**In scope**

- `products` table migration (`002_products.sql`)
- Boot-time idempotent product seed (mirrors Phase 1 `seedAdminIfEmpty`)
- Backend-owned seed data file (ported from `web/src/data/products.ts`)
- Public read API: `GET /api/products`, `GET /api/products/:slug`
- Shared `Product` type in `@grave-goods/shared`
- Fix the stale "Stripe Products is SoT" line in `CLAUDE.md` (owed from Phase 1)

**Out of scope**

- Frontend wiring (composable, ProductGrid/StickerModal reading from API)
- Admin product CRUD (Phase 3)
- Cloudinary image uploads (Phase 3)
- Pagination, search, category filtering
- Removing `web/src/data/products.ts` (stays until frontend-wiring follow-up)

## Catalog source of truth

The local Postgres `products` table is the catalog source of truth. Stripe is
used only at checkout-creation time (Phase 5) via inline `price_data`
line_items — there are no Stripe Products. Phase 2 must update `CLAUDE.md`,
whose "Stripe Products is the catalog source of truth (when wired)" line is
now stale.

## Data model

### Migration `backend/src/db/migrations/002_products.sql`

```sql
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

**Field notes**

- `slug` — stable join key, matches `/public/stickers/<slug>.png` and the
  current `Product.id` in `web/src/data/products.ts`.
- `price_cents` — integer cents (not dollars). Matches Stripe's unit and avoids
  floating-point drift. Current placeholder $4 → `400`.
- `accent_hex` — the card/modal accent color (current `Product.ring`).
- `description` — nullable; only some products have one.
- `is_sold_out` — drives the acid-red sold-out state in the UI. Default false.
- `display_order` — explicit card ordering; seeded as the source array index.
- `updated_at` — present for the Phase 3 admin editor to set on mutation. Phase 2
  never updates rows, so no trigger is added now (YAGNI).

## Shared contract

### `shared/src/types.ts` — add `Product`

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

This is the API response contract (camelCase). `displayOrder`, `createdAt`, and
`updatedAt` are intentionally excluded — the list is already returned in order,
and the storefront does not consume timestamps. Admin endpoints (Phase 3) can
return a richer shape if needed.

**Integration note:** this is the first real cross-workspace import of
`@grave-goods/shared`. The full root build (`shared → web → backend`) verifies
that the backend's `import type { Product } from "@grave-goods/shared"` resolves
against the package's raw-`.ts` export. If `tsc` rejects the raw-`.ts` export,
the fix is local to the `shared` package (emit declarations or adjust exports).

## Seed

### `backend/src/data/seed-products.ts`

The 11 products ported from `web/src/data/products.ts`, typed as the seed shape:

```ts
type SeedProduct = {
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  accentHex: string;
  description: string | null;
  displayOrder: number;
};

export const SEED_PRODUCTS: readonly SeedProduct[] = [
  /* 11 entries */
];
```

Mapping from the existing data: `id → slug`, `title → title`, `spec → spec`,
`price (4) → priceCents (400)`, `ring → accentHex`, `description? → description`
(`null` when absent), `displayOrder` = array index. `is_sold_out` is not in seed
data — all products seed as in-stock (DB default false).

### `backend/src/products/seed.ts`

```ts
export async function seedProductsIfEmpty(): Promise<void>;
```

- `SELECT COUNT(*) FROM products`. If > 0, log `[seed] products has N row(s) —
skipping seed` and return.
- Otherwise insert all `SEED_PRODUCTS` in a single transaction and log
  `[seed] inserted N products`.

Idempotent on a non-empty table, consistent with `seedAdminIfEmpty`.

### Boot wiring — `backend/src/index.ts`

```
boot():
  migrateUp()
  seedAdminIfEmpty()
  seedProductsIfEmpty()   // new
  build app, mount routers, listen
```

## Read API

### `backend/src/products/queries.ts`

```ts
export async function listProducts(): Promise<Product[]>; // ORDER BY display_order, id
export async function getProductBySlug(slug: string): Promise<Product | null>;
```

A private `mapRow` converts the snake_case DB row to the camelCase `Product`.
Selected columns: `id, slug, title, spec, price_cents, accent_hex, description,
is_sold_out` (no `display_order`/timestamps in the projection).

### `backend/src/routes/products.ts` (public, no auth)

- `GET /api/products` → `200` with `Product[]` (sold-out items included, flagged).
- `GET /api/products/:slug` → `200` with `Product`, or `404 { message: "Product
not found" }`.

Mounted in `index.ts` alongside the existing routers.

## Error handling

- Unknown slug → explicit `404 { message: "Product not found" }`.
- DB / unexpected errors → bubble to the existing Express error handler (500 JSON,
  no stack in production).
- No authentication on either endpoint — the catalog is public.

## Testing / acceptance

1. `npm run db:migrate` applies `002_products` and is idempotent on re-run.
2. First boot logs `[seed] inserted 11 products`; second boot logs
   `[seed] products has 11 row(s) — skipping seed`.
3. `psql -d grave_goods -c "SELECT COUNT(*) FROM products"` → 11.
4. `curl /api/products` → `200`, JSON array of 11 items, ordered by
   `display_order`, each with `isSoldOut`.
5. `curl /api/products/protect-trans-kids` → `200`, single product with its
   description.
6. `curl /api/products/does-not-exist` → `404 { message: "Product not found" }`.
7. `npm run build` (root) → all three workspaces compile, proving the
   backend→shared import resolves.

## File summary

**Create**

- `backend/src/db/migrations/002_products.sql`
- `backend/src/data/seed-products.ts`
- `backend/src/products/seed.ts`
- `backend/src/products/queries.ts`
- `backend/src/routes/products.ts`

**Modify**

- `shared/src/types.ts` (add `Product`)
- `backend/src/index.ts` (seed wiring + mount router)
- `CLAUDE.md` (catalog SoT line + matching anti-pattern note)

## Roadmap pointer

- **Phase 2 follow-up (frontend):** `useProducts` composable, ProductGrid +
  StickerModal read from `/api/products`, delete `web/src/data/products.ts`.
- **Phase 3:** Cloudinary signed-upload + admin product editor (product CRUD
  endpoints behind `requireAuth`, `updated_at` maintenance).
