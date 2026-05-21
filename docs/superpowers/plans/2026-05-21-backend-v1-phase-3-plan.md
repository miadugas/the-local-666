# Backend v1 Phase 3 — Cloudinary + Admin Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-gated admin editor (product CRUD + Cloudinary image upload) and move product images onto the row, while the public storefront keeps working.

**Architecture:** Backend gains an admin-only product CRUD module and a Cloudinary signing module, both behind per-route `requireAuth`; migration 003 adds `image_url`/`image_public_id`. Frontend becomes a small multi-route SPA (vue-router + pinia): storefront at `/`, gated admin at `/admin/*`, with a `useAdminStore` and an image uploader.

**Tech Stack:** Express 5 (ESM), Postgres (`pg`), Node `crypto`; Vue 3.5, vue-router, pinia, Vite 8, TypeScript 6.

**Verification approach:** No test runner. Verify via `npm run build`, `npm run db:migrate`, `curl`/`psql` (with a session cookie), and in-browser (`npm run dev`) per the project pattern. Postgres (Postgres.app) must be running with `grave_goods`.

**Source spec:** `docs/superpowers/specs/2026-05-21-backend-v1-phase-3-design.md`

---

## File Structure

**Backend — create:** `db/migrations/003_product_images.sql`, `products/admin-queries.ts`, `routes/admin-products.ts`, `uploads/cloudinary.ts`, `routes/uploads.ts`
**Backend — modify:** `env.ts`, `.env.example`, `products/seed.ts`, `products/queries.ts`, `index.ts`
**Shared — modify:** `src/types.ts` (`Product.imageUrl`, `AdminProduct`)
**Frontend — create:** `router/index.ts`, `stores/admin.ts`, `views/StorefrontView.vue`, `views/AdminLoginView.vue`, `views/AdminView.vue`, `components/ImageUploader.vue`
**Frontend — modify:** `package.json`, `main.ts`, `App.vue`, `components/StickerCard.vue`, `components/StickerModal.vue`

---

## Task 1: Migration 003 + image on the product row (backend + shared)

**Files:**

- Create: `backend/src/db/migrations/003_product_images.sql`
- Modify: `shared/src/types.ts`, `backend/src/products/seed.ts`, `backend/src/products/queries.ts`

- [ ] **Step 1.1: Create the migration**

```sql
-- 003_product_images.sql
-- Phase 3: product images move onto the row (local path or Cloudinary URL).

ALTER TABLE products ADD COLUMN image_url TEXT;
ALTER TABLE products ADD COLUMN image_public_id TEXT;

UPDATE products
   SET image_url = '/stickers/' || slug || '.png'
 WHERE image_url IS NULL;

ALTER TABLE products ALTER COLUMN image_url SET NOT NULL;
```

- [ ] **Step 1.2: Add `imageUrl` to the public `Product` type**

In `shared/src/types.ts`, add `imageUrl` to `Product`:

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
  imageUrl: string;
};
```

- [ ] **Step 1.3: Add the `AdminProduct` type**

Append to `shared/src/types.ts`:

```ts
export type AdminProduct = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  accentHex: string;
  description: string | null;
  isSoldOut: boolean;
  displayOrder: number;
  imageUrl: string;
  imagePublicId: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
