# the-local-666

**The Local 666** — punk leftist sticker store. Solo-operator side project. Horror-Punk Pop-Art × Satan-positive aesthetic — neon-on-black, Misfits/Vampira tape-strip collage; the brand wordmark is a grunge military stencil ("the LOCAL 666", bone + acid-pink). Die-cut vinyl stickers, bulk-printed by Sticky Brand, shipped from home. **Live at thelocal666.com.**

> Project-specific. Global rules live in `~/.claude/CLAUDE.md`. Don't duplicate.
>
> **Brand split (don't conflate):** the old name **Grave Goods** + `gravegoodsgoodies.com` are reserved for a _separate_ future gothic-coloring-books project. This repo was renamed `grave-goods-store` → `the-local-666`. The `@grave-goods/shared` package and `grave-goods` docker/volume names are kept as internal identifiers — renaming the volume orphans the DB.

---

## Stack (current)

| Layer      | Choice                                                                   |
| ---------- | ------------------------------------------------------------------------ |
| Frontend   | Vue 3 + Vite + TypeScript                                                |
| Styling    | Tailwind v4 (`@import "tailwindcss"` + `@tailwindcss/vite` plugin)       |
| Tokens     | `@theme` block in `web/src/styles/tokens.css`                            |
| Workspaces | npm workspaces — `web/`, `backend/`, `shared/` all active (Pinia in web) |
| Hosting    | the_litterbox (10.0.0.142) → Cloudflare Tunnel → thelocal666.com         |

**Backend + services — all LIVE:**

- Backend: Express 5 + TypeScript (ESM, `tsx` dev, `tsc` build) — `backend/`
- DB: PostgreSQL on the_litterbox — volume `grave-goods_pgdata` (**don't rename** the compose project/volume → orphans the DB)
- Payments: Stripe hosted Checkout (**LIVE mode**) — single custom-amount line item
- Images: Cloudinary signed uploads
- Email: Resend (`orders@thelocal666.com`) + Cloudflare Email Routing (`hello@`)
- Shared: `@grave-goods/shared` (money math / order metadata) — **must emit JS to `dist/`**; backend value-imports it at runtime, so a `.ts`-only export crashes prod
- CI/CD: push `main` → self-hosted runner deploys (rsync + `compose up -d --build`). ⚠️ Env-only `.env` changes don't apply on push (identical image isn't recreated) — run `docker compose --profile tunnel up -d --force-recreate app` on the box.

---

## Layout

```
grave-goods-store/
├── web/                       # Vue 3 SPA (current focus)
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue            # mounts <Header /> ... <Footer />
│   │   ├── styles/
│   │   │   ├── global.css     # Tailwind import + pure-pitch body + heading resets
│   │   │   └── tokens.css     # @theme block + semantic vars
│   │   ├── components/        # hand-built, no UI library
│   │   ├── composables/       # API calls live here (when there are any)
│   │   └── pages/             # HomePage.vue, ProductPage.vue (suffix `Page`)
│   └── public/
│       ├── brand/             # wordmark.png (header), logo.png (favicon), hero
│       └── stickers/          # product photography
├── backend/                   # Express 5 API + Postgres (migrations, Stripe, Resend)
└── shared/                    # @grave-goods/shared — money math + types (emits to dist/)
```

---

## Aesthetic — locked decisions

**Direction:** Horror-Punk Pop-Art. Channels Misfits gig flyers, Vampira/Elvira blacklight horror-host posters, Misfits "3 Hits from Hell" tape-strip collage, Moon-of-Jupiter-style neon-on-black acrylic portraits. NOT goth boutique — the previous "modern goth-occult-warm boutique" direction is dead.

### Palette — three working families

- **Pitch** (`--color-pitch: #000000`) — page background. Pure black, no gradient.
- **Bone** (`--color-bone: #f4ecd8`) — body text, ink-line outlines on dark surfaces. The warm-cream replacement; old `cream-*` tokens are gone.
- **Ink** (`--color-ink: #050505`) — text color on acid-bg surfaces (newsletter pink, taped eyebrows, brand strips on cards).

**Acid accents** — rotating, one per card / section. Multiple acids can coexist in a frame but never blended in one element.

- `--color-acid-pink: #ff2d8a` — primary CTA, manifesto highlight, newsletter section
- `--color-acid-blue: #00d4ff` — nav hover, card brand strip, divider accents
- `--color-acid-lime: #a3e635` — manifesto eyebrow, tenet 03 numeral
- `--color-acid-yellow: #fff200` — hero eyebrow, newsletter submit button text, occasional tape
- `--color-acid-red: #e3151f` — **reserved for warning semantics only** (sold-out, sale, removal). Not decorative.

### Type

- **Permanent Marker** (`--font-brand`) — hand-painted brand wordmark + one signature word per major section (e.g., footer `hail thyself`, manifesto pull-quote).
- **Bowlby One** (`--font-display`) — h1/h2/h3, prices. Chunky uppercase.
- **Special Elite** (`--font-zine`) — eyebrows, micro-CTAs (`Add ↗`), footer caps lines. Typewriter / photocopy register.
- **Inter** (`--font-body`) — body, nav links, card titles in caps. 400/500/700 only.

Removed: Cinzel, Cormorant Garamond, Instrument Sans, Anton SC. Fonts are **self-hosted** (latin woff2 in `web/public/fonts/`, `@font-face` in `web/src/styles/fonts.css`); Inter is the variable font (one file, weights 100–900). No Google Fonts CDN.

### Body atmosphere

Body bg is pure `#000000`. **No** radial gradients, **no** grain overlay (both were boutique vocabulary, wrong for punk poster). Hero gets a localized splatter pattern of acid dots; section separation is via 3px bone-cream horizontal rules.

### Geometry

- **Radii:** `--radius-tight: 2px` for cards / inputs, `--radius-sm: 4px` for occasional moments, `--radius-pill: 9999px` reserved for the nav cart pill. **No 14/18px panel rounding.**
- **Shadows:** hard offset blocky shadows REQUIRED — `--shadow-block-bone`, `--shadow-block-ink`, `--shadow-block-pink`, `--shadow-block-blue`. No blur. Hero h1 uses a layered text-shadow (`4px 4px 0 #ff2d8a, 8px 8px 0 #00d4ff`) — too one-off to token. **One sanctioned exception:** the torn taped eyebrow uses a soft `drop-shadow()` filter so the shadow follows its ragged masked silhouette (see Taped eyebrow under Punk-moment vocabulary).
- **Borders:** heavy ink-line REQUIRED — `--border-bone: 3px solid #f4ecd8`, `--border-ink: 2px solid #050505`. No hairline borders on dark surfaces.
- **Rotations:** small surgical applications — `--rotate-tape: 6deg`, `--rotate-stencil: -2deg`, `--rotate-strip: -1deg`. Used on taped eyebrows, photocopy labels, card brand strips.

### Buttons

- **Primary CTA:** acid-pink bg, ink-black text, 2px ink border, 4px bone-cream offset shadow.
- **Secondary CTA:** bone-cream bg, ink-black text, 2px ink border, 4px acid-blue offset shadow.
- **Cart pill:** acid-pink bg, ink-black text, 2px ink border, 4px bone-cream offset shadow.
- Hover: `translate(-1px, -1px)`. Active: `translate(2px, 2px)`. No glow, no fade.
- All interactive elements get `:focus-visible` with `outline: 3px solid var(--color-acid-blue); outline-offset: 3px;`.

### Header

3px bone-cream bottom border on pure-pitch background. **No** backdrop-blur translucent. Brand: the stencil wordmark image (`/brand/wordmark.png` — bone "the LOCAL" + acid-pink "666"), height-capped, links home. Caps Inter nav links. Pink cart pill.

### Punk-moment vocabulary

Patterns that recur across sections — keep them in their defined slots, never as ambient texture:

- **Taped eyebrow** — torn masking-tape strip. Shared `.tape` class in `global.css`: Special Elite caps, acid fill + wrinkle sheen on `::before`, slight rotation. The ragged edge is a hand-traced torn SVG used as a CSS `mask` (`web/public/torn-tape*.svg`), NOT an ink border — long top/bottom edges near-straight, short left/right ends torn. A soft `drop-shadow()` on the element follows that silhouette (the one sanctioned blur exception). Each eyebrow sets `--tape-color`, `--tape-rotate`, and a distinct `--tape-mask` so no two tears look die-stamped. Section eyebrows only.
- **Brand strip** — acid-color band across top of card, Permanent Marker text in ink-black. Top of every product card; color rotates by index.
- **Image tape** — acid-color rectangle with two bone-cream tape-corner pieces. Card image area until real photos exist.
- **Layered offset shadow** — two overlapping text-shadows in accent colors. Hero h1 only — too loud anywhere else.
- **Highlight word** — acid-color block + ink text + slight rotation. One word per major headline only.
- **Splatter** — multi-stop colored dots. Hero only.

---

## Other locked decisions

- **Vue 3 SPA**, no SSR/SSG. Add prerendering only if SEO becomes a measured bottleneck.
- **Express**, not Nuxt/Next/Astro server routes. Backend gets its own workspace when it exists.
- **Stripe Checkout (hosted), not Elements.** Lower PCI scope.
- **Sticky Brand for fulfillment. Never Sticker Mule.** SM's CEO is MAGA-aligned — off-brand for a leftist store.
- **Bulk-order + self-ship.** No POD API.
- **Cloudflare Tunnel** for public exposure. Not port forwarding, not Tailscale Funnel, not ngrok.
- **No UI library.** Components hand-built so the horror-punk pop-art aesthetic stays distinctive.
- **No Shopify, no Medusa, no Snipcart.** The local Postgres `products` table is the catalog source of truth. Stripe is used only at checkout (Phase 5) via inline `price_data` line_items — there are no Stripe Products.

---

## Conventions

### Tailwind v4 syntax

- `@import "tailwindcss";` — no `@tailwind base/components/utilities`
- `@tailwindcss/vite` plugin only — no PostCSS config
- Tokens defined in `tokens.css` via `@theme { --color-*: ... }` so utilities auto-generate
- **Don't use the `group` utility class** — use data attributes or named hover variants

### Cart UI = plain "Cart"

No thematic substitutions for utility UI ("Add to cart", "Checkout", "Subtotal" — say what they are). Voice/personality lives in headlines, eyebrows, manifesto, product names, error states — wherever it earns its place.

### API calls live in components or composables, never in stores

Stores hold state, composables fetch. (Pinia is wired — `useCartStore`, `useAdminStore`.)

### Pinia (when added) is for cross-page state only

`useCartStore`, `useAdminStore`. Local component state stays in the component.

### No prop drilling

One level is fine. More than one → `provide`/`inject`, slots, or a store.

### Naming

- Pages: `HomePage.vue`, `ProductPage.vue` (suffix `Page`)
- Components: `StickerCard.vue`, `CartDrawer.vue` (no suffix)
- Composables: `useThing.ts` (camelCase, `use` prefix)
- SQL migrations (future): `001_initial.sql` (zero-padded)

---

## Anti-patterns

- ❌ `axios` — use native `fetch`
- ❌ Tailwind v3 syntax (`@tailwind base/components/utilities`)
- ❌ Tailwind `group` utility class
- ❌ **Soft drop shadows** with blur on any UI element — hard offset blocky only (sole exception: the torn taped eyebrow's `drop-shadow()`, which must follow its masked silhouette)
- ❌ **14/18px or pill-rounded** panels — `--radius-tight: 2px` for cards / inputs; pill reserved for the cart only
- ❌ **Hairline borders** on dark cards — `--border-bone` (3px solid) is the rule
- ❌ **Soft radial-gradient body backgrounds** or grain overlays — pure `#000000` only
- ❌ **Engraved roman serif headlines** (Cinzel, Cormorant, Garamond, Trajan) — Bowlby One only for display
- ❌ **Ember-orange anywhere** — old ember/soot/cream tokens are removed
- ❌ **Mixing multiple acid accents inside one element** — one acid per element; multiple can coexist in a frame
- ❌ **Decorative use of acid-red** — reserved for warning semantics (sold-out, sale, removal)
- ❌ Punk-moment patterns (tape, stencil, ransom-note) scattered as ambient texture — keep them in defined slots
- ❌ A UI component library (shadcn-vue, PrimeVue, Element Plus)
- ❌ Suggesting Shopify, Sticker Mule, or POD fulfillment
- ❌ Generic AI placeholder copy ("lorem ipsum", "exciting new product!") — write thematic copy even in stubs
- ❌ Thematic substitutions for utility UI (cart says "Cart", not "Coffin"; checkout says "Checkout", not "Last Rites")

---

## Placeholders / TODOs

**Replace before launch:**

- Pricing: **Single $4 · 3-pack $10 · 5-pack $15** — locked money math in `shared/src/pricing.ts` (tested). Per-product sales via the admin editor (margin floor $2.50 hard / $3.00 warn). Per-product `stock` (nullable: blank = unlimited, a number = limited test run) auto-decrements on sale and auto-flips to Sold Out at 0; settable in admin. Catalog is the Postgres `products` table (seeded from `backend/src/data/seed-products.ts`); frontend fetches it live via `useProducts`.
- Product specs are uniform `3" die-cut vinyl` placeholders. Real specs come from Sticky Brand orders.

---

## Commands

```bash
npm install                       # installs root + workspaces
npm run dev                       # web on :5173
npm run build                     # builds web/dist/
npm run preview                   # serves built web/dist/

# workspace-specific
npm run dev --workspace web
```

---

## Reference

- **Aesthetic source of truth:** the spec at `docs/superpowers/specs/2026-05-20-horror-punk-pop-art-refresh.md` + reference images (Misfits gig flyers, Vampira/Elvira blacklight portraits, Moon-of-Jupiter neon-on-black acrylic, Misfits "3 Hits from Hell" tape-strip collage).
- Dead references (DO NOT mirror): `https://github.com/miadugas/graveyard` (old boutique direction), `~/Downloads/mgg-design-system-v2/handoff/storefront-riso/` (old riso kit).

---

## Working approach

- Plan before coding (global rule)
- Surgical edits, not rewrites
- No unsolicited summaries after edits
- Match existing patterns before inventing new ones
- Don't preemptively wire backend/Stripe/Cloudinary things before they exist
- When tempted to reach for old aesthetics (Cinzel monumental, ember-orange, soft gradients, hairline borders, pill-rounded cards) → stop and use the horror-punk pop-art tokens instead
