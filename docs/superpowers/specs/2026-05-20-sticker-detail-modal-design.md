# Sticker Detail Modal — Design Spec

**Date:** 2026-05-20
**Status:** Approved direction, pending implementation plan
**Scope:** Add a clickable product-detail modal to the storefront so visitors can read a description, see the image larger, and add to cart from a focused view.

---

## 1. Intent

When a visitor clicks a sticker card on the homepage, open a modal overlay that shows the full product detail: image, title, description, spec, price, and an Add to cart button. The existing `Add ↗` button on the card keeps adding-to-cart inline without opening the modal.

This is a contained feature — one new component + targeted edits to two existing components + a data-model field on `Product`. No new dependencies. No router. Same horror-punk pop-art vocabulary as the rest of the site.

---

## 2. Pattern choice + rationale

**Modal** chosen over dedicated route, side drawer, and inline expansion.

- A dedicated route (`/stickers/:slug`) is the right long-term pattern — shareable URLs matter for a sticker shop where products travel via social shares — but it requires adding vue-router and earns its complexity only once real product photos and Stripe Products land. Migration path is open.
- Side drawer has the same URL-shareability gap as a modal and gives less content room.
- Inline expansion rearranges the grid jarringly as cards open/close.
- Modal ships fastest, is fully revertible, and matches the current static-SPA architecture.

**Migration trigger:** when (a) real product photos exist (worth dedicating screen real estate to) AND (b) Stripe Products is wired (people will want to share specific sticker URLs), replace this modal with a vue-router route.

---

## 3. Trigger

The entire `.card` element becomes the primary click target.

- Card root gets `role="button" tabindex="0" aria-label="View details for {product.title}"`.
- Click handler on the card opens the modal.
- Keyboard handlers on `@keydown.enter` and `@keydown.space` (preventing default scroll for space) open the modal.
- The existing `Add ↗` button keeps its `@click.stop @keydown.stop` so its events do not bubble to the card.
- Card cursor changes to `pointer` to signal clickability.

---

## 4. Layout

### Overlay (backdrop)

- Full-screen fixed overlay, `position: fixed; inset: 0; z-index: 100`.
- Background: `rgba(0, 0, 0, 0.85)`.
- Backdrop click closes the modal (only when the click target IS the backdrop element, not a bubbled event from the panel inside).

### Panel

- Centered via flex centering on the overlay.
- `max-width: 880px; width: min(880px, 92vw)`.
- `max-height: 90vh; overflow-y: auto` so long descriptions on small viewports scroll within the panel rather than the body.
- Background: `var(--color-pitch)`.
- Border: `var(--border-bone)` (3px solid bone-cream).
- Shadow: `var(--shadow-block-pink)` (hard 4px offset pink corner shadow).
- `border-radius: var(--radius-tight)` (2px) — matches site convention.

### Inner grid

- Two-column grid above 640px: image-tape area on the left (1fr), meta column on the right (1fr).
- Single column at ≤640px: image stacks on top of meta.
- Internal padding: `clamp(1.25rem, 3vw, 2rem)`.
- Gap between columns: `clamp(1.5rem, 3vw, 2rem)`.

### Close X button

- Absolutely positioned `top: 0.875rem; right: 0.875rem` inside the panel.
- Bowlby ✕ glyph at `1.5rem`, `--color-bone` on transparent.
- Square `min-width: 44px; min-height: 44px` for touch.
- Hover/active translate (-1/+2px) to match existing CTA pattern.
- `aria-label="Close"`.

### Mobile sheet behavior (≤640px)

- Panel fills width with 8px side margins.
- Image-tape area reduced to ~200px tall to leave room for copy + add-to-cart on a single viewport.

---

## 5. Content

### Image area

- Same `.image-tape` treatment as the card: acid-color rectangle in the product's accent color, with two bone-cream tape pieces at corners (-6deg top-left, +6deg bottom-right).
- Inside: `<img :src="`/stickers/${id}.png`" alt="{title}">` with `object-fit: contain`, max dimensions of the tape area.
- Height: 1:1 aspect ratio when in two-column layout (`aspect-ratio: 1 / 1`), fixed `200px` when single-column.

### Meta column

- **Title:** `<h2 id="modal-title">` in Bowlby One, scale `clamp(1.5rem, 3.5vw, 2.25rem)`, line-height `0.95`.
- **Description:** Inter 500, 1rem, line-height 1.55, color `--fg`. Falls back to `"No description yet — it's a sticker. Slap it on something."` if the product has no `description` field. Description renders as a single `<p>`; markdown is out of scope.
- **Spec line:** Special Elite caps, 0.75rem, color `--color-bone` at 0.7 opacity (`color-mix(in oklab, var(--color-bone) 70%, transparent)`). Shows the existing `product.spec` (currently `3" die-cut vinyl`).
- **Price:** Bowlby One `2rem`, color set to the product's accent (see §6) — same pattern as the card price.
- **Add to cart button:** primary CTA — `--color-acid-pink` bg, `--color-ink` text, `--border-ink` border, `--shadow-block-bone` offset. Emits the same `add-to-cart` event (no separate handler needed). Min-height 44px.

### Vertical order in meta column

1. Title
2. Spec line (small caps under the title)
3. Description (largest content block)
4. Price + Add to cart row (justified `space-between`; price left, button right; stacks vertically on mobile)