```

- [ ] **Step 1.4: Include `image_url` in the seed INSERT**

In `backend/src/products/seed.ts`, add `image_url` as the ninth column, derived from the slug:

```ts
await client.query(
  `INSERT INTO products
           (slug, title, spec, price_cents, accent_hex, description, display_order, is_sold_out, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
  [
    product.slug,
    product.title,
    product.spec,
    product.priceCents,
    product.accentHex,
    product.description,
    product.displayOrder,
    product.isSoldOut,
    `/stickers/${product.slug}.png`,
  ],
);
```

- [ ] **Step 1.5: Add `image_url` to the public read projection**

In `backend/src/products/queries.ts`, update the row type, columns, and mapping:

```ts
type ProductRow = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  price_cents: number;
  accent_hex: string;
  description: string | null;
  is_sold_out: boolean;
  image_url: string;
};

const SELECT_COLUMNS =
  "id, slug, title, spec, price_cents, accent_hex, description, is_sold_out, image_url";

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
    imageUrl: row.image_url,
  };
}
```

- [ ] **Step 1.6: Build + migrate + verify backfill**

```bash
npm run build --workspace backend 2>&1 | tail -2
npm run db:migrate --workspace backend 2>&1 | grep -E "applied|skip|complete"
psql -d grave_goods -c "\d products" | grep -E "image_url|image_public_id"
psql -d grave_goods -tAc "SELECT slug, image_url, image_public_id FROM products ORDER BY display_order LIMIT 3"
```

Expected: `[migrate] applied 003_product_images`; `image_url` (not null) + `image_public_id` columns; rows show `image_url = /stickers/<slug>.png`, `image_public_id` empty.

- [ ] **Step 1.7: Verify the API + full build**

```bash
cd backend && npx tsx src/index.ts > /tmp/p3-t1.log 2>&1 & sleep 3
curl -s http://localhost:4000/api/products | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['slug'], d[0]['imageUrl'])"
pkill -f "tsx src/index.ts"; cd ..
npm run build 2>&1 | tail -3
```

Expected: `protect-trans-kids /stickers/protect-trans-kids.png`; all three workspaces build.

- [ ] **Step 1.8: Commit**

```bash
git add backend/src/db/migrations/003_product_images.sql shared/src/types.ts backend/src/products/seed.ts backend/src/products/queries.ts
git commit -m "feat(backend): migration 003 — product images on the row

Adds image_url (NOT NULL) + image_public_id, backfilling existing rows to
/stickers/<slug>.png. Product gains imageUrl; AdminProduct type added for
the editor. Seed + read projection carry image_url."
```

---

## Task 2: Storefront renders `product.imageUrl`

**Files:**

- Modify: `web/src/components/StickerCard.vue`, `web/src/components/StickerModal.vue`

- [ ] **Step 2.1: StickerCard image source**

In `web/src/components/StickerCard.vue`, change the image `src`:

```html
<img :src="product.imageUrl" :alt="product.title" draggable="false" />
```

- [ ] **Step 2.2: StickerModal image source**

In `web/src/components/StickerModal.vue`, change the image `src`:

```html
<img :src="product.imageUrl" :alt="product.title" draggable="false" />
```

- [ ] **Step 2.3: Build + in-browser check**

```bash
npm run build --workspace web 2>&1 | tail -3
npm run dev
```

At `http://localhost:5173`: all 12 cards and the modal render images exactly as before (image URLs are the same `/stickers/<slug>.png` paths, now sourced from the row). Stop the dev server.

- [ ] **Step 2.4: Commit**

```bash
git add web/src/components/StickerCard.vue web/src/components/StickerModal.vue
git commit -m "feat(web): render product.imageUrl instead of deriving from slug

Image source now comes from the product row, so Cloudinary URLs render
the same way local /stickers paths do."
```

---

## Task 3: Cloudinary env + signing module

**Files:**

- Modify: `backend/src/env.ts`, `backend/.env.example`
- Create: `backend/src/uploads/cloudinary.ts`

- [ ] **Step 3.1: Add Cloudinary env vars**

In `backend/src/env.ts`, add to the `env` object (after `nodeEnv`):

```ts
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? null,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() ?? null,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? null,
  cloudinaryFolder: optional("CLOUDINARY_FOLDER", "grave-goods"),
```

- [ ] **Step 3.2: Document the vars in `.env.example`**

Append to `backend/.env.example`:

```bash

# Cloudinary (optional — image uploads are disabled until all three are set)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=grave-goods
```

- [ ] **Step 3.3: Create the signing module**

```ts
// backend/src/uploads/cloudinary.ts
import { createHash } from "node:crypto";
import { env } from "../env.js";

export function isConfigured(): boolean {
  return Boolean(
    env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret,
  );
}

export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export function signUpload(): SignedUpload {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = env.cloudinaryFolder;
  // Cloudinary signed-upload: sha1 of params sorted by key as key=value&...,
  // with the api_secret appended. Here: folder, then timestamp (already sorted).
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(toSign + env.cloudinaryApiSecret)
    .digest("hex");

  return {
    cloudName: env.cloudinaryCloudName as string,
    apiKey: env.cloudinaryApiKey as string,
    timestamp,
    folder,
    signature,
  };
}
```

- [ ] **Step 3.4: Build**

```bash
npm run build --workspace backend 2>&1 | tail -2
```

Expected: success.

- [ ] **Step 3.5: Commit**

```bash
git add backend/src/env.ts backend/.env.example backend/src/uploads/cloudinary.ts
git commit -m "feat(backend): Cloudinary env + signed-upload signing module

Optional CLOUDINARY_* env. isConfigured() gates the feature; signUpload()
builds the sha1 signature (folder + timestamp) with no Cloudinary SDK."
```

---

## Task 4: Signed-upload endpoint

**Files:**

- Create: `backend/src/routes/uploads.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 4.1: Create the uploads router**

```ts
// backend/src/routes/uploads.ts
import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { isConfigured, signUpload } from "../uploads/cloudinary.js";

export const uploadsRouter = Router();

uploadsRouter.post("/api/admin/uploads/sign", requireAuth, (_req, res) => {
  if (!isConfigured()) {
    res.status(503).json({ message: "Image uploads are not configured" });
    return;
  }
  res.json(signUpload());
});
```

- [ ] **Step 4.2: Mount it in `index.ts`**

Add the import alongside the other routers and mount after `meRouter`:

```ts
import { uploadsRouter } from "./routes/uploads.js";
```

```ts
app.use(meRouter);
app.use(productsRouter);
app.use(uploadsRouter);
```

- [ ] **Step 4.3: Build + verify auth gating + 503**

```bash
npm run build --workspace backend 2>&1 | tail -2
cd backend && npx tsx src/index.ts > /tmp/p3-t4.log 2>&1 & sleep 3
echo "=== unauthed (expect 401) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/admin/uploads/sign
TOKEN=$(curl -s -X POST http://localhost:4000/api/admin/sign-in -H 'Content-Type: application/json' -d '{"email":"admin@gravegoodsgoodies.com","password":"change-me-admin"}' -D - | grep -i 'set-cookie' | sed -E 's/.*session_token=([^;]+).*/\1/' | tr -d '\r')
echo "=== authed, unconfigured (expect 503) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/admin/uploads/sign -b "session_token=$TOKEN"
pkill -f "tsx src/index.ts"; cd ..
```

Expected: `401`, then `503` (Cloudinary not configured locally).

- [ ] **Step 4.4: Commit**

```bash
git add backend/src/routes/uploads.ts backend/src/index.ts
git commit -m "feat(backend): POST /api/admin/uploads/sign (auth-gated)

Returns a Cloudinary signature payload, or 503 when uploads aren't
configured. Requires a valid admin session."
```

---

## Task 5: Admin product CRUD

**Files:**

- Create: `backend/src/products/admin-queries.ts`, `backend/src/routes/admin-products.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 5.1: Create `admin-queries.ts`**

```ts
// backend/src/products/admin-queries.ts
import { pool } from "../db/pool.js";
import type { AdminProduct } from "@grave-goods/shared";

type AdminProductRow = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  price_cents: number;
  accent_hex: string;
  description: string | null;
  is_sold_out: boolean;
  display_order: number;
  image_url: string;
  image_public_id: string | null;
  created_at: Date;
  updated_at: Date;
};

const COLS =
  "id, slug, title, spec, price_cents, accent_hex, description, is_sold_out, display_order, image_url, image_public_id, created_at, updated_at";

function mapRow(r: AdminProductRow): AdminProduct {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    spec: r.spec,
    priceCents: r.price_cents,
    accentHex: r.accent_hex,
    description: r.description,
    isSoldOut: r.is_sold_out,
    displayOrder: r.display_order,
    imageUrl: r.image_url,
    imagePublicId: r.image_public_id,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export type CreateProductInput = {
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  accentHex: string;
  description: string | null;
  isSoldOut: boolean;
  displayOrder: number;
  imageUrl: string;
  imagePublicId: string | null;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const result = await pool.query<AdminProductRow>(
    `SELECT ${COLS} FROM products ORDER BY display_order, id`,
  );
  return result.rows.map(mapRow);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<AdminProduct> {
  const result = await pool.query<AdminProductRow>(
    `INSERT INTO products
       (slug, title, spec, price_cents, accent_hex, description, is_sold_out, display_order, image_url, image_public_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${COLS}`,
    [
      input.slug,
      input.title,
      input.spec,
      input.priceCents,
      input.accentHex,
      input.description,
      input.isSoldOut,
      input.displayOrder,
      input.imageUrl,
      input.imagePublicId,
    ],
  );
  return mapRow(result.rows[0]);
}

export async function updateProduct(
  id: number,
  input: UpdateProductInput,
): Promise<AdminProduct | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  const set = (col: string, val: unknown) => {
    fields.push(`${col} = $${i++}`);
    values.push(val);
  };

  if (input.slug !== undefined) set("slug", input.slug);
  if (input.title !== undefined) set("title", input.title);
  if (input.spec !== undefined) set("spec", input.spec);
  if (input.priceCents !== undefined) set("price_cents", input.priceCents);
  if (input.accentHex !== undefined) set("accent_hex", input.accentHex);
  if (input.description !== undefined) set("description", input.description);
  if (input.isSoldOut !== undefined) set("is_sold_out", input.isSoldOut);
  if (input.displayOrder !== undefined)
    set("display_order", input.displayOrder);
  if (input.imageUrl !== undefined) set("image_url", input.imageUrl);
  if (input.imagePublicId !== undefined)
    set("image_public_id", input.imagePublicId);

  if (fields.length === 0) {
    const cur = await pool.query<AdminProductRow>(
      `SELECT ${COLS} FROM products WHERE id = $1`,
      [id],
    );
    return cur.rows[0] ? mapRow(cur.rows[0]) : null;
  }

  fields.push("updated_at = NOW()");
  values.push(id);
  const result = await pool.query<AdminProductRow>(
    `UPDATE products SET ${fields.join(", ")} WHERE id = $${i} RETURNING ${COLS}`,
    values,
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
```

- [ ] **Step 5.2: Create `admin-products.ts`**

```ts
// backend/src/routes/admin-products.ts
import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import {
  listAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type CreateProductInput,
  type UpdateProductInput,
} from "../products/admin-queries.js";

export const adminProductsRouter = Router();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

adminProductsRouter.get(
  "/api/admin/products",
  requireAuth,
  async (_req, res) => {
    res.json(await listAdminProducts());
  },
);

adminProductsRouter.post(
  "/api/admin/products",
  requireAuth,
  async (req, res) => {
    const b = req.body ?? {};
    const title = String(b.title ?? "").trim();
    if (!title) {
      res.status(400).json({ message: "Title is required" });
      return;
    }
    const slug = b.slug ? slugify(String(b.slug)) : slugify(title);
    if (!slug) {
      res
        .status(400)
        .json({ message: "Could not derive a slug from the title" });
      return;
    }
    const priceCents = Number(b.priceCents);
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      res
        .status(400)
        .json({ message: "priceCents must be a non-negative integer" });
      return;
    }
    const imageUrl = String(b.imageUrl ?? "").trim();
    if (!imageUrl) {
      res.status(400).json({ message: "imageUrl is required" });
      return;
    }

    const input: CreateProductInput = {
      slug,
      title,
      spec: String(b.spec ?? "").trim(),
      priceCents,
      accentHex: String(b.accentHex ?? "").trim(),
      description: b.description ? String(b.description) : null,
      isSoldOut: Boolean(b.isSoldOut),
      displayOrder: Number.isInteger(Number(b.displayOrder))
        ? Number(b.displayOrder)
        : 0,
      imageUrl,
      imagePublicId: b.imagePublicId ? String(b.imagePublicId) : null,
    };

    try {
      res.status(201).json(await createProduct(input));
    } catch (err) {
      if (isUniqueViolation(err)) {
        res
          .status(409)
          .json({ message: "A product with that slug already exists" });
        return;
      }
      throw err;
    }
  },
);

adminProductsRouter.patch(
  "/api/admin/products/:id",
  requireAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const input: UpdateProductInput = {};
    if (b.title !== undefined) input.title = String(b.title);
    if (b.slug !== undefined) input.slug = slugify(String(b.slug));
    if (b.spec !== undefined) input.spec = String(b.spec);
    if (b.priceCents !== undefined) {
      const pc = Number(b.priceCents);
      if (!Number.isInteger(pc) || pc < 0) {
        res
          .status(400)
          .json({ message: "priceCents must be a non-negative integer" });
        return;
      }
      input.priceCents = pc;
    }
    if (b.accentHex !== undefined) input.accentHex = String(b.accentHex);
    if (b.description !== undefined)
      input.description = b.description === null ? null : String(b.description);
    if (b.isSoldOut !== undefined) input.isSoldOut = Boolean(b.isSoldOut);
    if (b.displayOrder !== undefined)
      input.displayOrder = Number(b.displayOrder);
    if (b.imageUrl !== undefined) input.imageUrl = String(b.imageUrl);
    if (b.imagePublicId !== undefined)
      input.imagePublicId =
        b.imagePublicId === null ? null : String(b.imagePublicId);

    try {
      const updated = await updateProduct(id, input);
      if (!updated) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json(updated);
    } catch (err) {
      if (isUniqueViolation(err)) {
        res
          .status(409)
          .json({ message: "A product with that slug already exists" });
        return;
      }
      throw err;
    }
  },
);

adminProductsRouter.delete(
  "/api/admin/products/:id",
  requireAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const ok = await deleteProduct(id);
    if (!ok) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.status(204).send();
  },
);
```

- [ ] **Step 5.3: Mount it in `index.ts`**

```ts
import { adminProductsRouter } from "./routes/admin-products.js";
```

```ts
app.use(productsRouter);
app.use(uploadsRouter);
app.use(adminProductsRouter);
```

- [ ] **Step 5.4: Build + full CRUD verification (with session cookie)**

```bash
npm run build --workspace backend 2>&1 | tail -2
cd backend && npx tsx src/index.ts > /tmp/p3-t5.log 2>&1 & sleep 3
echo "=== unauthed list (expect 401) ===" && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/admin/products
TOKEN=$(curl -s -X POST http://localhost:4000/api/admin/sign-in -H 'Content-Type: application/json' -d '{"email":"admin@gravegoodsgoodies.com","password":"change-me-admin"}' -D - | grep -i 'set-cookie' | sed -E 's/.*session_token=([^;]+).*/\1/' | tr -d '\r')
echo "=== authed list (expect 12) ===" && curl -s http://localhost:4000/api/admin/products -b "session_token=$TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
echo "=== create (expect 201) ===" && NEWID=$(curl -s -X POST http://localhost:4000/api/admin/products -b "session_token=$TOKEN" -H 'Content-Type: application/json' -d '{"title":"Test Sticker","spec":"3\" die-cut vinyl","priceCents":500,"accentHex":"#ff2d8a","imageUrl":"/stickers/test.png","displayOrder":99}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id']); import sys; sys.stderr.write(d['slug'])" 2>/tmp/p3-slug); cat /tmp/p3-slug; echo " id=$NEWID"
echo "=== duplicate slug (expect 409) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/admin/products -b "session_token=$TOKEN" -H 'Content-Type: application/json' -d '{"title":"Test Sticker","spec":"x","priceCents":500,"accentHex":"#ff2d8a","imageUrl":"/x.png"}'
echo "=== negative price (expect 400) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/admin/products -b "session_token=$TOKEN" -H 'Content-Type: application/json' -d '{"title":"Bad","priceCents":-1,"imageUrl":"/x.png"}'
echo "=== patch sold-out (expect 200 true) ===" && curl -s -X PATCH http://localhost:4000/api/admin/products/$NEWID -b "session_token=$TOKEN" -H 'Content-Type: application/json' -d '{"isSoldOut":true}' | python3 -c "import sys,json; print(json.load(sys.stdin)['isSoldOut'])"
echo "=== delete (expect 204) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:4000/api/admin/products/$NEWID -b "session_token=$TOKEN"
echo "=== delete missing (expect 404) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:4000/api/admin/products/999999 -b "session_token=$TOKEN"
pkill -f "tsx src/index.ts"; cd ..
```

Expected: `401`, `12`, a new id + slug `test-sticker`, `409`, `400`, `true`, `204`, `404`.

- [ ] **Step 5.5: Commit**

```bash
git add backend/src/products/admin-queries.ts backend/src/routes/admin-products.ts backend/src/index.ts
git commit -m "feat(backend): admin product CRUD behind requireAuth

GET/POST/PATCH/DELETE /api/admin/products. Auto-slug from title, 409 on
slug conflict, 400 on bad input, 404 on missing id. PATCH bumps
updated_at; DELETE is a hard delete."
```

---

## Task 6: Frontend shell — vue-router + pinia + admin store

**Files:**

- Modify: `web/package.json`, `web/src/main.ts`, `web/src/App.vue`
- Create: `web/src/views/StorefrontView.vue`, `web/src/router/index.ts`, `web/src/stores/admin.ts`

- [ ] **Step 6.1: Add deps**

```bash
npm install vue-router pinia --workspace web
```

- [ ] **Step 6.2: Create `StorefrontView.vue` (the current App.vue body)**

```vue
<script setup lang="ts">
import Header from "../components/Header.vue";
import Hero from "../components/Hero.vue";
import ProductGrid from "../components/ProductGrid.vue";
import Tenets from "../components/Tenets.vue";
import Manifesto from "../components/Manifesto.vue";
import Newsletter from "../components/Newsletter.vue";
import Footer from "../components/Footer.vue";
</script>

<template>
  <Header />
  <Hero />
  <ProductGrid />
  <Tenets />
  <Manifesto />
  <Newsletter />
  <Footer />
</template>
```

- [ ] **Step 6.3: Create the admin store**

```ts
// web/src/stores/admin.ts
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AdminUser } from "@grave-goods/shared";

export const useAdminStore = defineStore("admin", () => {
  const user = ref<AdminUser | null>(null);
  const isAuthenticated = computed(() => user.value !== null);

  async function fetchMe(): Promise<void> {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) {
        user.value = null;
        return;
      }
      const data = (await res.json()) as { user: AdminUser };
      user.value = data.user;
    } catch {
      user.value = null;
    }
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    const res = await fetch("/api/admin/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { user: AdminUser };
    user.value = data.user;
    return true;
  }

  async function signOut(): Promise<void> {
    await fetch("/api/admin/sign-out", { method: "POST" });
    user.value = null;
  }

  return { user, isAuthenticated, fetchMe, signIn, signOut };
});
```

- [ ] **Step 6.4: Create the router (storefront route only for now)**

```ts
// web/src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import StorefrontView from "../views/StorefrontView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", name: "storefront", component: StorefrontView }],
});

export default router;
```

- [ ] **Step 6.5: Wire main.ts + App.vue**

`web/src/main.ts`:

```ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import "./styles/global.css";
import App from "./App.vue";
import router from "./router";

createApp(App).use(createPinia()).use(router).mount("#app");
```

`web/src/App.vue` (replace entire file):

```vue
<script setup lang="ts"></script>

<template>
  <RouterView />
</template>
```

- [ ] **Step 6.6: Build + in-browser check**

```bash
npm run build --workspace web 2>&1 | tail -3
npm run dev
```

At `http://localhost:5173/`: the storefront renders exactly as before (12 cards, modal, sold-out). Stop the dev server.

- [ ] **Step 6.7: Commit**

```bash
git add web/package.json package-lock.json web/src/main.ts web/src/App.vue web/src/views/StorefrontView.vue web/src/router/index.ts web/src/stores/admin.ts
git commit -m "feat(web): vue-router + pinia shell + admin store

App.vue renders <RouterView>; the storefront sections move into
StorefrontView at /. Adds useAdminStore (fetchMe/signIn/signOut) for the
upcoming admin routes."
```

---

## Task 7: Admin login view + route guard

**Files:**

- Create: `web/src/views/AdminLoginView.vue`
- Modify: `web/src/router/index.ts`

- [ ] **Step 7.1: Create `AdminLoginView.vue`**

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAdminStore } from "../stores/admin";

const admin = useAdminStore();
const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref(false);
const submitting = ref(false);

async function onSubmit() {
  error.value = false;
  submitting.value = true;
  const ok = await admin.signIn(email.value, password.value);
  submitting.value = false;
  if (ok) {
    router.push({ name: "admin" });
  } else {
    error.value = true;
  }
}
</script>

<template>
  <main class="login">
    <form class="card" @submit.prevent="onSubmit">
      <h1 class="title">Admin</h1>
      <label class="field">
        <span>Email</span>
        <input v-model="email" type="email" required autocomplete="username" />
      </label>
      <label class="field">
        <span>Password</span>
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
        />
      </label>
      <p v-if="error" class="err">Invalid email or password.</p>
      <button type="submit" class="btn" :disabled="submitting">
        {{ submitting ? "Signing in…" : "Sign in" }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-pitch);
  padding: 1.5rem;
}
.card {
  width: min(380px, 100%);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-pitch);
  border: var(--border-bone);
  border-radius: var(--radius-tight);
  box-shadow: var(--shadow-block-pink);
  padding: 1.75rem;
}
.title {
  font-family: var(--font-brand);
  font-size: 2rem;
  color: var(--color-bone);
  margin: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-bone);
}
.field input {
  font-family: var(--font-body);
  font-size: 1rem;
  padding: 0.6rem 0.75rem;
  background: var(--color-bone);
  color: var(--color-ink);
  border: var(--border-ink);
  border-radius: var(--radius-tight);
}
.err {
  color: var(--color-acid-red);
  font-family: var(--font-zine);
  font-size: 0.8rem;
  margin: 0;
}
.btn {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 0.7rem 1rem;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.btn:hover {
  transform: translate(-1px, -1px);
}
.btn:active {
  transform: translate(2px, 2px);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

- [ ] **Step 7.2: Add the login + admin routes and the guard**

Replace `web/src/router/index.ts`:

```ts
import { createRouter, createWebHistory } from "vue-router";
import StorefrontView from "../views/StorefrontView.vue";
import { useAdminStore } from "../stores/admin";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "storefront", component: StorefrontView },
    {
      path: "/admin/login",
      name: "admin-login",
      component: () => import("../views/AdminLoginView.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;
  const admin = useAdminStore();
  if (!admin.isAuthenticated) await admin.fetchMe();
  return admin.isAuthenticated ? true : { name: "admin-login" };
});

export default router;
```

Note: the `/admin` route references `AdminView.vue`, created in Task 8. Implement Task 8 before exercising `/admin`; `/admin/login` is testable now.

- [ ] **Step 7.3: Create a minimal `AdminView.vue` stub so the build resolves**

```vue
<script setup lang="ts"></script>

<template>
  <main style="padding: 2rem; color: #f4ecd8">
    Admin editor — coming in Task 8.
  </main>
</template>
```

- [ ] **Step 7.4: Build + in-browser check**

```bash
npm run build --workspace web 2>&1 | tail -3
npm run dev
```

At `http://localhost:5173`:

- Visit `/admin` while logged out → redirected to `/admin/login`.
- Wrong creds → "Invalid email or password."
- Sign in (`admin@gravegoodsgoodies.com` / `change-me-admin`) → lands on `/admin` (the stub).

Stop the dev server.

- [ ] **Step 7.5: Commit**

```bash
git add web/src/views/AdminLoginView.vue web/src/views/AdminView.vue web/src/router/index.ts
git commit -m "feat(web): admin login view + auth route guard

/admin/login signs in via the admin store; the /admin guard hydrates from
/api/me and redirects unauthed visitors to login. AdminView is a stub
pending the editor."
```

---

## Task 8: Admin editor + image uploader

**Files:**

- Create: `web/src/components/ImageUploader.vue`
- Modify: `web/src/views/AdminView.vue`

- [ ] **Step 8.1: Create `ImageUploader.vue`**

```vue
<script setup lang="ts">
import { ref } from "vue";

defineProps<{ currentUrl: string | null }>();
const emit = defineEmits<{
  uploaded: [payload: { secureUrl: string; publicId: string }];
}>();

type Status = "idle" | "uploading" | "error" | "unconfigured";
const status = ref<Status>("idle");
const errorMsg = ref("");

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  status.value = "uploading";
  errorMsg.value = "";

  const signRes = await fetch("/api/admin/uploads/sign", { method: "POST" });
  if (signRes.status === 503) {
    status.value = "unconfigured";
    return;
  }
  if (!signRes.ok) {
    status.value = "error";
    errorMsg.value = "Could not get an upload signature.";
    return;
  }
  const { cloudName, apiKey, timestamp, folder, signature } =
    await signRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  try {
    const up = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: form },
    );
    if (!up.ok) {
      status.value = "error";
      errorMsg.value = "Upload failed.";
      return;
    }
    const data = await up.json();
    emit("uploaded", { secureUrl: data.secure_url, publicId: data.public_id });
    status.value = "idle";
  } catch {
    status.value = "error";
    errorMsg.value = "Upload failed.";
  }
}
</script>

<template>
  <div class="uploader">
    <img v-if="currentUrl" :src="currentUrl" alt="" class="preview" />
    <input type="file" accept="image/*" @change="onFileChange" />
    <p v-if="status === 'uploading'" class="note">Uploading…</p>
    <p v-if="status === 'unconfigured'" class="warn">
      Image uploads aren't configured — set the Cloudinary env vars.
    </p>
    <p v-if="status === 'error'" class="warn">{{ errorMsg }}</p>
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.preview {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border: var(--border-ink);
  background: var(--color-bone);
}
.note {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  color: var(--color-bone);
  margin: 0;
}
.warn {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  color: var(--color-acid-red);
  margin: 0;
}
</style>
```

- [ ] **Step 8.2: Replace `AdminView.vue` with the editor**

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import type { AdminProduct } from "@grave-goods/shared";
import { useAdminStore } from "../stores/admin";
import ImageUploader from "../components/ImageUploader.vue";

const admin = useAdminStore();
const router = useRouter();

const products = ref<AdminProduct[]>([]);
const loadError = ref(false);

type FormModel = {
  id: number | null;
  title: string;
  slug: string;
  spec: string;
  priceDollars: string;
  accentHex: string;
  description: string;
  isSoldOut: boolean;
  displayOrder: number;
  imageUrl: string;
  imagePublicId: string | null;
};

const editing = ref<FormModel | null>(null);
const saving = ref(false);
const formError = ref("");

function blankForm(): FormModel {
  return {
    id: null,
    title: "",
    slug: "",
    spec: '3" die-cut vinyl',
    priceDollars: "4",
    accentHex: "#ff2d8a",
    description: "",
    isSoldOut: false,
    displayOrder: products.value.length,
    imageUrl: "",
    imagePublicId: null,
  };
}

async function load() {
  loadError.value = false;
  const res = await fetch("/api/admin/products");
  if (!res.ok) {
    loadError.value = true;
    return;
  }
  products.value = (await res.json()) as AdminProduct[];
}

function startCreate() {
  formError.value = "";
  editing.value = blankForm();
}

function startEdit(p: AdminProduct) {
  formError.value = "";
  editing.value = {
    id: p.id,
    title: p.title,
    slug: p.slug,
    spec: p.spec,
    priceDollars: (p.priceCents / 100).toString(),
    accentHex: p.accentHex,
    description: p.description ?? "",
    isSoldOut: p.isSoldOut,
    displayOrder: p.displayOrder,
    imageUrl: p.imageUrl,
    imagePublicId: p.imagePublicId,
  };
}

function cancel() {
  editing.value = null;
}

function onUploaded(payload: { secureUrl: string; publicId: string }) {
  if (!editing.value) return;
  editing.value.imageUrl = payload.secureUrl;
  editing.value.imagePublicId = payload.publicId;
}

async function save() {
  if (!editing.value) return;
  const f = editing.value;
  const priceCents = Math.round(Number(f.priceDollars) * 100);
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    formError.value = "Price must be a non-negative number.";
    return;
  }
  if (!f.title.trim()) {
    formError.value = "Title is required.";
    return;
  }
  if (!f.imageUrl.trim()) {
    formError.value = "An image is required.";
    return;
  }

  const body = {
    title: f.title,
    slug: f.slug || undefined,
    spec: f.spec,
    priceCents,
    accentHex: f.accentHex,
    description: f.description ? f.description : null,
    isSoldOut: f.isSoldOut,
    displayOrder: f.displayOrder,
    imageUrl: f.imageUrl,
    imagePublicId: f.imagePublicId,
  };

  saving.value = true;
  formError.value = "";
  const res = await fetch(
    f.id === null ? "/api/admin/products" : `/api/admin/products/${f.id}`,
    {
      method: f.id === null ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  saving.value = false;
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: "Save failed." }));
    formError.value = data.message ?? "Save failed.";
    return;
  }
  editing.value = null;
  await load();
}

