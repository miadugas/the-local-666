# Backend v1 Phase 4 — Pinia Cart + CartDrawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working client-side cart — add-to-cart that adds, a slide-in drawer with quantities and a subtotal, a live header pill count, and a stubbed checkout button.

**Architecture:** A `useCartStore` (Pinia, localStorage-persisted) is the single source of truth for cart contents and drawer visibility. `CartDrawer.vue` renders from it and reuses `StickerModal`'s Escape/backdrop/scroll-lock/focus patterns. The Header pill and the add-to-cart handlers talk to the store directly (global, no prop drilling).

**Tech Stack:** Vue 3.5 (`<script setup lang="ts">`), Pinia, Vite 8, TypeScript 6.

**Verification approach:** No frontend test runner. Verify via `vue-tsc`/`npm run build` and in-browser (`npm run dev`) per the project pattern.

**Source spec:** `docs/superpowers/specs/2026-05-21-backend-v1-phase-4-design.md`

---

## File Structure

**Create:** `web/src/stores/cart.ts`, `web/src/components/CartDrawer.vue`
**Modify:** `web/src/components/Header.vue` (live count + open), `web/src/views/StorefrontView.vue` (mount drawer), `web/src/components/ProductGrid.vue` (`handleAddToCart` → store, close modal on add)

---

## Task 1: `useCartStore`

**Files:**

- Create: `web/src/stores/cart.ts`

- [ ] **Step 1.1: Create the store**

```ts
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import type { Product } from "@grave-goods/shared";

export type CartItem = {
  slug: string;
  title: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
};

const STORAGE_KEY = "grave-goods-cart";

function loadItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        i &&
        typeof i.slug === "string" &&
        typeof i.title === "string" &&
        typeof i.priceCents === "number" &&
        typeof i.imageUrl === "string" &&
        typeof i.quantity === "number",
    );
  } catch {
    return [];
  }
}

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>(loadItems());
  const isOpen = ref(false);

  const count = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0),
  );
  const subtotalCents = computed(() =>
    items.value.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
  );

  function addItem(product: Product) {
    const existing = items.value.find((i) => i.slug === product.slug);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.value.push({
        slug: product.slug,
        title: product.title,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        quantity: 1,
      });
    }
    isOpen.value = true;
  }

  function removeItem(slug: string) {
    items.value = items.value.filter((i) => i.slug !== slug);
  }

  function setQuantity(slug: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(slug);
      return;
    }
    const item = items.value.find((i) => i.slug === slug);
    if (item) item.quantity = quantity;
  }

  function increment(slug: string) {
    const item = items.value.find((i) => i.slug === slug);
    if (item) item.quantity += 1;
  }

  function decrement(slug: string) {
    const item = items.value.find((i) => i.slug === slug);
    if (!item) return;
    if (item.quantity <= 1) {
      removeItem(slug);
    } else {
      item.quantity -= 1;
    }
  }

  function clear() {
    items.value = [];
  }

  function open() {
    isOpen.value = true;
  }
  function close() {
    isOpen.value = false;
  }
  function toggle() {
    isOpen.value = !isOpen.value;
  }

  watch(
    items,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      } catch {
        /* ignore storage quota / availability errors */
      }
    },
    { deep: true },
  );

  return {
    items,
    isOpen,
    count,
    subtotalCents,
    addItem,
    removeItem,
    setQuantity,
    increment,
    decrement,
    clear,
    open,
    close,
    toggle,
  };
});
```

- [ ] **Step 1.2: Build (the store compiles; behavior verified in Task 2)**

```bash
npm run build --workspace web 2>&1 | tail -3
```

Expected: success. The store isn't referenced yet, but it must typecheck.

- [ ] **Step 1.3: Commit**

```bash
git add web/src/stores/cart.ts
git commit -m "feat(web): useCartStore — localStorage-persisted cart

Product-snapshot line items with count/subtotal getters and
add/remove/setQuantity/increment/decrement/clear plus drawer open state.
addItem opens the drawer; decrement at 1 removes the line; cart rehydrates
from and saves to localStorage."
```

---

## Task 2: CartDrawer + wiring (header pill, add-to-cart, mount)

**Files:**

- Create: `web/src/components/CartDrawer.vue`
- Modify: `web/src/views/StorefrontView.vue`, `web/src/components/Header.vue`, `web/src/components/ProductGrid.vue`

- [ ] **Step 2.1: Create `CartDrawer.vue`**

Mirrors `StickerModal`'s lifecycle (scroll-lock with previous-value capture, focus move on open, restore on unmount, Escape + backdrop dismiss). The drawer is conditionally mounted by `StorefrontView` (`v-if="cart.isOpen"`), so open/close maps to mount/unmount.

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useCartStore } from "../stores/cart";
import { formatPrice } from "../lib/format";

const cart = useCartStore();
const showCheckoutNote = ref(false);
const closeBtn = ref<HTMLButtonElement | null>(null);

