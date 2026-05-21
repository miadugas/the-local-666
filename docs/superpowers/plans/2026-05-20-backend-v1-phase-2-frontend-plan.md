# Phase 2 Frontend — Wire Storefront to Product API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `web/src/data/products.ts` catalog with live data from `GET /api/products`, wire the acid-red sold-out state, and demonstrate it against a real seeded sold-out product ("Eat the Rich").

**Architecture:** A `useProducts` composable owns the fetch + reactive state; `ProductGrid` branches loading/error/loaded; `StickerCard` and `StickerModal` become presentational components over the shared `@grave-goods/shared` `Product` contract. The static data module is deleted.

**Tech Stack:** Vue 3.5 (`<script setup lang="ts">`), Vite 8, Tailwind v4, TypeScript 6, npm workspaces.

**Verification approach:** No frontend test runner. Following the project pattern, verify via `vue-tsc` typecheck, `npm run build`, and in-browser use (`npm run dev`, load `:5173`) — plus `curl`/`psql` for the backend seed task. Postgres (Postgres.app) must be running with `grave_goods`.

**Source spec:** `docs/superpowers/specs/2026-05-20-backend-v1-phase-2-frontend-design.md`

---

## File Structure

**Create**

- `web/src/composables/useProducts.ts` — fetch `/api/products`, expose `{ products, loading, error, reload }`
- `web/src/lib/format.ts` — `formatPrice(cents)`
- `web/public/stickers/eat-the-rich.png` — interim placeholder (copy of `devour-feculence.png`)

**Modify**

- `backend/src/data/seed-products.ts` — add `isSoldOut` + 12th product
- `backend/src/products/seed.ts` — include `is_sold_out` in the INSERT
- `web/package.json` — add `@grave-goods/shared` dependency
- `web/src/components/ProductGrid.vue` — consume composable, loading/error/loaded states
- `web/src/components/StickerCard.vue` — shared `Product`, field remap, sold-out visual
- `web/src/components/StickerModal.vue` — shared `Product`, field remap, sold-out button + focus-trap fix

**Delete**

- `web/src/data/products.ts`

---

## Task 1: Backend seed — `is_sold_out` + 12th sold-out product

**Files:**

- Modify: `backend/src/data/seed-products.ts`
- Modify: `backend/src/products/seed.ts`
- Create: `web/public/stickers/eat-the-rich.png`

- [ ] **Step 1.1: Add `isSoldOut` to the `SeedProduct` type**

In `backend/src/data/seed-products.ts`, add the field to the type:

```ts
export type SeedProduct = {
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  accentHex: string;
  description: string | null;
  displayOrder: number;
  isSoldOut: boolean;
};
```

- [ ] **Step 1.2: Add `isSoldOut: false,` to each of the 11 existing entries**

Append `isSoldOut: false,` as the last field of every existing product object. For example, the first entry becomes:

```ts
  {
    slug: "protect-trans-kids",
    title: "Protect Trans Kids",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#5BCEFA",
    description:
      "Trans kids exist, trans kids deserve protection, trans kids are not a debate. Slap this on a laptop, a locker, or every door at your kid's school district HQ.",
    displayOrder: 0,
    isSoldOut: false,
  },
```

Do the same for all 11 (`displayOrder` 0 through 10).

- [ ] **Step 1.3: Add the 12th product (sold out) as the last array entry**

```ts
  {
    slug: "eat-the-rich",
    title: "Eat the Rich",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#34d399",
    description:
      "The rich aren't coming to save you. Slap this on a water bottle, a hard hat, or the tip jar at the third job you work just to make rent.",
    displayOrder: 11,
    isSoldOut: true,
  },
```

(Accent is a normal green — acid-red stays exclusively on the sold-out badge per CLAUDE.md.)

- [ ] **Step 1.4: Include `is_sold_out` in the seed INSERT**

In `backend/src/products/seed.ts`, change the INSERT to add the eighth column + value:

