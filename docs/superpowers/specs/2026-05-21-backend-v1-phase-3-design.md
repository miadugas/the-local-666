# Backend v1 — Phase 3: Cloudinary upload + admin product editor

**Date:** 2026-05-21
**Status:** Approved (design)
**Depends on:** Phase 2 (product DB, read API, frontend wired) — complete.

## Goal

Give the solo operator a password-gated admin editor to manage the catalog —
create / edit / delete products, toggle sold-out, set price/spec, and upload
real artwork through Cloudinary. The storefront stays public and unchanged in
behavior, now rendering whatever image URL each product carries.

## Scope

**In scope**

- Frontend: add `vue-router` + `pinia`; routes `/` (storefront), `/admin/login`, `/admin` (guarded)
- `useAdminStore` (Pinia) auth state; route guard via `/api/me`
- Migration 003: `image_url` + `image_public_id` columns, backfilled for existing products
- Seed + shared types carry the image fields
- Product CRUD API behind `requireAuth`: list/create/update/delete
- Cloudinary signed-upload endpoint + an upload widget in the editor
- Admin editor UI (list + form), styled to the existing horror-punk system

**Out of scope**

- Deleting the remote Cloudinary asset on product delete (orphan cleanup) — deferred
- Normalizing the inconsistent sticker PNGs (the "clean up images last" item)
- Cart / checkout / orders (Phases 4–5)
- Customer accounts (auth stays admin-only)
- Image transformations / responsive variants

## Confirmed decisions

- **Routing:** `vue-router`, client-side. Storefront at `/`, admin at `/admin/*`.
- **Image model:** `image_url` (NOT NULL) + `image_public_id` (NULL). Existing
  products backfilled to `/stickers/<slug>.png`; new/edited products store the
  Cloudinary `secure_url` + `public_id`.
- **Cloudinary env:** optional. The sign endpoint returns **503** if unconfigured,
  so the backend boots without credentials.
- **Slug:** auto-generated from title (slugify); **409** on conflict (admin edits the slug).
- **Delete:** hard delete of the DB row only. The Cloudinary asset is left in place
  (orphan cleanup deferred).

## Architecture

The frontend becomes a small multi-route SPA. `App.vue` renders `<RouterView>`.
The current sections move into a `StorefrontView`. Admin lives under `/admin/*`,
guarded by an auth check that hydrates from `/api/me`. The backend adds an
admin-only product module (CRUD) and an uploads module (Cloudinary signing),
both mounted behind `requireAuth`. Image data moves onto each product row, so
the storefront renders `product.imageUrl` regardless of source (local or
Cloudinary).

## Data model

### Migration `backend/src/db/migrations/003_product_images.sql`

```sql
ALTER TABLE products ADD COLUMN image_url TEXT;
ALTER TABLE products ADD COLUMN image_public_id TEXT;

UPDATE products
   SET image_url = '/stickers/' || slug || '.png'
 WHERE image_url IS NULL;

ALTER TABLE products ALTER COLUMN image_url SET NOT NULL;
```

`image_public_id` stays NULL for the backfilled local images; it is populated
only for Cloudinary uploads.

### Seed change

`seedProductsIfEmpty` adds `image_url` to its INSERT, derived as
`'/stickers/' || slug || '.png'` (no `SeedProduct` field needed — it follows the
slug convention). `image_public_id` is left to its column default (NULL).

### Shared types (`shared/src/types.ts`)

- `Product` (public read contract) gains `imageUrl: string`.
- New `AdminProduct` — the full row the editor needs:

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
  createdAt: string; // ISO
  updatedAt: string; // ISO
};
```

## Backend

### Product read change

The existing public `listProducts`/`getProductBySlug` projections add
`image_url` → `imageUrl`.

### Admin product CRUD — `backend/src/routes/admin-products.ts` (behind `requireAuth`)

- `GET /api/admin/products` → `AdminProduct[]`, ordered by `display_order, id`.
- `POST /api/admin/products` → create. Body: `title, slug?, spec, priceCents,
accentHex, description, isSoldOut, displayOrder, imageUrl, imagePublicId?`.
  Slug auto-generated from title when omitted (slugify: lowercase, hyphenate,
  strip non-alphanumerics). Unique-violation → **409**. Validation failures
  (missing required fields, `priceCents < 0`) → **400**. Returns the created
  `AdminProduct`.
- `PATCH /api/admin/products/:id` → partial update of any editable field; sets
  `updated_at = NOW()`. Missing id → **404**; slug conflict → **409**. Returns the
  updated `AdminProduct`.
- `DELETE /api/admin/products/:id` → hard delete. Missing id → **404**. Returns **204**.

Queries live in `backend/src/products/admin-queries.ts` (`listAdminProducts`,
`createProduct`, `updateProduct`, `deleteProduct`), keeping the route thin.

### Cloudinary signed upload — `backend/src/routes/uploads.ts` (behind `requireAuth`)

- `POST /api/admin/uploads/sign` → if Cloudinary is unconfigured, **503**
  `{ message: "Image uploads are not configured" }`. Otherwise returns
  `{ cloudName, apiKey, timestamp, folder, signature }`.
- Signature: SHA-1 of the sorted upload params (`folder`, `timestamp`) joined as
  `key=value&...` with the API secret appended — the standard Cloudinary signed
  upload scheme. No Cloudinary SDK; uses Node `crypto`.
- Signing logic in `backend/src/uploads/cloudinary.ts` (`isConfigured()`,
  `signUploadParams()`), so the route stays thin and the signing is unit-checkable.

### Env (`backend/src/env.ts`)

Add optional, nullable Cloudinary fields:

```ts
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? null,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() ?? null,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? null,
  cloudinaryFolder: optional("CLOUDINARY_FOLDER", "grave-goods"),