let previouslyFocused: HTMLElement | null = null;
let prevBodyOverflow = "";

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    cart.close();
  }
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) cart.close();
}

function onCheckout() {
  showCheckoutNote.value = true;
}

onMounted(() => {
  previouslyFocused = document.activeElement as HTMLElement | null;
  document.addEventListener("keydown", onKeydown);
  prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => closeBtn.value?.focus());
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = prevBodyOverflow;
  if (previouslyFocused && document.body.contains(previouslyFocused)) {
    previouslyFocused.focus();
  }
});
</script>

<template>
  <div class="backdrop" @click="onBackdropClick">
    <aside class="panel" role="dialog" aria-modal="true" aria-label="Cart">
      <header class="head">
        <h2 class="title">Cart</h2>
        <button
          ref="closeBtn"
          type="button"
          class="close"
          aria-label="Close cart"
          @click="cart.close()"
        >
          ✕
        </button>
      </header>

      <p v-if="cart.items.length === 0" class="empty">
        Your cart's emptier than a cop's conscience. Go dig something up.
      </p>

      <ul v-else class="lines">
        <li v-for="item in cart.items" :key="item.slug" class="line">
          <img :src="item.imageUrl" alt="" class="thumb" />
          <div class="line-meta">
            <strong class="line-title">{{ item.title }}</strong>
            <span class="line-price">{{ formatPrice(item.priceCents) }}</span>
          </div>
          <div class="qty">
            <button
              type="button"
              class="step"
              aria-label="Decrease quantity"
              @click="cart.decrement(item.slug)"
            >
              −
            </button>
            <span class="qty-n">{{ item.quantity }}</span>
            <button
              type="button"
              class="step"
              aria-label="Increase quantity"
              @click="cart.increment(item.slug)"
            >
              +
            </button>
          </div>
          <button
            type="button"
            class="remove"
            aria-label="Remove from cart"
            @click="cart.removeItem(item.slug)"
          >
            ✕
          </button>
        </li>
      </ul>

      <footer v-if="cart.items.length > 0" class="foot">
        <div class="subtotal">
          <span>Subtotal</span>
          <span>{{ formatPrice(cart.subtotalCents) }}</span>
        </div>
        <button type="button" class="checkout" @click="onCheckout">
          Checkout
        </button>
        <p v-if="showCheckoutNote" class="note">
          Checkout lands in the next drop — payments aren't wired yet.
        </p>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: flex-end;
}
.panel {
  width: min(420px, 100%);
  height: 100%;
  background: var(--color-pitch);
  border-left: var(--border-bone);
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  overflow-y: auto;
  animation: drawer-slide var(--duration-base, 200ms) var(--ease-snap);
}
@keyframes drawer-slide {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .panel {
    animation: none;
  }
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: var(--border-bone);
  padding-bottom: 0.875rem;
  margin-bottom: 1rem;
}
.title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  color: var(--color-bone);
  margin: 0;
}
.close {
  min-width: 44px;
  min-height: 44px;
  font-family: var(--font-display);
  font-size: 1.4rem;
  background: transparent;
  color: var(--color-bone);
  border: none;
  cursor: pointer;
}
.empty {
  font-family: var(--font-zine);
  font-size: 0.9rem;
  color: var(--color-bone);
  letter-spacing: var(--tracking-wide);
}
.lines {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}
.line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: var(--border-ink);
  border-color: color-mix(in oklab, var(--color-bone) 35%, transparent);
  border-radius: var(--radius-tight);
  padding: 0.5rem;
}
.thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: var(--color-bone);
  border: var(--border-ink);
}
.line-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.line-title {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--color-bone);
}
.line-price {
  font-family: var(--font-display);
  color: var(--color-acid-pink);
  font-size: 1rem;
}
.qty {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.step {
  min-width: 28px;
  min-height: 28px;
  background: var(--color-bone);
  color: var(--color-ink);
  border: var(--border-ink);
  font-family: var(--font-display);
  cursor: pointer;
}
.qty-n {
  min-width: 1.25rem;
  text-align: center;
  font-family: var(--font-body);
  color: var(--color-bone);
}
.remove {
  background: transparent;
  color: var(--color-acid-red);
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
}
.foot {
  border-top: var(--border-bone);
  margin-top: 1rem;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.subtotal {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--color-bone);
}
.checkout {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.checkout:hover {
  transform: translate(-1px, -1px);
}
.checkout:active {
  transform: translate(2px, 2px);
}
.note {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  color: var(--color-acid-yellow);
  margin: 0;
}
</style>
```

- [ ] **Step 2.2: Mount the drawer in `StorefrontView.vue`**

Add the imports and render the drawer (conditionally) after `<Footer />`:

```vue
<script setup lang="ts">
import Header from "../components/Header.vue";
import Hero from "../components/Hero.vue";
import ProductGrid from "../components/ProductGrid.vue";
import Tenets from "../components/Tenets.vue";
import Manifesto from "../components/Manifesto.vue";
import Newsletter from "../components/Newsletter.vue";
import Footer from "../components/Footer.vue";
import CartDrawer from "../components/CartDrawer.vue";
import { useCartStore } from "../stores/cart";

const cart = useCartStore();
</script>

<template>
  <Header />
  <Hero />
  <ProductGrid />
  <Tenets />
  <Manifesto />
  <Newsletter />
  <Footer />
  <CartDrawer v-if="cart.isOpen" />
</template>
```

- [ ] **Step 2.3: Wire the Header pill**

In `web/src/components/Header.vue`, add the store and use it on the button:

```ts
<script setup lang="ts">
import { useCartStore } from "../stores/cart";

const cart = useCartStore();

const NAV = [
  { label: "Shop", href: "#shop" },
  { label: "Manifesto", href: "#manifesto" },
  { label: "About", href: "#about" },
];
</script>
```

Change the cart button:

```html
<button type="button" class="cart-btn" @click="cart.open()">
  Cart · {{ cart.count }}
</button>
```

- [ ] **Step 2.4: Wire add-to-cart in `ProductGrid.vue`**

Add the store import and update `handleAddToCart` to add the product and close the modal (so the drawer is what the user sees):

```ts
<script setup lang="ts">
import { ref } from "vue";
import type { Product } from "@grave-goods/shared";
import { useProducts } from "../composables/useProducts";
import { useCartStore } from "../stores/cart";
import StickerCard from "./StickerCard.vue";
import StickerModal from "./StickerModal.vue";

const { products, loading, error, reload } = useProducts();
const cart = useCartStore();
const selectedProduct = ref<Product | null>(null);

function handleAddToCart(product: Product) {
  cart.addItem(product);
  selectedProduct.value = null;
}

function handleViewDetail(product: Product) {
  selectedProduct.value = product;
}

function handleClose() {
  selectedProduct.value = null;
}
</script>
```

- [ ] **Step 2.5: Typecheck + build**

```bash
npm run build --workspace web 2>&1 | tail -3
```

Expected: success (`vue-tsc -b && vite build`).

- [ ] **Step 2.6: In-browser verification**

```bash
npm run dev
```

At `http://localhost:5173`:

1. Click **Add ↗** on a card → the drawer opens, the line shows title / price / qty 1; the header reads **Cart · 1**.
2. Add the same product again → that line shows qty **2**; header **Cart · 2**.
3. Open a product modal → **Add to cart** → the modal closes and the item is in the drawer.
4. **+ / −** adjust the line and the subtotal; **−** at qty 1 removes the line.
5. **✕** on a line removes it; emptying the cart shows the empty state; header **Cart · 0**.
6. Subtotal equals Σ price×qty.
7. Reload → cart contents persist; the drawer is closed.
8. **Checkout** shows the "next drop" note and does not navigate.
9. Escape and backdrop click close the drawer.

Stop the dev server.

- [ ] **Step 2.7: Commit**

```bash
git add web/src/components/CartDrawer.vue web/src/views/StorefrontView.vue web/src/components/Header.vue web/src/components/ProductGrid.vue
git commit -m "feat(web): CartDrawer + add-to-cart + live header pill

CartDrawer (right-slide, reuses the modal's scroll-lock/focus/Escape
patterns) lists lines with quantity steppers, remove, subtotal, and a
stubbed checkout. ProductGrid's add handler now fills the cart and closes
the modal; the header pill shows the live count and opens the drawer."
```

---

## Self-Review notes

**Spec coverage:**

- `useCartStore` (state/getters/actions + localStorage) → Task 1
- `CartDrawer` (lines, steppers, remove, subtotal, empty state, stubbed checkout) → Task 2
- Header pill live count + open → Task 2
- Mount in StorefrontView → Task 2
- Add-to-cart wiring + close modal on add → Task 2
- Acceptance items 1–9 → Task 2 in-browser steps (+ build in 1.2 / 2.5)
- Confirmed decisions: addItem opens drawer (a) → store `addItem`; checkout note (b) → `onCheckout`/`showCheckoutNote`; − at 1 removes (c) → `decrement`.

**Placeholder scan:** No "TBD"/"TODO". Empty-state copy is concrete; all code blocks complete. The `/* ignore */` comments are real no-op branches, not placeholders.

**Type consistency:** `CartItem` (Task 1) fields match the snapshot built in `addItem` and what `CartDrawer` reads (`slug/title/priceCents/imageUrl/quantity`). `addItem(product: Product)` takes the shared `Product` (has `slug/title/priceCents/imageUrl`), matching `ProductGrid`'s `handleAddToCart(product: Product)`. `count`/`subtotalCents` getters match the Header pill and the drawer subtotal. `formatPrice` reused from `web/src/lib/format.ts`.