---

## 6. Per-product accent color

The existing `Product.ring` hex field is currently unreferenced anywhere in `web/src/`. Repurpose it as the modal's per-product accent — used in three places inside the modal:

- The `image-tape` background color
- The price text color
- The close X hover color

Each product already has a `ring` value in `web/src/data/products.ts`. This makes the modal feel art-directed per sticker without invalidating the rotating-acid system on the grid.

The card itself continues to use the index-based STRIP rotation; it is intentional that the card strip color and the modal accent color may differ.

---

## 7. Motion

**Hard cut.** No fade in/out, no scale-up, no slide. The modal appears in place when state flips to non-null, disappears when state flips back. Matches the no-soft-polish punk-poster vocabulary.

Body scroll lock: when modal opens, set `document.body.style.overflow = 'hidden'`. Restore the original value on close.

No `<Transition>` wrapper. The `prefers-reduced-motion` global rule in `global.css` does not need a special case here because there is no motion to suppress.

---

## 8. Dismiss

Three paths, all required:

1. **Backdrop click** — only fires when `event.target === backdrop element`, not on bubbled events from the panel.
2. **Esc key** — document-level `keydown` listener mounted on modal open, removed on close.
3. **Explicit X button** — top-right of the panel, always visible.

---

## 9. Accessibility

- Card: `role="button" tabindex="0" aria-label="View details for {title}"` so the card is reachable by keyboard and announces purpose.
- Modal panel: `role="dialog" aria-modal="true" aria-labelledby="modal-title"`.
- **Focus management:**
  - On open, store the previously-focused element. Move focus to the close X button.
  - Trap focus inside the modal using a simple Tab cycle between focusable children (close X, Add to cart button). Shift+Tab reverses the cycle.
  - On close, restore focus to the originally-focused card.
- **Esc closes** (per §8).
- **Background scroll locked** while modal is open so screen readers and tab keys do not drift outside the dialog.

---

## 10. Data model change

Add an optional `description` field to `Product`:

```ts
export type Product = {
  id: string;
  title: string;
  spec: string;
  price: number;
  ring: string;
  /** Optional long-form description shown in the detail modal. */
  description?: string;
};
```

Add starter `description` values to 3 products as voice anchors so the modal can be visually verified during implementation. Pick:

- `protect-trans-kids`
- `cops-arent-your-friends`
- `magical-stardust`

The other 8 products fall through to the fallback string. Mia writes their descriptions over time without code changes.

Starter descriptions get drafted during the implementation plan; the spec only requires that the field exists and the fallback is in place.

---

## 11. Architecture + file structure

**New file:**

- `web/src/components/StickerModal.vue` — presentational. Props: `{ product: Product }`. Emits: `{ close: [] }` and `{ add-to-cart: [product: Product] }`. Owns: focus trap, body scroll lock, Esc listener, backdrop click handler.

**Modified files:**

- `web/src/components/StickerCard.vue` — card root becomes a button-like element; add `@click`/`@keydown.enter`/`@keydown.space` handlers that emit a new `view-detail` event; add `role="button" tabindex="0" aria-label`; keep `Add ↗` button's `@click.stop`.
- `web/src/components/ProductGrid.vue` — owns `selectedProduct: Ref<Product | null>`; wires `view-detail` from card to set selectedProduct; renders `<StickerModal v-if="selectedProduct" :product="selectedProduct" @close="selectedProduct = null" @add-to-cart="handleAddToCart" />`.
- `web/src/data/products.ts` — add `description?: string` to the `Product` type; add 3 starter descriptions.

**No new dependencies.** No router. No focus-trap library — implement the focus cycle inline (it's a small loop over two focusable elements).

---

## 12. Acceptance criteria

The feature is "done" when:

1. Clicking any sticker card opens the modal showing that sticker's image, title, description (or fallback), spec, price, and Add to cart button.
2. Tabbing onto a card + pressing Enter or Space opens the modal.
3. Add ↗ on the card still triggers add-to-cart without opening the modal.
4. Modal can be dismissed via X button, Esc key, or backdrop click.
5. Focus moves to the close X on open and returns to the originating card on close.
6. Tab inside the modal cycles between close X and Add to cart (no escape to underlying page).
7. Body scroll is locked while the modal is open.
8. The modal's image-tape, price color, and X hover all use the product's `ring` hex.
9. `npm run build` produces a clean build with no TypeScript errors.
10. The modal layout is single-column on screens ≤640px and two-column above 640px.
11. No `<Transition>`, no fade, no scale — the modal appears and disappears with a hard cut.
12. 3 products (`protect-trans-kids`, `cops-arent-your-friends`, `magical-stardust`) ship with starter descriptions; the rest show the fallback.

---

## 13. Out of scope

- Cart actually doing anything when Add to cart is clicked (handler stays no-op until Pinia store lands)
- Real product photography (image-tape placeholders remain)
- Multiple images per product, image gallery, zoom on image
- Reviews, variants, related products, "you may also like" carousel
- URL deep-linking / `/stickers/:slug` routing (deliberately deferred — migrate later)
- Markdown rendering inside the description (treat description as plain text)
- A11y "skip to content" link or focus restoration to a specific scroll position
- Animation; this is intentionally hard-cut per spec
