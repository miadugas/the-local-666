# Backend v1 — Phase 4: Pinia cart store + CartDrawer

**Date:** 2026-05-21
**Status:** Approved (design)
**Depends on:** Phase 2 (storefront reads from API) + Phase 3 (Pinia installed) — complete.

## Goal

Add a working client-side cart: an "Add to cart" that actually adds, a slide-out
drawer with quantities and a subtotal, a live count in the header pill, and a
stubbed checkout button ready for Phase 5. No backend changes.

## Scope

**In scope**

- `useCartStore` (Pinia): line items, open state, totals; persisted to localStorage
- `CartDrawer.vue`: right-slide panel with line items, quantity steppers, remove, subtotal, stubbed checkout
- Wire the `add-to-cart` handlers (ProductGrid → StickerCard/StickerModal) to the store
- Header cart pill shows the live count and opens the drawer
- Mount the drawer in `StorefrontView`

**Out of scope**

- Real checkout / payments / Stripe (Phase 5)
- Shipping, tax, promo codes
- Server-side cart or persistence beyond localStorage
- A dedicated `/cart` route (the drawer is the cart surface)

## Confirmed decisions

- **Persistence:** localStorage (`grave-goods-cart`); rehydrate on init, save on change.
- **Line item:** product snapshot `{ slug, title, priceCents, imageUrl, quantity }`.
  Price is display-only; Phase 5 re-prices from the DB at checkout.
- **(a)** `addItem` also opens the drawer (immediate feedback).
- **(b)** Checkout button is present/styled; clicking shows an inline "Checkout
  lands in the next drop — payments aren't wired yet" note (no-op stub).
- **(c)** Pressing − at quantity 1 removes the line.

## Architecture

The cart is entirely client-side. `useCartStore` is the single source of truth
for cart contents and drawer visibility; because it's a global Pinia store, the
Header (pill) and the `CartDrawer` coordinate without prop drilling. The drawer
reuses the interaction patterns already proven in `StickerModal` (Escape /
backdrop dismiss, body scroll-lock with previous-value capture, focus move on
open and restore on close). Sold-out products can't be added because their Add
buttons are already disabled (Phase 2), so cart items are always purchasable at
add-time.

## Components & data

### `web/src/stores/cart.ts`

```ts
type CartItem = {
  slug: string;
  title: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
};
```

- **State:** `items: CartItem[]`, `isOpen: boolean`.
- **Getters:** `count` = Σ `quantity`; `subtotalCents` = Σ `priceCents * quantity`.
- **Actions:**
  - `addItem(product: Product)` — if a line with the same `slug` exists, increment
    its quantity; otherwise push a snapshot with `quantity: 1`. Then `open()`.
  - `removeItem(slug)`, `setQuantity(slug, qty)` (qty ≤ 0 removes), `increment(slug)`,
    `decrement(slug)` (at 1 → removes), `clear()`.
  - `open()`, `close()`, `toggle()`.
- **Persistence:** on store init, read `localStorage["grave-goods-cart"]` and parse
  (guard against malformed JSON → empty). `watch(items, save, { deep: true })`
  writes the serialized items back. `isOpen` is not persisted.

### `web/src/components/CartDrawer.vue`

- Fixed full-viewport overlay; the panel slides in from the right.
- Dismiss via the × button, backdrop click, or Escape. Body scroll-locks while
  open (capture and restore the previous `overflow`). Focus moves into the drawer
  on open and restores on close (mirrors `StickerModal`).
- **Line items:** thumbnail (`imageUrl`), title, `formatPrice(priceCents)`, a
  quantity stepper (− / quantity / +), and a remove (×) control.
- **Footer:** `Subtotal` with `formatPrice(subtotalCents)`, then the Checkout
  button (decision b). Clicking Checkout reveals an inline note; no navigation.
- **Empty state:** a thematic line (on-brand, not "lorem") and nothing else.
- Utility wording stays literal per CLAUDE.md: "Cart", "Subtotal", "Checkout".

### `web/src/components/Header.vue`

The static `Cart · 0` becomes `Cart · {{ cart.count }}` and `@click="cart.open()"`.

### `web/src/views/StorefrontView.vue`

Renders `<CartDrawer />` after the existing sections.

### Add-to-cart wiring

`ProductGrid.handleAddToCart(product)` calls `cart.addItem(product)` (it currently
no-ops). The `StickerCard` and `StickerModal` emits already pass the product up;
no signature changes. The `StickerModal` may close on add (so the drawer is
visible) — its `add-to-cart` handler in `ProductGrid` also closes the modal.

## Error handling / edge cases

- Malformed or absent `localStorage` → start with an empty cart.
- `decrement` at quantity 1 and `setQuantity(_, 0)` remove the line.
- Sold-out products are unreachable via Add (buttons disabled in Phase 2).
- Adding the same product twice increments rather than duplicating a line.

## Testing / acceptance (in-browser, per project rule)

1. `npm run dev`. Add a product from a card → the drawer opens, the line shows
   title/price/qty 1, and the header pill reads `Cart · 1`.
2. Add the same product again → quantity becomes 2 (one line), pill `Cart · 2`.
3. Add from the detail modal → modal closes, item lands in the drawer.
4. Quantity + / − adjust the line and the subtotal; − at 1 removes the line.
5. Remove (×) clears a line; emptying the cart shows the empty state; pill `Cart · 0`.
6. Subtotal equals Σ price×qty using `formatPrice`.
7. Reload the page → the cart contents persist; the drawer is closed.
8. Checkout button shows the "next drop" note and does not navigate.
9. `vue-tsc` typecheck + `npm run build` green.

## File summary

**Create**

- `web/src/stores/cart.ts`
- `web/src/components/CartDrawer.vue`

**Modify**

- `web/src/components/Header.vue` (live count + open)
- `web/src/views/StorefrontView.vue` (mount the drawer)
- `web/src/components/ProductGrid.vue` (`handleAddToCart` → `cart.addItem`, close modal on add)

## Roadmap pointer

- **Phase 5:** Stripe Checkout — the stubbed Checkout button POSTs the cart to a
  `/api/checkout` endpoint that builds a hosted Checkout session from inline
  `price_data` (re-priced from the DB), plus the webhook + orders table.
- **Phase 6:** Resend order-confirmation email.
