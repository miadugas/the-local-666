# Backend v1 — Phase 2 (frontend): Wire storefront to the product API

**Date:** 2026-05-20
**Status:** Approved (design)
**Depends on:** Phase 2 backend (product DB + read API) — complete.

## Goal

Replace the static `web/src/data/products.ts` catalog with live data from
`GET /api/products`. Introduce a `useProducts` composable, switch the product
components to the shared `Product` contract, and wire the acid-red sold-out
card/modal state — demonstrated against a real seeded sold-out product.

## Scope

**In scope**

- `useProducts` composable: fetch `/api/products`, expose `{ products, loading, error, reload }`
- `formatPrice(cents)` util (cents → `"$4"` / `"$4.50"`)
- `web` depends on `@grave-goods/shared`; components import `Product` from it
- Field remap in `StickerCard` + `StickerModal` (`id→slug`, `price→priceCents`, `ring→accentHex`)
- `ProductGrid` loading / error / loaded states (thematic text + Retry)
- Sold-out visual in `StickerCard` + `StickerModal`, driven by `isSoldOut`
- Add a 12th product **"Eat the Rich"** (`eat-the-rich`), seeded `is_sold_out = true`
- Extend the backend seed to carry `is_sold_out`; re-seed the dev DB
- Delete `web/src/data/products.ts`

**Out of scope**

- Cart wiring — the `add-to-cart` handlers stay no-ops (Phase 4)
- A per-product route/page and consumption of `GET /api/products/:slug`
- Real artwork for "Eat the Rich" (interim placeholder image)
- Cloudinary (Phase 3)

## Architecture

`useProducts` owns the fetch and reactive state. `ProductGrid` consumes it and
branches on `loading` / `error` / loaded. `StickerCard` and `StickerModal`
become pure presentational components over the shared `Product` type. The static
data module is removed, leaving the Postgres `products` table as the single
catalog source.

## New / changed units

### `web/src/composables/useProducts.ts` (new)

```ts
import { ref } from "vue";
import type { Product } from "@grave-goods/shared";

export function useProducts() {
  const products = ref<Product[]>([]);
  const loading = ref(true);
  const error = ref(false);

  async function load() {
    loading.value = true;
    error.value = false;
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      products.value = (await res.json()) as Product[];
    } catch {
      error.value = true;
    } finally {
      loading.value = false;
    }
  }

  void load();
  return { products, loading, error, reload: load };
}
```

Fetches once on use. `reload` backs the error-state Retry button. Errors
(network or non-2xx) set `error = true`; the component decides presentation.

### `web/src/lib/format.ts` (new)

```ts
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
```

Shared by card + modal (and the future cart). All current prices are `400` → `"$4"`.

### `web/package.json` (modify)

Add `"@grave-goods/shared": "*"` to `dependencies`; run `npm install` so the
workspace symlink is created (mirrors the backend wiring).

### `ProductGrid.vue` (modify)

- Replace the static import with `const { products, loading, error, reload } = useProducts()`.
- Template branches:
  - **loading:** `<p class="state">Digging up the goods…</p>` (Special Elite).
  - **error:** thematic line + a `Retry` button calling `reload()`.
  - **loaded:** existing grid over `products`; head count `{{ products.length }}`.
- `selectedProduct` ref + modal wiring unchanged (now typed to the shared `Product`).

### `StickerCard.vue` (modify)

- Import `Product` from `@grave-goods/shared`; drop `../data/products`.
- Image `src` → `/stickers/${product.slug}.png`; price → `formatPrice(product.priceCents)`.
- `STRIPS` array + `index`-driven strip color/label unchanged.
- **Sold-out (`product.isSoldOut`):**
  - An acid-red taped `SOLD OUT` badge over the image area (Special Elite caps, ink text, slight rotate, `--border-ink`).
  - Image-tape dimmed (`filter: grayscale(1)` + reduced opacity).
  - The `Add ↗` button is replaced by a disabled `Sold out` (the `disabled` attribute; no `add-to-cart` emit).
  - Title + price stay legible; the card still opens the modal.

