# grave-goods-store

**Mission Grave Goods** — punk leftist sticker store. Solo-operator side project. Modern occult × playful × Satan-positive aesthetic. Die-cut vinyl stickers, bulk-printed by Sticky Brand, shipped from home.

> Project-specific. Global rules live in `~/.claude/CLAUDE.md`. Don't duplicate.

---

## Stack (current)

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Frontend   | Vue 3 + Vite + TypeScript                                          |
| Styling    | Tailwind v4 (`@import "tailwindcss"` + `@tailwindcss/vite` plugin) |
| Tokens     | `@theme` block in `web/src/styles/tokens.css` (OKLCH)              |
| Workspaces | npm workspaces; root manages `web/` (backend/shared reserved)      |
| Hosting    | the_litterbox (10.0.0.142) behind Cloudflare Tunnel                |

**Future (not yet wired):**

- Backend: Express 5 + TypeScript (ESM, `tsx` dev, `tsc` build)
- DB: PostgreSQL on the_litterbox
- Payments: Stripe hosted Checkout
- Images: Cloudinary signed uploads
- Email: Resend transactional

---

## Layout

```
grave-goods-store/
├── web/                       # Vue 3 SPA (current focus)
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── styles/
│   │   │   ├── global.css     # @import "tailwindcss" + tokens
│   │   │   └── tokens.css     # @theme block (OKLCH) + semantic tokens
│   │   ├── components/        # hand-built, no UI library
│   │   ├── composables/       # API calls live here (when there are any)
│   │   └── pages/             # HomePage.vue, ProductPage.vue (suffix `Page`)
│   └── public/
│       ├── brand/             # logo, hero illustration
│       └── stickers/          # product photography (until phase 4 / Cloudinary)
├── (backend/ — reserved)
└── (shared/ — reserved)
```

---

## Locked decisions — don't re-litigate

- **Ember purple is the primary brand accent.** `--color-ember-500` does the work for primary CTAs, links, focus rings, nav hover, "new" tags.
  - **Blood (`--color-blood-*`)** is reserved for **three roles**, none of which are interactive UI:
    1. Riso _print effects_ — off-register text shadows, halftone fills (it IS the ink color in the design language)
    2. Tactical/urgency messaging — announcement strip background, activist banners
    3. Danger / sale flags on product cards
  - **Candle (`--color-candle-*`)** is reserved for **highlight / holy moments** AND **typographic labels on dark surfaces** (footer section headers, colophon mark) where ember would muddy. Also: **CTAs on blood-red backgrounds** use candle, not ember — ember + blood = low contrast.
- **Vue 3 SPA**, no SSR/SSG. Add prerendering only if SEO becomes a measured bottleneck.
- **Express**, not Nuxt/Next/Astro server routes. Backend will be its own workspace when it exists.
- **Stripe Checkout (hosted), not Elements.** Lower PCI scope.
- **Sticky Brand for fulfillment. Never Sticker Mule.** SM's CEO is MAGA-aligned — off-brand for a leftist store.
- **Bulk-order + self-ship.** No POD API.
- **Cloudflare Tunnel** for public exposure. Not port forwarding, not Tailscale Funnel, not ngrok.
- **No UI library.** Components hand-built so the punk/occult aesthetic stays distinctive.
- **No Shopify, no Medusa, no Snipcart.** Stripe Products is the catalog source of truth (when wired).

---

## Conventions

### Tailwind v4 syntax

- `@import "tailwindcss";` — no `@tailwind base/components/utilities`
- `@tailwindcss/vite` plugin only — no PostCSS config
- Tokens defined in `tokens.css` via `@theme { --color-* : oklch(…) }` so utilities auto-generate
- **Don't use the `group` utility class** — use data attributes or named hover variants

### Cart UI = plain "Cart"

No thematic substitutions for utility UI ("Add to cart", "Checkout", "Subtotal" — say what they are). Voice/personality lives in headlines, eyebrows, manifesto, product names, error states — wherever it earns its place.

### API calls live in components or composables, never in stores

Stores hold state, composables fetch. (Pinia not added yet — comes with cart state.)

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
- ❌ Blood used for interactive UI (buttons, links, hover, focus — those use ember). Blood = riso ink, tactical messaging, danger/sale.
- ❌ Candle used as a general accent (it's highlight/holy only)
- ❌ A UI component library (shadcn-vue, PrimeVue, Element Plus)
- ❌ Suggesting Shopify, Sticker Mule, or POD fulfillment
- ❌ Generic AI placeholder copy ("lorem ipsum", "exciting new product!") — write thematic copy even in stubs
- ❌ Thematic substitutions for utility UI (cart says "Cart", not "Coffin"; checkout says "Checkout", not "Last Rites")

---

## Placeholders / TODOs

**Replace before launch:**

- Product prices in `web/src/data/products.ts` are uniform `$4` placeholders. Real prices come from Stripe Products (phase 5).
- Product specs are uniform `3" die-cut vinyl` placeholders. Real specs come from Sticky Brand orders.
- Color tokens in `web/src/styles/tokens.css` are hex — OKLCH conversion pending a proper tool pass.
- Google Fonts loaded from CDN via `<link>` in `web/index.html` — self-host from the_litterbox before launch.

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

## Design kit (reference)

- `~/Downloads/mgg-design-system-v2/handoff/storefront-riso/` — hi-fi React prototype + token system + 11 sticker assets + logo + hero illustration
- **Visual reference only.** Code does not get ported as-is (kit is React + vanilla CSS; this project is Vue 3 + Tailwind v4).

---

## Working approach

- Plan before coding (global rule)
- Surgical edits, not rewrites
- No unsolicited summaries after edits
- Match existing patterns before inventing new ones
- Don't preemptively wire backend/Stripe/Cloudinary things before they exist