```ts
await client.query(
  `INSERT INTO products
           (slug, title, spec, price_cents, accent_hex, description, display_order, is_sold_out)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
  [
    product.slug,
    product.title,
    product.spec,
    product.priceCents,
    product.accentHex,
    product.description,
    product.displayOrder,
    product.isSoldOut,
  ],
);
```

- [ ] **Step 1.5: Create the placeholder image**

```bash
cp web/public/stickers/devour-feculence.png web/public/stickers/eat-the-rich.png
```

- [ ] **Step 1.6: Build the backend**

```bash
npm run build --workspace backend
```

Expected: success.

- [ ] **Step 1.7: Re-seed the dev DB (truncate, then boot once)**

`seedProductsIfEmpty` skips a non-empty table, so re-seed manually:

```bash
psql -d grave_goods -c "TRUNCATE products RESTART IDENTITY"
cd backend && npx tsx src/index.ts > /tmp/p2f-seed.log 2>&1 & sleep 3; grep -E "\[seed\] (inserted|products)" /tmp/p2f-seed.log; pkill -f "tsx src/index.ts"; cd ..
```

Expected: `[seed] inserted 12 products`.

- [ ] **Step 1.8: Verify the sold-out product**

```bash
psql -d grave_goods -tAc "SELECT COUNT(*) FROM products"
psql -d grave_goods -tAc "SELECT slug, is_sold_out FROM products WHERE is_sold_out = true"
```

Expected: `12`, then `eat-the-rich|t`.

- [ ] **Step 1.9: Verify via the API**

```bash
cd backend && npx tsx src/index.ts > /tmp/p2f-api.log 2>&1 & sleep 3
curl -s http://localhost:4000/api/products | python3 -c "import sys,json; d=json.load(sys.stdin); print('count:', len(d)); print([p['slug'] for p in d if p['isSoldOut']])"
curl -s http://localhost:4000/api/products/eat-the-rich | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['title'], d['priceCents'], d['accentHex'], d['isSoldOut'])"
pkill -f "tsx src/index.ts"; cd ..
```

Expected: `count: 12`, `['eat-the-rich']`, then `Eat the Rich 400 #34d399 True`.

- [ ] **Step 1.10: Commit**

```bash
git add backend/src/data/seed-products.ts backend/src/products/seed.ts web/public/stickers/eat-the-rich.png
git commit -m "feat(backend): seed is_sold_out + add sold-out product 'Eat the Rich'

SeedProduct carries isSoldOut; the seed INSERT writes is_sold_out. Adds a
12th product (eat-the-rich) seeded sold out so the frontend sold-out state
renders against real data. Placeholder image copies devour-feculence.png."
```

---

## Task 2: Frontend infrastructure — shared dep, `formatPrice`, `useProducts`

**Files:**

- Modify: `web/package.json`
- Create: `web/src/lib/format.ts`
- Create: `web/src/composables/useProducts.ts`

- [ ] **Step 2.1: Add the shared dependency to `web/package.json`**