### `StickerModal.vue` (modify)

- Import `Product` from `@grave-goods/shared`; drop `../data/products`.
- `--accent` → `product.accentHex`; image `src` → `product.slug`; price → `formatPrice(product.priceCents)`.
- `description ?? FALLBACK_DESCRIPTION` unchanged (nullish handles `null`).
- **Sold-out:** the `Add to cart` button becomes a disabled `Sold out`.

### `web/src/data/products.ts` (delete)

Removed once nothing imports it.

## Backend seed change (to surface a real sold-out product)

### `backend/src/data/seed-products.ts` (modify)

- Add `isSoldOut: boolean` to the `SeedProduct` type.
- All 11 existing entries → `isSoldOut: false`.
- Add a 12th entry:
  - `slug: "eat-the-rich"`, `title: "Eat the Rich"`, `spec: '3" die-cut vinyl'`,
    `priceCents: 400`, `accentHex: "#34d399"`, a thematic `description`,
    `displayOrder: 11`, `isSoldOut: true`.
  - Note: the product accent is a normal green, **not** acid-red. Acid-red
    (`--color-acid-red`) stays exclusively on the sold-out badge (warning
    semantics), never as a decorative product accent — per CLAUDE.md.

### `backend/src/products/seed.ts` (modify)

Include `is_sold_out` in the INSERT column list and values (`$8`).

### Re-seed the dev DB

`seedProductsIfEmpty` skips a non-empty table, so re-seeding is manual in dev:
`TRUNCATE products RESTART IDENTITY`, then boot once → all 12 insert (11 in-stock,
"Eat the Rich" sold out).

### `web/public/stickers/eat-the-rich.png` (new)

Interim placeholder — a copy of `devour-feculence.png`. Flagged to replace with
real art. (CLAUDE.md already treats `/stickers/` as placeholders pre-Cloudinary.)

## Data flow

`ProductGrid` fetches the full list once. The modal reuses the already-fetched
product object (which includes `description`), so `GET /api/products/:slug` is
not consumed by this slice — it remains for future per-product pages/deep links.

## Error handling

- Fetch network failure or non-2xx → `error = true` → error state + Retry.
- Missing image asset → broken `img` (acceptable; all 12 slugs have a file after
  the placeholder copy).
- No auth — the catalog is public.

## Testing / acceptance (in-browser, per project rule)

1. `npm run dev` (web + backend). Load `http://localhost:5173`.
2. 12 cards render from the API; prices show `$4`.
3. "Eat the Rich" shows the sold-out state: acid-red `SOLD OUT` badge, dimmed
   image, disabled `Sold out` button. It still opens the modal; the modal's
   buy button is the disabled `Sold out`.
4. A normal card opens the modal with description, spec, accent color, `$4`.
5. Stop the backend, reload → error state + Retry; restart backend, click Retry → grid loads.
6. `vue-tsc` typecheck + `npm run build` (root) green; `web/src/data/products.ts` is gone and unreferenced.

## File summary

**Create**

- `web/src/composables/useProducts.ts`
- `web/src/lib/format.ts`
- `web/public/stickers/eat-the-rich.png` (placeholder copy)

**Modify**

- `web/package.json` (+ `package-lock.json` via install)
- `web/src/components/ProductGrid.vue`
- `web/src/components/StickerCard.vue`
- `web/src/components/StickerModal.vue`
- `backend/src/data/seed-products.ts`
- `backend/src/products/seed.ts`

**Delete**

- `web/src/data/products.ts`

## Roadmap pointer

- **Phase 3:** Cloudinary signed-upload + admin product editor (real artwork,
  product CRUD, sold-out toggle in the admin UI).
- **Phase 4:** Pinia cart store + CartDrawer (replaces the no-op add handlers).