async function remove(p: AdminProduct) {
  if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return;
  const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
  if (res.ok) await load();
}

async function signOut() {
  await admin.signOut();
  router.push({ name: "admin-login" });
}

onMounted(load);
</script>

<template>
  <main class="admin">
    <header class="bar">
      <h1 class="brand">grave goods admin</h1>
      <div class="bar-actions">
        <button class="ghost" @click="startCreate">+ New product</button>
        <button class="ghost" @click="signOut">Sign out</button>
      </div>
    </header>

    <p v-if="loadError" class="warn">Couldn't load products.</p>

    <ul class="list">
      <li v-for="p in products" :key="p.id" class="row">
        <img :src="p.imageUrl" alt="" class="thumb" />
        <div class="row-meta">
          <strong>{{ p.title }}</strong>
          <span class="muted"
            >{{ p.slug }} · ${{ (p.priceCents / 100).toFixed(2)
            }}{{ p.isSoldOut ? " · SOLD OUT" : "" }}</span
          >
        </div>
        <div class="row-actions">
          <button class="ghost" @click="startEdit(p)">Edit</button>
          <button class="ghost danger" @click="remove(p)">Delete</button>
        </div>
      </li>
    </ul>

    <div v-if="editing" class="editor">
      <h2 class="editor-title">
        {{ editing.id === null ? "New product" : "Edit product" }}
      </h2>
      <label class="field"
        ><span>Title</span><input v-model="editing.title"
      /></label>
      <label class="field"
        ><span>Slug (blank = from title)</span><input v-model="editing.slug"
      /></label>
      <label class="field"
        ><span>Spec</span><input v-model="editing.spec"
      /></label>
      <label class="field"
        ><span>Price (USD)</span
        ><input v-model="editing.priceDollars" inputmode="decimal"
      /></label>
      <label class="field"
        ><span>Accent hex</span><input v-model="editing.accentHex"
      /></label>
      <label class="field"
        ><span>Display order</span
        ><input v-model.number="editing.displayOrder" type="number"
      /></label>
      <label class="field"
        ><span>Description</span
        ><textarea v-model="editing.description" rows="3" />
      </label>
      <label class="check"
        ><input v-model="editing.isSoldOut" type="checkbox" /> Sold out</label
      >
      <div class="field">
        <span>Image</span>
        <ImageUploader
          :current-url="editing.imageUrl || null"
          @uploaded="onUploaded"
        />
      </div>
      <p v-if="formError" class="warn">{{ formError }}</p>
      <div class="editor-actions">
        <button class="btn" :disabled="saving" @click="save">
          {{ saving ? "Saving…" : "Save" }}
        </button>
        <button class="ghost" @click="cancel">Cancel</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.admin {
  min-height: 100vh;
  background: var(--color-pitch);
  color: var(--color-bone);
  padding: 1.5rem;
  width: min(900px, 94vw);
  margin: 0 auto;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: var(--border-bone);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}