```

`.env.example` documents all four. `isConfigured()` is true only when cloudName,
apiKey, and apiSecret are all present.

## Frontend

### Dependencies + shell

- Add `vue-router` and `pinia`.
- `main.ts`: `createApp(App).use(createPinia()).use(router).mount("#app")`.
- `App.vue`: renders `<RouterView />` (the header/footer chrome decision is per
  view — storefront keeps its current layout inside `StorefrontView`).
- `web/src/router/index.ts`: routes below; a `beforeEach` guard on `/admin`
  ensures the admin store is hydrated (`fetchMe`) and redirects to `/admin/login`
  when unauthenticated.

```
/             → StorefrontView   (Header, Hero, ProductGrid, ... Footer)
/admin/login  → AdminLoginView
/admin        → AdminView        (meta.requiresAuth)
```

### `StorefrontView.vue`

Holds the current `App.vue` body (Header → Footer). `App.vue` itself shrinks to
`<RouterView />`. No behavior change to the storefront.

### `useAdminStore` (Pinia, `web/src/stores/admin.ts`)

State: `user: AdminUser | null`, getter `isAuthenticated`. Actions:

- `fetchMe()` — GET `/api/me`; sets `user` or null. Idempotent; the guard awaits it.
- `signIn(email, password)` — POST `/api/admin/sign-in`; on success sets `user`.
- `signOut()` — POST `/api/admin/sign-out`; clears `user`.

### `AdminLoginView.vue`

Email/password form → `signIn` → on success redirect to `/admin`; on 401 show a
thematic error.

### `AdminView.vue`

- Loads `GET /api/admin/products` into a list.
- "New product" opens the editor form (blank); each row has Edit + Delete.
- Editor form fields: title, slug (auto-filled from title, editable), spec,
  price (dollars input → cents on submit), accent color, description, sold-out
  checkbox, display order, and the image upload widget.
- Save → POST (create) or PATCH (edit); Delete → DELETE with a confirm.
- Sign-out button.
- Styled with the existing horror-punk tokens; no new design language.

### `ImageUploader.vue`

Given a file: requests a signature (`POST /api/admin/uploads/sign`), uploads
directly to `https://api.cloudinary.com/v1_1/<cloudName>/image/upload`, and emits
`{ secureUrl, publicId }` to the form. Surfaces the 503 (uploads not configured)
and upload errors inline. Shows the current image when editing.

### `formatPrice` / price input

Price displays use the existing `formatPrice`. The editor's price input takes
dollars and converts to integer cents on submit.

## Error handling

- All `/api/admin/*` routes require auth → **401** when no valid session.
- Create/update validation → **400**; slug uniqueness → **409**; missing id → **404**.
- Sign endpoint → **503** when Cloudinary is unconfigured.
- Admin UI shows inline field/error messages and a confirm before delete.
- The storefront is unaffected by admin failures.

## Testing / acceptance

**Backend (curl + psql, session cookie from sign-in):**

1. Migration 003 applies; the 12 existing products get `image_url =
/stickers/<slug>.png`, `image_public_id = NULL`; `image_url` is NOT NULL.
2. `GET /api/products` now includes `imageUrl`.
3. Unauthenticated `GET /api/admin/products` → 401.
4. Authenticated: create a product (auto-slug), edit it, toggle sold-out, delete it.
5. Duplicate slug → 409; negative price → 400; missing id → 404.
6. `POST /api/admin/uploads/sign` → 503 when unconfigured; with test creds set,
   returns a signature payload.
7. Root build green across all three workspaces.

**Frontend (in-browser):** 8. `/` storefront renders 12 products via `imageUrl` (unchanged look). 9. `/admin` while logged out → redirected to `/admin/login`. 10. Sign in → `/admin` lists products; create/edit/delete + sold-out toggle work
and reflect on the storefront after reload. 11. Image upload works when Cloudinary is configured; shows the "not configured"
message otherwise.

## File summary

**Create (backend)**

- `backend/src/db/migrations/003_product_images.sql`
- `backend/src/products/admin-queries.ts`
- `backend/src/routes/admin-products.ts`
- `backend/src/uploads/cloudinary.ts`
- `backend/src/routes/uploads.ts`

**Modify (backend)**

- `backend/src/env.ts`, `backend/.env.example` (Cloudinary vars)
- `backend/src/products/seed.ts` (image_url in INSERT)
- `backend/src/products/queries.ts` (imageUrl in projection)
- `backend/src/index.ts` (mount admin-products + uploads routers)

**Create (frontend)**

- `web/src/router/index.ts`
- `web/src/stores/admin.ts`
- `web/src/views/StorefrontView.vue`
- `web/src/views/AdminLoginView.vue`
- `web/src/views/AdminView.vue`
- `web/src/components/ImageUploader.vue`

**Modify (frontend / shared)**

- `shared/src/types.ts` (`Product.imageUrl`, `AdminProduct`)
- `web/package.json` (vue-router, pinia)
- `web/src/main.ts` (router + pinia)
- `web/src/App.vue` (→ `<RouterView />`)
- `web/src/components/StickerCard.vue`, `StickerModal.vue` (`product.imageUrl`)

## Roadmap pointer

- **Phase 4:** Pinia cart store + CartDrawer (cart joins the admin store under Pinia).
- **Phase 5:** Stripe Checkout + webhook + orders (product delete will need to
  reckon with order references; revisit hard-delete then).
- **Cloudinary orphan cleanup** and **sticker image normalization** remain queued.