Add `@grave-goods/shared` to `dependencies` (it's currently `{ "vue": "^3.5.34" }`):

```json
  "dependencies": {
    "@grave-goods/shared": "*",
    "vue": "^3.5.34"
  },
```

- [ ] **Step 2.2: Install so the workspace symlink is created**

```bash
npm install
```

Expected: completes; `node_modules/@grave-goods/shared` symlinks to `shared/`.

- [ ] **Step 2.3: Create `web/src/lib/format.ts`**

```ts
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
```

- [ ] **Step 2.4: Create `web/src/composables/useProducts.ts`**

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

- [ ] **Step 2.5: Typecheck + build (modules compile though still unused)**

```bash
npm run build --workspace web
```

Expected: success (`vue-tsc -b && vite build`). The components still import `../data/products` at this point, so the build stays green.

- [ ] **Step 2.6: Commit**

```bash
git add web/package.json package-lock.json web/src/lib/format.ts web/src/composables/useProducts.ts
git commit -m "feat(web): add useProducts composable + formatPrice util

useProducts fetches /api/products and exposes products/loading/error/reload
over the shared Product contract. formatPrice renders integer cents as
\$N. web now depends on @grave-goods/shared."
```

---

## Task 3: Rewire components to the API + sold-out visual; delete static data

**Files:**

- Modify: `web/src/components/ProductGrid.vue`
- Modify: `web/src/components/StickerCard.vue`
- Modify: `web/src/components/StickerModal.vue`
- Delete: `web/src/data/products.ts`

- [ ] **Step 3.1: Rewrite `ProductGrid.vue` `<script setup>`**

Replace the current script block with:

```ts
<script setup lang="ts">
import { ref } from "vue";
import type { Product } from "@grave-goods/shared";
import { useProducts } from "../composables/useProducts";
import StickerCard from "./StickerCard.vue";
import StickerModal from "./StickerModal.vue";

const { products, loading, error, reload } = useProducts();
const selectedProduct = ref<Product | null>(null);

function handleAddToCart(_product: Product) {
  // No-op until Pinia cart store lands (Phase 4).
}

function handleViewDetail(product: Product) {
  selectedProduct.value = product;
}

function handleClose() {
  selectedProduct.value = null;
}
</script>
```

- [ ] **Step 3.2: Update `ProductGrid.vue` template — count + loading/error/loaded**

Replace the head-link count and the `.grid` block. The `<header class="head">` count line becomes `all {{ products.length }} →`, and the grid is replaced with three states:

```html
<header class="head">
  <div>
    <span class="eyebrow">★ Fresh out of the ground</span>
    <h2 class="title">In the catalog</h2>
  </div>
  <span class="head-link" aria-hidden="true">
    all {{ products.length }} →
  </span>
</header>

<p v-if="loading" class="state">Digging up the goods…</p>

<div v-else-if="error" class="state state-error">
  <p>The crypt door's stuck — couldn't load the goods.</p>
  <button type="button" class="retry" @click="reload">Retry</button>
</div>

<div v-else class="grid">
  <StickerCard
    v-for="(product, i) in products"
    :key="product.id"
    :product="product"
    :index="i"
    @add-to-cart="handleAddToCart"
    @view-detail="handleViewDetail"
  />
</div>
```

- [ ] **Step 3.3: Add `ProductGrid.vue` state styles**

Append to the `<style scoped>` block:

```css
.state {
  font-family: var(--font-zine);
  font-size: 0.95rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-bone);
  padding: 2rem 0;
}
.state-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}
.retry {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8125rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 0.625rem 1.25rem;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.retry:hover {
  transform: translate(-1px, -1px);
}
.retry:active {
  transform: translate(2px, 2px);
}
```

- [ ] **Step 3.4: Rewrite `StickerCard.vue` `<script setup>`**

```ts
<script setup lang="ts">
import { computed } from "vue";
import type { Product } from "@grave-goods/shared";
import { formatPrice } from "../lib/format";

const props = defineProps<{
  product: Product;
  /**
   * 0-indexed position in the grid. Drives strip color, strip label, and
   * price color in lockstep (all cycle through STRIPS modulo length).
   */
  index: number;
}>();

const emit = defineEmits<{
  "add-to-cart": [product: Product];
  "view-detail": [product: Product];
}>();

// MUST stay a closed token list — `color` values flow into inline style as
// raw CSS. Never derive from product data or user input.
const STRIPS = [
  { color: "var(--color-acid-pink)", label: "Protect" },
  { color: "var(--color-acid-blue)", label: "A.C.A.B." },
  { color: "var(--color-acid-yellow)", label: "Wake up" },
  { color: "var(--color-acid-lime)", label: "Class!" },
] as const;

const strip = computed(() => STRIPS[props.index % STRIPS.length]);
</script>
```

- [ ] **Step 3.5: Update `StickerCard.vue` template — slug, price, sold-out**

Replace the `<template>` with:

```html
<template>
  <article
    class="card"
    :class="{ 'is-sold-out': product.isSoldOut }"
    :style="{ '--strip': strip.color }"
  >
    <div class="strip">{{ strip.label }}</div>

    <div class="image-tape">
      <span v-if="product.isSoldOut" class="sold-out-badge">Sold Out</span>
      <img
        :src="`/stickers/${product.slug}.png`"
        :alt="product.title"
        draggable="false"
      />
    </div>

    <div class="meta">
      <h3 class="title">
        <!-- The view-detail trigger. The ::before overlay extends this button's
             hit area over the entire card surface, so clicks anywhere on the
             card (except the Add button) open the modal. -->
        <button
          type="button"
          class="title-btn"
          :aria-label="`View details for ${product.title}`"
          @click="emit('view-detail', product)"
        >
          {{ product.title }}
        </button>
      </h3>
      <div class="row">
        <span class="price">{{ formatPrice(product.priceCents) }}</span>
        <button
          v-if="product.isSoldOut"
          type="button"
          class="add add-disabled"
          disabled
        >
          Sold out
        </button>
        <button
          v-else
          type="button"
          class="add"
          @click.stop="emit('add-to-cart', product)"
        >
          Add ↗
        </button>
      </div>
    </div>
  </article>
</template>
```

- [ ] **Step 3.6: Add `StickerCard.vue` sold-out styles**

Append to the `<style scoped>` block:

```css
.image-tape .sold-out-badge {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(var(--rotate-stencil));
  background: var(--color-acid-red);
  color: var(--color-ink);
  border: var(--border-ink);
  font-family: var(--font-zine);
  font-size: 0.8rem;
  letter-spacing: var(--tracking-shout);
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  white-space: nowrap;
}
.is-sold-out .image-tape img {
  filter: grayscale(1);
  opacity: 0.45;
}
.add-disabled,
.add-disabled:hover {
  color: color-mix(in oklab, var(--color-bone) 45%, transparent);
  cursor: not-allowed;
}
```

- [ ] **Step 3.7: Update `StickerModal.vue` `<script setup>` imports + focus-trap**

Change the imports at the top of the script:

```ts
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { Product } from "@grave-goods/shared";
import { formatPrice } from "../lib/format";
```

In `onKeydown`, make the focus trap skip disabled buttons (the sold-out Add is disabled, so it must not be counted as focusable):

```ts
const focusables = [closeBtn.value, addBtn.value].filter(
  (el): el is HTMLButtonElement => el !== null && !el.disabled,
);
```

- [ ] **Step 3.8: Update `StickerModal.vue` template — accent, slug, price, sold-out button**

- Change the panel style binding to `:style="{ '--accent': product.accentHex }"`.
- Change the image `src` to `/stickers/${product.slug}.png`.
- Replace the `.buy` block:

```html
<div class="buy">
  <span class="price">{{ formatPrice(product.priceCents) }}</span>
  <button
    v-if="product.isSoldOut"
    ref="addBtn"
    type="button"
    class="add add-disabled"
    disabled
  >
    Sold out
  </button>
  <button
    v-else
    ref="addBtn"
    type="button"
    class="add"
    @click="emit('add-to-cart', product)"
  >
    Add to cart
  </button>
</div>
```

- [ ] **Step 3.9: Add `StickerModal.vue` sold-out button style**

Append to the `<style scoped>` block:

```css
.add.add-disabled {
  background: var(--color-acid-red);
  color: var(--color-ink);
  opacity: 0.55;
  box-shadow: none;
  cursor: not-allowed;
}
.add.add-disabled:hover {
  transform: none;
}
```

- [ ] **Step 3.10: Delete the static data module**

```bash
git rm web/src/data/products.ts
```

- [ ] **Step 3.11: Confirm nothing references the deleted module**

```bash
grep -rn "data/products" web/src
```

Expected: no matches.

- [ ] **Step 3.12: Typecheck + build**

```bash
npm run build --workspace web
```

Expected: success (`vue-tsc -b && vite build`). No type errors from the field renames.

- [ ] **Step 3.13: In-browser verification**

```bash
npm run dev
```

In a browser at `http://localhost:5173`:

1. 12 cards render; prices show `$4`; head count reads `all 12 →`.
2. "Eat the Rich" shows the sold-out state: acid-red `SOLD OUT` badge, grayscale/dim image, disabled `Sold out` button.
3. Open a normal card → modal shows description, spec, accent color, `$4`, working `Add to cart`.
4. Open "Eat the Rich" → modal's buy button is the disabled `Sold out`; Tab stays trapped on the close button.
5. Stop the backend, reload → error state + Retry; restart backend, click Retry → grid loads.

Stop the dev server when done.

- [ ] **Step 3.14: Commit**

```bash
git add web/src/components/ProductGrid.vue web/src/components/StickerCard.vue web/src/components/StickerModal.vue
git commit -m "feat(web): wire storefront to product API + sold-out state

ProductGrid fetches via useProducts with thematic loading/error states.
StickerCard/StickerModal consume the shared Product contract (slug image
path, formatPrice, accentHex) and render the acid-red sold-out badge +
disabled buy button. Removes the static products.ts catalog."
```

---

## Self-Review notes

**Spec coverage:**

- `useProducts` composable (§New units) → Task 2
- `formatPrice` util (§New units) → Task 2
- web → shared dep + component imports (§Scope) → Tasks 2, 3
- Field remap id/price/ring (§Field remapping) → Task 3 (cards + modal)
- Loading/error/loaded states (§Loading/error) → Task 3 (ProductGrid)
- Sold-out visual card + modal (§Sold-out) → Task 3
- 12th product seeded sold out + `is_sold_out` seed change + image (§Backend seed change) → Task 1
- Delete `web/src/data/products.ts` (§Scope) → Task 3
- Acceptance items 1–6 (§Testing) → Task 1 (seed/API), Task 3 (in-browser, typecheck, build)

**Placeholder scan:** No "TBD"/"TODO". The "Eat the Rich" description and all code blocks are concrete. Step 1.2 gives a precise mechanical instruction (append one field to each of 11 entries) with a worked example — not a vague placeholder.

**Type consistency:** `Product` fields (`slug`, `priceCents`, `accentHex`, `isSoldOut`, `description`) are used identically across `useProducts` (Task 2), `StickerCard`, `StickerModal`, `ProductGrid` (Task 3). `SeedProduct.isSoldOut` (Task 1) maps to the `is_sold_out` column written by the INSERT (Task 1) and surfaced as `isSoldOut` by the existing backend `mapRow`. `formatPrice` signature matches its call sites.
