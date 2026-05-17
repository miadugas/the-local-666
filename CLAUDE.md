# grave-goods-store

**Grave Goods** — punk leftist sticker store. Solo-operator side project. Modern occult × warm boutique × Satan-positive aesthetic. Die-cut vinyl stickers, bulk-printed by Sticky Brand, shipped from home.

> Project-specific. Global rules live in `~/.claude/CLAUDE.md`. Don't duplicate.

---

## Stack (current)

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Frontend   | Vue 3 + Vite + TypeScript                                          |
| Styling    | Tailwind v4 (`@import "tailwindcss"` + `@tailwindcss/vite` plugin) |
| Tokens     | `@theme` block in `web/src/styles/tokens.css`                      |
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
│   │   ├── App.vue            # mounts <Header /> ... <Footer /> + .grain-overlay
│   │   ├── styles/
│   │   │   ├── global.css     # Tailwind import + body bg gradient + grain overlay
│   │   │   └── tokens.css     # @theme block + semantic vars
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

## Aesthetic — locked decisions

**Direction:** modern goth-occult-warm boutique. Mirrors `github.com/miadugas/graveyard`. NOT punk-riso-zine — no off-register text, no halftones, no tabloid sections, no "Issue No. X · riso" copy.

### Palette — three working families

- **Soot** (`--color-soot-*`) — near-black surfaces. `soot-900: #0a0a0a` (page bg anchor), `soot-1000: #050505` (footer / sunken), `soot-800: #131313` (soft elevated), `soot-700: #1d1b1a` (raised). Plus `--panel: rgba(24, 24, 24, 0.88)` for translucent cards.
- **Cream** (`--color-cream-*`) — warm off-white text. `cream-100: #efe7da` (anchor / body text), `cream-300: #b7ad9d` (muted secondary), `cream-50: #f7efe0` (brightest), `cream-400: #847a6a` (faintest).
- **Ember** (`--color-ember-*`) — molten orange accent. `ember-500: #ff4e2b` (anchor — CTAs, focus, primary accent), `ember-300: #ff8d59` (soft — eyebrows, hover, links), `ember-700: #d93514` (deep — gradient end), `ember-100`/`ember-900` for tints.

Semantic vars: `--bg`, `--bg-soft`, `--bg-raised`, `--bg-sunken`, `--panel`, `--fg`, `--fg-muted`, `--fg-faint`, `--accent`, `--accent-soft`, `--accent-deep`, `--border`, `--border-strong`.

**Removed:** plum, bone, blood, candle, séance pastels, riso ink overlays. All gone — those were from the kit's punk-riso direction.

### Body atmosphere

Body bg is **NOT flat** — it's an atmospheric stack defined in `global.css`:

- Radial-gradient ember glow at 15%/20%
- Radial-gradient deep ember glow at 85%/0%
- Diagonal linear-gradient soot

Plus a fixed `.grain-overlay` (radial dot SVG, soft-light blend, 0.4 opacity) mounted at the top of `App.vue`.

Sections sit on this body gradient. Most sections have **transparent backgrounds**. Only Footer uses a solid bg (`--bg-sunken`).

### Type

- **Cinzel** (`--font-display`) — h1/h2/h3/brand. Roman engraved-stone serif. Monumental + occult.
- **Instrument Sans** (`--font-body`) — body. Refined modern sans.
- **Anton SC** (`--font-poster`) — reserved for poster moments. Mostly unused; available if needed.

Removed: Bodoni Moda, Poppins, Pirata One (blackletter), Permanent Marker, Special Elite (typewriter).

Fonts loaded via `<link>` in `web/index.html`. Self-host from the_litterbox before launch.

### Geometry

- **Radii:** `--radius-md: 14px`, `--radius-lg: 18px` (default panel rounding), `--radius-pill: 9999px` (buttons, chips, icon buttons). NO hard 4px rect.
- **Shadows:** `--shadow-soft: 0 20px 45px rgba(0, 0, 0, 0.45)` (panels), `--shadow-glow-ember: 0 18px 36px rgba(255, 95, 50, 0.25)` (primary CTAs). NO hard offset peel shadows.
- **Borders:** hairline `var(--border)` (`rgba(239,231,218,0.18)`) for panel edges. NO 3-4px chunky borders.

### Buttons

- **Primary CTA:** gradient ember pill — `linear-gradient(145deg, var(--accent), var(--accent-deep))`, cream text, glow shadow, `translateY(-2px)` hover. Pill shape (`border-radius: 9999px`).
- **Secondary CTA:** transparent + hairline border pill, `translateY(-2px)` hover with border + tint shift.
- **Ghost link:** underlined text, ember-soft hover.

### Header

`backdrop-filter: blur(10px)` translucent dark (`rgba(8, 8, 8, 0.78)`) + hairline bottom border. Sticky. Cinzel brand wordmark. No announcement strip.

---

## Other locked decisions

- **Vue 3 SPA**, no SSR/SSG. Add prerendering only if SEO becomes a measured bottleneck.
- **Express**, not Nuxt/Next/Astro server routes. Backend gets its own workspace when it exists.
- **Stripe Checkout (hosted), not Elements.** Lower PCI scope.
- **Sticky Brand for fulfillment. Never Sticker Mule.** SM's CEO is MAGA-aligned — off-brand for a leftist store.
- **Bulk-order + self-ship.** No POD API.
- **Cloudflare Tunnel** for public exposure. Not port forwarding, not Tailscale Funnel, not ngrok.
- **No UI library.** Components hand-built so the goth-boutique aesthetic stays distinctive.
- **No Shopify, no Medusa, no Snipcart.** Stripe Products is the catalog source of truth (when wired).

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
- ❌ Hard offset / peel shadows — soft drop shadows only
- ❌ 4px rect corners on panels — 14/18px or pill
- ❌ Off-register text effects, halftone fills, riso pattern dots — all gone with the kit's aesthetic
- ❌ Bringing back plum / bone / blood / candle tokens — they're removed
- ❌ A UI component library (shadcn-vue, PrimeVue, Element Plus)
- ❌ Suggesting Shopify, Sticker Mule, or POD fulfillment
- ❌ Generic AI placeholder copy ("lorem ipsum", "exciting new product!") — write thematic copy even in stubs
- ❌ Thematic substitutions for utility UI (cart says "Cart", not "Coffin"; checkout says "Checkout", not "Last Rites")
- ❌ "Issue No. X · riso", "Section A/B/C", "two-pass misregister" copy — riso framing is dead

---

## Placeholders / TODOs

**Replace before launch:**

- Product prices in `web/src/data/products.ts` are uniform `$4` placeholders. Real prices come from Stripe Products (phase 5).
- Product specs are uniform `3" die-cut vinyl` placeholders. Real specs come from Sticky Brand orders.
- Google Fonts (Cinzel + Instrument Sans + Anton SC) loaded from CDN via `<link>` in `web/index.html` — self-host from the_litterbox before launch.

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

- **Aesthetic source of truth:** `https://github.com/miadugas/graveyard` — Mia's original design (`styles.css` + `tailwind.config.ts`). Mirror this, not the kit.
- Old kit (visual reference, NOT to be ported): `~/Downloads/mgg-design-system-v2/handoff/storefront-riso/`

---

## Working approach

- Plan before coding (global rule)
- Surgical edits, not rewrites
- No unsolicited summaries after edits
- Match existing patterns before inventing new ones
- Don't preemptively wire backend/Stripe/Cloudinary things before they exist
- When tempted to reach for old kit aesthetics (riso, plum, blood, candle, off-register) → stop and use the boutique tokens instead