.brand {
  font-family: var(--font-brand);
  font-size: 1.75rem;
  margin: 0;
}
.bar-actions {
  display: flex;
  gap: 0.5rem;
}
.list {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  border: var(--border-bone);
  border-radius: var(--radius-tight);
  padding: 0.5rem 0.75rem;
}
.thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: var(--color-bone);
  border: var(--border-ink);
}
.row-meta {
  display: flex;
  flex-direction: column;
}
.muted {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  color: color-mix(in oklab, var(--color-bone) 65%, transparent);
}
.row-actions {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}
.editor {
  border: var(--border-bone);
  border-radius: var(--radius-tight);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.editor-title {
  font-family: var(--font-display);
  margin: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
.field input,
.field textarea {
  font-family: var(--font-body);
  font-size: 1rem;
  padding: 0.5rem 0.65rem;
  background: var(--color-bone);
  color: var(--color-ink);
  border: var(--border-ink);
  border-radius: var(--radius-tight);
}
.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body);
}
.editor-actions {
  display: flex;
  gap: 0.5rem;
}
.btn {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 0.6rem 1.1rem;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ghost {
  background: transparent;
  color: var(--color-bone);
  border: var(--border-ink);
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}
.ghost.danger {
  color: var(--color-acid-red);
}
.warn {
  color: var(--color-acid-red);
  font-family: var(--font-zine);
  font-size: 0.8rem;
}
</style>
```

- [ ] **Step 8.3: Build + in-browser verification**

```bash
npm run build --workspace web 2>&1 | tail -3
npm run dev
```

At `http://localhost:5173`, signed in at `/admin`:

1. The product list shows all 12 with thumbnails, slug, price, sold-out flag.
2. "New product" → fill title/price/spec, set an image URL via upload (or, if Cloudinary unconfigured, you'll see the "not configured" note — temporarily type a `/stickers/...` path is not possible via the uploader, so test create with the upload widget once Cloudinary is set; otherwise verify create through the Task 5 curl path and exercise Edit/Delete/sold-out here).
3. Edit a product → change price/sold-out → Save → the storefront (`/`) reflects it after reload.
4. Delete a test product → confirm → it disappears.
5. Sign out → redirected to `/admin/login`.

Stop the dev server.

- [ ] **Step 8.4: Full root build**

```bash
npm run build 2>&1 | tail -4
```

Expected: all three workspaces build clean.

- [ ] **Step 8.5: Commit**

```bash
git add web/src/components/ImageUploader.vue web/src/views/AdminView.vue
git commit -m "feat(web): admin product editor + Cloudinary image uploader

AdminView lists products and creates/edits/deletes them (price entered in
dollars, sold-out toggle, display order). ImageUploader signs via the
backend and uploads directly to Cloudinary, emitting secure_url + public_id."
```

---

## Self-Review notes

**Spec coverage:**

- Migration 003 + backfill (§Data model) → Task 1
- `Product.imageUrl` + storefront render (§Backend read change, §Frontend) → Tasks 1, 2
- `AdminProduct` type (§Shared types) → Task 1
- Cloudinary env + signing (§Cloudinary signed upload) → Task 3
- Sign endpoint 503/auth (§Cloudinary, §Error handling) → Task 4
- Product CRUD + slugify + 409/400/404 (§Admin product CRUD) → Task 5
- vue-router + pinia + store + guard (§Routing & frontend shell) → Tasks 6, 7
- Login view (§AdminLoginView) → Task 7
- Editor + uploader (§AdminView, §ImageUploader) → Task 8
- Acceptance items 1–11 (§Testing) → distributed; backend via curl/psql (Tasks 1,4,5), frontend in-browser (Tasks 2,6,7,8)

**Placeholder scan:** No "TBD"/"TODO". Every code step is complete; commands have expected output. The AdminView stub in Task 7 is an intentional, explicitly-temporary placeholder replaced in Task 8 (the router references it via dynamic import, so it must exist for the build to resolve).

**Type consistency:** `AdminProduct` (Task 1) ↔ `admin-queries` `mapRow` (Task 5) ↔ `AdminView` form model (Task 8) use the same field names. `CreateProductInput`/`UpdateProductInput` (Task 5) match the route body handling (Task 5) and the editor's request body (Task 8). `SignedUpload` (Task 3) fields (`cloudName/apiKey/timestamp/folder/signature`) match what `ImageUploader` destructures (Task 8). `requireAuth` is applied per-route (not router-level) so public routes are unaffected.

```

```
