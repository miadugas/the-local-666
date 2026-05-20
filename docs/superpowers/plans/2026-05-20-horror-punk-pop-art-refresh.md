# Horror-Punk Pop-Art Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current "goth-occult-warm boutique" storefront skin with a Horror-Punk Pop-Art direction — pure black base, rotating acid neon accents, hand-painted brand, heavy bone-cream ink outlines, hard offset blocky shadows, Misfits "3 Hits from Hell" tape-strip card layout.

**Architecture:** Foundation-first: rewrite `tokens.css`, `global.css`, and the Google Fonts link in one commit so every subsequent component rebuild lands on the new token surface. Then rebuild each of the 7 page sections in dependency order (`StickerCard` before `ProductGrid`, rename `ValuesStrip` → `Tenets` and update `App.vue` together). Delete `SectionRule.vue` once unreferenced. Rewrite the `Aesthetic — locked decisions` and `Anti-patterns` sections of `CLAUDE.md` last so it reflects what shipped.

**Tech Stack:** Vue 3.5 (`<script setup lang="ts">`) + Vite 8 + Tailwind v4 (`@theme` + `@tailwindcss/vite`) + TypeScript 6, single `web/` workspace. No test framework installed — verification is `npm run build` (which runs `vue-tsc -b` then `vite build`) + visual check via `npm run dev`.

**Source spec:** [`docs/superpowers/specs/2026-05-20-horror-punk-pop-art-refresh.md`](../specs/2026-05-20-horror-punk-pop-art-refresh.md)

---

## File map

**Modify:**

- `web/index.html` — swap Google Fonts link.
- `web/src/styles/tokens.css` — full rewrite (drop ember/cream/soot families, add bone + acid + hard-offset shadow + tight radius + rotation tokens).
- `web/src/styles/global.css` — drop body radial gradient + grain overlay; pure pitch background; section divider rule.
- `web/src/App.vue` — remove `.grain-overlay` div; rename `ValuesStrip` import + tag to `Tenets`.
- `web/src/components/Header.vue` — rebuild.
- `web/src/components/Hero.vue` — rebuild.
- `web/src/components/StickerCard.vue` — rebuild around tape-strip layout; props gain `index: number`.
- `web/src/components/ProductGrid.vue` — rebuild; drop `SectionRule` import; pass `:index="i"` to cards.
- `web/src/components/Manifesto.vue` — rebuild; drop `SectionRule` import.
- `web/src/components/Newsletter.vue` — rebuild.
- `web/src/components/Footer.vue` — rebuild.
- `CLAUDE.md` — replace `Aesthetic — locked decisions` + `Anti-patterns` sections.

**Create:**

- `web/src/components/Tenets.vue` — replaces `ValuesStrip.vue` (rename + rebuild).

**Delete:**

- `web/src/components/ValuesStrip.vue` (renamed to `Tenets.vue` — `git mv` semantics, content fully replaced).
- `web/src/components/SectionRule.vue` (now unreferenced).

---

## Conventions for every task

- Each task ends with `npm run build` (type-check + production build) BEFORE the commit step. If the build fails, fix it inside the task — do not commit a broken build.
- During visual checks, use `npm run dev` (already runs on `:5173`). Open the browser, scroll the section that just changed, confirm it matches the spec.
- Conventional commit messages, scoped to the area touched.
- Never use `--no-verify` or `--amend`. Each task = one new commit.

---

## Task 1: Foundation — fonts, tokens, global CSS, App.vue grain removal

**Files:**

- Modify: `web/index.html` (fonts link)
- Modify: `web/src/styles/tokens.css` (full rewrite)
- Modify: `web/src/styles/global.css` (full rewrite)
- Modify: `web/src/App.vue` (remove grain-overlay div only — `ValuesStrip` rename lands in Task 6)

After this task the site will look broken (old components + new tokens). That's expected. Each subsequent task fixes one component.

- [ ] **Step 1.1: Swap Google Fonts in `web/index.html`**

Replace the current `<link>` tag (line ~7-10) with:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Inter:wght@400;500;700&family=Permanent+Marker&family=Special+Elite&display=swap"
  rel="stylesheet"
/>
```

Drops: `Cinzel`, `Instrument+Sans`, `Anton+SC`. Adds: `Bowlby One`, `Inter` (400/500/700), `Permanent Marker`, `Special Elite`. Keep the two `<link rel="preconnect">` tags above it unchanged.

- [ ] **Step 1.2: Full rewrite of `web/src/styles/tokens.css`**

Replace the entire file contents with:

```css
/* =========================================================================
   Grave Goods — design tokens (Tailwind v4 @theme + semantic vars)
   --------------------------------------------------------------------------
   Aesthetic: Horror-Punk Pop-Art. Pure black base, rotating acid neon
   accents (pink/blue/lime/yellow + reserved red), hand-painted brand,
   bone-cream ink-line outlines, hard offset blocky shadows.
   ========================================================================= */

@theme {
  /* COLOR — Base ---------------------------------------------------------- */
  --color-pitch: #000000;
  --color-ink: #050505;
  --color-bone: #f4ecd8;

  /* COLOR — Acid accents (rotating; one per card/section) ----------------- */
  --color-acid-pink: #ff2d8a;
  --color-acid-blue: #00d4ff;
  --color-acid-lime: #a3e635;
  --color-acid-yellow: #fff200;
  --color-acid-red: #e3151f; /* reserved for warning semantics */

  /* TYPE — Families ------------------------------------------------------- */
  --font-brand: "Permanent Marker", "Brush Script MT", cursive;
  --font-display: "Bowlby One", Impact, "Arial Black", sans-serif;
  --font-zine: "Special Elite", "Courier New", monospace;
  --font-body:
    "Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;

  /* TYPE — Scale ---------------------------------------------------------- */
  --text-xs: 0.7rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.375rem;
  --text-2xl: 1.75rem;
  --text-3xl: 2.25rem;
  --text-4xl: 3rem;
  --text-5xl: 4rem;
  --text-6xl: 4.875rem;

  /* TYPE — Leading + tracking -------------------------------------------- */
  --leading-tight: 0.9;
  --leading-snug: 1.15;
  --leading-body: 1.55;

  --tracking-tight: -0.01em;
  --tracking-wide: 0.18em;
  --tracking-shout: 0.22em;

  /* SHAPE / RADIUS ------------------------------------------------------- */
  --radius-tight: 2px;
  --radius-sm: 4px;
  --radius-pill: 9999px;

  /* SHADOW — hard offset blocky. NO blur. -------------------------------- */
  --shadow-block-bone: 4px 4px 0 #f4ecd8;
  --shadow-block-ink: 3px 3px 0 #050505;
  --shadow-block-pink: 4px 4px 0 #ff2d8a;
  --shadow-block-blue: 4px 4px 0 #00d4ff;

  /* BORDER — heavy ink-line. NO hairlines. ------------------------------- */
  --border-bone: 3px solid #f4ecd8;
  --border-ink: 2px solid #050505;

  /* ROTATION — surgical, applied to tape/stencil/strip elements ---------- */
  --rotate-tape: 6deg;
  --rotate-stencil: -2deg;
  --rotate-strip: -1deg;

  /* MOTION --------------------------------------------------------------- */
  --ease-snap: cubic-bezier(0.2, 0.9, 0.2, 1);
  --duration-fast: 120ms;
  --duration-base: 200ms;
}

/* =========================================================================
   Semantic tokens — NOT Tailwind utilities. Use in custom CSS / inline.
   ========================================================================= */
:root {
  --bg: var(--color-pitch);
  --fg: var(--color-bone);

  /* Accent roles */
  --accent: var(--color-acid-pink);
  --accent-secondary: var(--color-acid-blue);
  --accent-tertiary: var(--color-acid-lime);
  --accent-quaternary: var(--color-acid-yellow);
  --accent-warning: var(--color-acid-red);
}
```

- [ ] **Step 1.3: Full rewrite of `web/src/styles/global.css`**

Replace the entire file contents with:

```css
@import "tailwindcss";
@import "./tokens.css";

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
}

body {
  background: var(--color-pitch);
  color: var(--fg);
  font-family: var(--font-body);
  line-height: var(--leading-body);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* Reusable section divider — 3px bone-cream rule between sections */
.section-divider {
  border-top: var(--border-bone);
}

/* Headings + brand share the Bowlby display by default; brand wordmark
   overrides to Permanent Marker inline where it's used. */
h1,
h2,
h3 {
  font-family: var(--font-display);
  letter-spacing: var(--tracking-tight);
  text-transform: uppercase;
  margin: 0;
}
```

Notably gone: the body radial gradient, the `.grain-overlay` block, the Cinzel default on h1/h2/h3.

- [ ] **Step 1.4: Edit `web/src/App.vue` — remove the grain-overlay div**

Replace the file with:

```vue
<script setup lang="ts">
import Header from "./components/Header.vue";
import Hero from "./components/Hero.vue";
import ProductGrid from "./components/ProductGrid.vue";
import ValuesStrip from "./components/ValuesStrip.vue";
import Manifesto from "./components/Manifesto.vue";
import Newsletter from "./components/Newsletter.vue";
import Footer from "./components/Footer.vue";
</script>

<template>
  <Header />
  <Hero />
  <ProductGrid />
  <ValuesStrip />
  <Manifesto />
  <Newsletter />
  <Footer />
</template>
```

Only changes from current: the `<div class="grain-overlay">` line is gone. `ValuesStrip` import + tag stay until Task 6.

- [ ] **Step 1.5: Build**

Run: `npm run build`
Expected: success. `web/dist/` regenerated, no TypeScript errors, no Tailwind warnings.

- [ ] **Step 1.6: Visual smoke check**

Run: `npm run dev`
Expected: site loads at `http://localhost:5173`, page background is pure black, type renders in new fonts (Bowlby for h1/h2/h3, Inter for body). Existing components look broken (cream cards on black, ember CTAs etc.) — expected, ignore.

- [ ] **Step 1.7: Commit**

```bash
git add web/index.html web/src/styles/tokens.css web/src/styles/global.css web/src/App.vue
git commit -m "refactor(tokens): pivot to horror-punk pop-art foundation

Replace boutique tokens (Cinzel/Instrument Sans, ember/cream/soot families,
soft shadows, atmospheric body gradient) with horror-punk pop-art surface:
pure black bg, bone-cream + acid neon accents, hard offset shadows, heavy
ink-line borders, Permanent Marker / Bowlby One / Special Elite / Inter type."
```

---

## Task 2: Header rebuild

**Files:**

- Modify: `web/src/components/Header.vue`

The new header drops the search and account icon buttons (they were not in the spec). Cart pill style changes from outlined ember to acid-pink block with bone offset shadow. Brand wordmark switches to Permanent Marker with the `goods` half in acid-pink.

- [ ] **Step 2.1: Replace `web/src/components/Header.vue`** with:

```vue
<script setup lang="ts">
const NAV = [
  { label: "Shop", href: "#shop" },
  { label: "Manifesto", href: "#manifesto" },
  { label: "About", href: "#" },
];
</script>

<template>
  <header class="site-header">
    <a href="/" class="brand"> grave<span class="brand-accent">goods</span> </a>

    <nav class="site-nav" aria-label="Primary">
      <a v-for="item in NAV" :key="item.label" :href="item.href">
        {{ item.label }}
      </a>
    </nav>

    <button type="button" class="cart-btn" aria-label="Cart">Cart · 0</button>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem clamp(1rem, 4vw, 2.25rem);
  background: var(--color-pitch);
  border-bottom: var(--border-bone);
}

.brand {
  font-family: var(--font-brand);
  font-size: clamp(1.3rem, 2.6vw, 1.625rem);
  letter-spacing: 0.01em;
  color: var(--fg);
  text-decoration: none;
  line-height: 1;
}
.brand-accent {
  color: var(--color-acid-pink);
}

.site-nav {
  display: flex;
  gap: clamp(1rem, 3vw, 1.75rem);
  flex-wrap: wrap;
}

.site-nav a {
  color: var(--fg);
  text-decoration: none;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  transition: color var(--duration-fast) var(--ease-snap);
}

.site-nav a:hover {
  color: var(--color-acid-blue);
}

.cart-btn {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  padding: 0.5rem 0.95rem;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: var(--shadow-block-bone);
  transition: transform var(--duration-fast) var(--ease-snap);
}

.cart-btn:hover {
  transform: translate(-1px, -1px);
}
.cart-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #f4ecd8;
}

@media (max-width: 640px) {
  .site-nav {
    display: none; /* hamburger toggle out of scope for v1 */
  }
}
</style>
```

- [ ] **Step 2.2: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 2.3: Visual check**

Run: `npm run dev` (if not already running)
Verify in browser:

- Brand reads `grave` in bone-cream + `goods` in hot pink, Permanent Marker font.
- Three caps nav links: `SHOP`, `MANIFESTO`, `ABOUT`.
- Pink `Cart · 0` pill on the right with bone-cream 4px offset shadow.
- 3px bone-cream bottom border under the header.

- [ ] **Step 2.4: Commit**

```bash
git add web/src/components/Header.vue
git commit -m "refactor(header): rebuild as horror-punk pop-art (hand-painted brand, pink cart pill)"
```

---

## Task 3: Hero rebuild

**Files:**

- Modify: `web/src/components/Hero.vue`

The new hero drops the right-column hero-card aside entirely. Centered single-column layout, splatter pattern, Bowlby h1 with layered offset text-shadow, two CTAs with hard offset shadows.

- [ ] **Step 3.1: Replace `web/src/components/Hero.vue`** with:

```vue
<script setup lang="ts">
// No script state — purely presentational.
</script>

<template>
  <section class="hero">
    <span class="splatter" aria-hidden="true"></span>

    <span class="eyebrow">Vol. I · A Catalog of Refusals</span>

    <h1 class="headline">
      Stickers for<br />
      the positively<br />
      damned
    </h1>

    <p class="lede">
      Die-cut vinyl from a punk-leftist sticker shop. Slapped on laptops,
      lockers, gas pumps, hearses, and the back of every cop car we can find.
    </p>

    <div class="ctas">
      <a href="#shop" class="cta cta-primary">Shop all</a>
      <a href="#manifesto" class="cta cta-secondary">Read the manifesto</a>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2.25rem)
    clamp(4rem, 9vw, 6rem);
  text-align: center;
  background:
    radial-gradient(
      circle at 20% 80%,
      rgba(255, 45, 138, 0.18),
      transparent 45%
    ),
    radial-gradient(
      circle at 80% 20%,
      rgba(0, 212, 255, 0.14),
      transparent 45%
    ),
    var(--color-pitch);
  border-bottom: var(--border-bone);
}

.splatter {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: var(--color-acid-pink);
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.7;
  box-shadow:
    80px 40px 0 -1px var(--color-acid-blue),
    -120px 80px 0 var(--color-acid-yellow),
    200px -20px 0 -2px var(--color-acid-lime),
    -80px -60px 0 -1px var(--color-acid-pink),
    300px 100px 0 -2px var(--color-acid-blue),
    -200px 30px 0 0 var(--color-acid-yellow),
    120px -100px 0 -1px var(--color-acid-lime),
    -260px -120px 0 -2px var(--color-acid-pink),
    260px 160px 0 -1px var(--color-acid-blue);
}

.eyebrow {
  position: relative;
  display: inline-block;
  font-family: var(--font-zine);
  background: var(--color-acid-yellow);
  color: var(--color-ink);
  padding: 0.25rem 0.85rem;
  font-size: 0.7rem;
  letter-spacing: var(--tracking-shout);
  text-transform: uppercase;
  transform: rotate(var(--rotate-stencil));
  border: var(--border-ink);
  margin-bottom: 1.5rem;
  z-index: 1;
}

.headline {
  position: relative;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 4.875rem);
  line-height: 0.9;
  color: var(--fg);
  text-shadow:
    4px 4px 0 var(--color-acid-pink),
    8px 8px 0 var(--color-acid-blue);
  margin: 0 0 1.5rem;
  z-index: 1;
}

.lede {
  position: relative;
  font-size: 1rem;
  line-height: 1.55;
  max-width: 540px;
  margin: 0 auto 2rem;
  color: var(--fg);
  font-weight: 500;
  z-index: 1;
}

.ctas {
  position: relative;
  display: flex;
  gap: 0.875rem;
  justify-content: center;
  flex-wrap: wrap;
  z-index: 1;
}

.cta {
  font-family: var(--font-body);
  font-size: 0.8rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  font-weight: 700;
  padding: 0.875rem 1.625rem;
  border: var(--border-ink);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: transform var(--duration-fast) var(--ease-snap);
}

.cta-primary {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  box-shadow: var(--shadow-block-bone);
}

.cta-secondary {
  background: var(--color-bone);
  color: var(--color-ink);
  box-shadow: var(--shadow-block-blue);
}

.cta:hover {
  transform: translate(-1px, -1px);
}
.cta:active {
  transform: translate(2px, 2px);
}

@media (max-width: 640px) {
  .headline {
    font-size: 3rem;
    text-shadow:
      3px 3px 0 var(--color-acid-pink),
      6px 6px 0 var(--color-acid-blue);
  }
}
</style>
```

- [ ] **Step 3.2: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3.3: Visual check**

Run: `npm run dev`
Verify in browser:

- Splatter dots scattered around hero center in 4 acid colors.
- Yellow taped eyebrow rotated slightly, ink border.
- Big chunky Bowlby h1 in three lines, with layered pink+blue offset shadow trailing down-right.
- Two CTAs: pink with bone offset, bone with blue offset.

- [ ] **Step 3.4: Commit**

```bash
git add web/src/components/Hero.vue
git commit -m "refactor(hero): rebuild with splatter, taped eyebrow, layered offset headline"
```

---

## Task 4: StickerCard rebuild (Misfits "3 Hits from Hell" tape-strip layout)

**Files:**

- Modify: `web/src/components/StickerCard.vue`

The card prop interface gains an `index` prop so the card can pick its rotating strip color. ProductGrid in Task 5 will pass `:index="i"` from its `v-for`.

- [ ] **Step 4.1: Replace `web/src/components/StickerCard.vue`** with:

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { Product } from "../data/products";

const props = defineProps<{
  product: Product;
  /** 0-indexed position in the grid — used to pick the strip color. */
  index: number;
}>();

const emit = defineEmits<{ "add-to-cart": [product: Product] }>();

const STRIP_COLORS = [
  "var(--color-acid-pink)",
  "var(--color-acid-blue)",
  "var(--color-acid-yellow)",
  "var(--color-acid-lime)",
] as const;

const stripColor = computed(
  () => STRIP_COLORS[props.index % STRIP_COLORS.length],
);

/** Short phrase shown in the brand strip across the top of each card. */
const STRIP_LABELS = ["Protect", "A.C.A.B.", "Wake up", "Class!"] as const;
const stripLabel = computed(
  () => STRIP_LABELS[props.index % STRIP_LABELS.length],
);
</script>

<template>
  <article class="card" :style="{ '--strip': stripColor }">
    <div class="strip">{{ stripLabel }}</div>

    <div class="image-tape">
      <img
        :src="`/stickers/${product.id}.png`"
        :alt="product.title"
        draggable="false"
      />
    </div>

    <div class="meta">
      <h3 class="title">{{ product.title }}</h3>
      <div class="row">
        <span class="price">${{ product.price }}</span>
        <button
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

<style scoped>
.card {
  background: var(--color-pitch);
  border: var(--border-bone);
  border-radius: var(--radius-tight);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.card:hover {
  transform: translate(-1px, -1px);
}

.strip {
  background: var(--strip);
  color: var(--color-ink);
  font-family: var(--font-brand);
  padding: 0.875rem 0.75rem;
  font-size: 1.125rem;
  line-height: 1;
  text-align: center;
  border-bottom: var(--border-bone);
}

.image-tape {
  position: relative;
  background: var(--strip);
  height: 7rem;
  margin: 0.875rem;
  border: var(--border-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}
.image-tape img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 0 transparent); /* override any inherited shadow */
}
.image-tape::before,
.image-tape::after {
  content: "";
  position: absolute;
  background: var(--color-bone);
  height: 0.875rem;
  width: 2.25rem;
  border: 1px solid var(--color-ink);
}
.image-tape::before {
  top: -0.5rem;
  left: 0.625rem;
  transform: rotate(-6deg);
}
.image-tape::after {
  bottom: -0.5rem;
  right: 0.625rem;
  transform: rotate(6deg);
}

.meta {
  padding: 0 0.875rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.title {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8125rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--fg);
  min-height: 2rem;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-family: var(--font-display);
  font-size: 1.375rem;
  color: var(--strip);
  line-height: 1;
}

.add {
  background: transparent;
  color: var(--fg);
  border: none;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
  padding: 0.25rem 0;
}
.add:hover {
  color: var(--strip);
}
</style>
```

- [ ] **Step 4.2: Build**

Run: `npm run build`
Expected: success. Vue/TS will flag the missing `index` prop in `ProductGrid`'s `<StickerCard>` invocation as a type error — that's expected, fixed in Task 5.

If the build fails ONLY on the `index` prop in ProductGrid, proceed. If anything else fails, fix in this task.

- [ ] **Step 4.3: Commit**

```bash
git add web/src/components/StickerCard.vue
git commit -m "refactor(sticker-card): rebuild as Misfits-style tape-strip card with rotating acid strip"
```

---

## Task 5: ProductGrid rebuild

**Files:**

- Modify: `web/src/components/ProductGrid.vue`

Drops the `SectionRule` import — inlines the eyebrow + title with the new taped style. Passes `:index="i"` to `StickerCard`.

- [ ] **Step 5.1: Replace `web/src/components/ProductGrid.vue`** with:

```vue
<script setup lang="ts">
import { PRODUCTS, type Product } from "../data/products";
import StickerCard from "./StickerCard.vue";

function handleAddToCart(_product: Product) {
  // No-op until Pinia cart store lands (later slice).
}
</script>

<template>
  <section id="shop" class="shop">
    <div class="shop-inner">
      <header class="head">
        <div>
          <span class="eyebrow">★ Fresh out of the ground</span>
          <h2 class="title">In the catalog</h2>
        </div>
        <a href="#" class="head-link">all {{ PRODUCTS.length }} →</a>
      </header>

      <div class="grid">
        <StickerCard
          v-for="(product, i) in PRODUCTS"
          :key="product.id"
          :product="product"
          :index="i"
          @add-to-cart="handleAddToCart"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.shop {
  padding: clamp(2.5rem, 6vw, 4rem) 0;
  background: var(--color-pitch);
  border-bottom: var(--border-bone);
}
.shop-inner {
  width: min(1120px, 92vw);
  margin: 0 auto;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2.25rem;
}

.eyebrow {
  display: inline-block;
  background: var(--color-acid-blue);
  color: var(--color-ink);
  padding: 0.3125rem 0.75rem;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-shout);
  text-transform: uppercase;
  transform: rotate(var(--rotate-strip));
  border: var(--border-ink);
}

.title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 2.75rem);
  line-height: 0.9;
  margin: 0.75rem 0 0;
  color: var(--fg);
}

.head-link {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  letter-spacing: var(--tracking-wide);
  color: var(--color-acid-pink);
  text-transform: uppercase;
  text-decoration: none;
}
.head-link:hover {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

- [ ] **Step 5.2: Build**

Run: `npm run build`
Expected: success (the `index` prop is now passed, type error from Task 4 is resolved).

- [ ] **Step 5.3: Visual check**

Run: `npm run dev`
Verify in browser:

- Blue taped eyebrow `★ FRESH OUT OF THE GROUND`, rotated slightly.
- Bowlby title `IN THE CATALOG`.
- Right-aligned pink Special-Elite "all N →" link.
- 4-column grid of cards, each with rotating pink/blue/yellow/lime brand strip across the top, tape-cornered image area, caps title + Bowlby price in matching strip color.

- [ ] **Step 5.4: Commit**

```bash
git add web/src/components/ProductGrid.vue
git commit -m "refactor(product-grid): inline taped header + drop SectionRule + pass index to cards"
```

---

## Task 6: ValuesStrip → Tenets (rename + rebuild + update App.vue import)

**Files:**

- Delete: `web/src/components/ValuesStrip.vue` (use `git mv`-equivalent: delete old, create new in same commit)
- Create: `web/src/components/Tenets.vue`
- Modify: `web/src/App.vue` (update import + tag)

- [ ] **Step 6.1: Create `web/src/components/Tenets.vue`** with:

```vue
<script setup lang="ts">
const TENETS = [
  {
    num: "01",
    text: "Bulk printed.\nHand shipped.",
    color: "var(--color-acid-pink)",
  },
  {
    num: "02",
    text: "Profits stay\nleftist.",
    color: "var(--color-acid-blue)",
  },
  { num: "03", text: "Stickers,\nnot merch.", color: "var(--color-acid-lime)" },
] as const;
</script>

<template>
  <section class="tenets">
    <article
      v-for="tenet in TENETS"
      :key="tenet.num"
      class="tenet"
      :style="{ '--tcolor': tenet.color }"
    >
      <span class="num">{{ tenet.num }}</span>
      <p class="text">{{ tenet.text }}</p>
    </article>
  </section>
</template>

<style scoped>
.tenets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--color-pitch);
  border-bottom: var(--border-bone);
}

.tenet {
  padding: 2.25rem 2rem;
  border-right: var(--border-bone);
  text-align: center;
}
.tenet:last-child {
  border-right: none;
}

.num {
  display: block;
  font-family: var(--font-display);
  font-size: 3rem;
  line-height: 1;
  color: var(--tcolor);
  margin-bottom: 0.5rem;
}

.text {
  font-family: var(--font-zine);
  font-size: 0.8125rem;
  letter-spacing: 0.06em;
  color: var(--fg);
  text-transform: uppercase;
  white-space: pre-line; /* honor \n in the data */
  margin: 0;
}

@media (max-width: 720px) {
  .tenets {
    grid-template-columns: 1fr;
  }
  .tenet {
    border-right: none;
    border-bottom: var(--border-bone);
  }
  .tenet:last-child {
    border-bottom: none;
  }
}
</style>
```

- [ ] **Step 6.2: Update `web/src/App.vue`** to import `Tenets` and replace the tag:

```vue
<script setup lang="ts">
import Header from "./components/Header.vue";
import Hero from "./components/Hero.vue";
import ProductGrid from "./components/ProductGrid.vue";
import Tenets from "./components/Tenets.vue";
import Manifesto from "./components/Manifesto.vue";
import Newsletter from "./components/Newsletter.vue";
import Footer from "./components/Footer.vue";
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

- [ ] **Step 6.3: Delete `web/src/components/ValuesStrip.vue`**

```bash
rm web/src/components/ValuesStrip.vue
```

- [ ] **Step 6.4: Build**

Run: `npm run build`
Expected: success. No lingering `ValuesStrip` import.

- [ ] **Step 6.5: Visual check**

Run: `npm run dev`
Verify in browser:

- Three columns separated by 3px bone-cream borders.
- Big Bowlby numerals in pink/blue/lime.
- Caps Special Elite text below each numeral.
- 3px bone-cream border above + below the row.

- [ ] **Step 6.6: Commit**

```bash
git add web/src/components/Tenets.vue web/src/App.vue
git rm web/src/components/ValuesStrip.vue
git commit -m "refactor(tenets): rename ValuesStrip to Tenets and rebuild as 3-column numbered rail"
```

---

## Task 7: Manifesto rebuild

**Files:**

- Modify: `web/src/components/Manifesto.vue`

Drops `SectionRule` import. Inlines a lime taped eyebrow + Permanent Marker pull-quote with one acid-pink highlighted word.

- [ ] **Step 7.1: Replace `web/src/components/Manifesto.vue`** with:

```vue
<script setup lang="ts">
// Purely presentational.
</script>

<template>
  <section id="manifesto" class="manifesto">
    <span class="eyebrow">The part where we get serious</span>
    <p class="quote">
      We don't sell merch. We sell little plastic
      <em class="hl">refusals</em>
      you can stick on the world until the world feels less like a cage.
    </p>
  </section>
</template>

<style scoped>
.manifesto {
  padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2.25rem);
  background: var(--color-pitch);
  border-bottom: var(--border-bone);
  text-align: center;
}

.eyebrow {
  display: inline-block;
  background: var(--color-acid-lime);
  color: var(--color-ink);
  padding: 0.3125rem 0.875rem;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-shout);
  text-transform: uppercase;
  transform: rotate(var(--rotate-stencil));
  border: var(--border-ink);
  margin-bottom: 1.75rem;
}

.quote {
  font-family: var(--font-brand);
  font-size: clamp(1.75rem, 4.5vw, 2.375rem);
  line-height: 1.15;
  max-width: 720px;
  margin: 0 auto;
  color: var(--fg);
}

.hl {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  font-style: normal;
  padding: 0 0.5rem;
  transform: rotate(-1deg);
  display: inline-block;
}
</style>
```

- [ ] **Step 7.2: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 7.3: Visual check**

Run: `npm run dev`
Verify in browser:

- Lime taped eyebrow rotated, ink border.
- Big Permanent Marker pull-quote centered, max 720px.
- The word `refusals` highlighted with pink block + ink text + slight rotation.

- [ ] **Step 7.4: Commit**

```bash
git add web/src/components/Manifesto.vue
git commit -m "refactor(manifesto): rebuild with lime taped eyebrow + Permanent Marker pull-quote"
```

---

## Task 8: Newsletter rebuild

**Files:**

- Modify: `web/src/components/Newsletter.vue`

Becomes full-bleed acid-pink section with Bowlby h2 in ink-black caps, bone input + black submit button with hard offset shadows.

- [ ] **Step 8.1: Replace `web/src/components/Newsletter.vue`** with:

```vue
<script setup lang="ts">
import { ref } from "vue";

const email = ref("");

function handleSubmit() {
  // TODO (phase 6): wire to Resend via POST /api/subscribe.
}
</script>

<template>
  <section class="newsletter">
    <h2 class="head">Join the wake</h2>
    <p class="lede">
      Restocks, new drops, occasional manifestos. No spam, no algorithm.
    </p>
    <form class="form" @submit.prevent="handleSubmit">
      <input
        v-model="email"
        type="email"
        required
        placeholder="your@email.com"
        aria-label="Email address"
        class="email-input"
      />
      <button type="submit" class="subscribe-btn">Sign me up</button>
    </form>
  </section>
</template>

<style scoped>
.newsletter {
  padding: clamp(3rem, 7vw, 4.5rem) clamp(1rem, 4vw, 2.25rem);
  background: var(--color-acid-pink);
  border-bottom: var(--border-bone);
  text-align: center;
}

.head {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 2.625rem);
  line-height: 0.95;
  color: var(--color-ink);
  margin: 0 0 0.75rem;
}

.lede {
  color: var(--color-ink);
  font-weight: 500;
  font-size: 0.95rem;
  margin: 0 0 1.5rem;
}

.form {
  display: inline-flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  justify-content: center;
}

.email-input {
  background: var(--color-bone);
  border: var(--border-ink);
  padding: 0.8125rem 1.125rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-ink);
  box-shadow: var(--shadow-block-ink);
  width: 17.5rem;
  outline: none;
}
.email-input::placeholder {
  color: rgba(5, 5, 5, 0.55);
}
.email-input:focus {
  background: #fff;
}

.subscribe-btn {
  background: var(--color-ink);
  color: var(--color-acid-yellow);
  border: var(--border-ink);
  padding: 0.8125rem 1.375rem;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8125rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  box-shadow: var(--shadow-block-ink);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.subscribe-btn:hover {
  transform: translate(-1px, -1px);
}
.subscribe-btn:active {
  transform: translate(2px, 2px);
}

@media (max-width: 640px) {
  .form {
    flex-direction: column;
    align-items: stretch;
  }
  .email-input {
    width: auto;
  }
}
</style>
```

- [ ] **Step 8.2: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 8.3: Visual check**

Run: `npm run dev`
Verify in browser:

- Full-bleed acid-pink section.
- Bowlby h2 `JOIN THE WAKE` in ink-black caps.
- Bone input + black `SIGN ME UP` button (yellow text), both with hard ink offset shadows.

- [ ] **Step 8.4: Commit**

```bash
git add web/src/components/Newsletter.vue
git commit -m "refactor(newsletter): rebuild as full-bleed acid-pink with hard-offset form controls"
```

---

## Task 9: Footer rebuild

**Files:**

- Modify: `web/src/components/Footer.vue`

Drops the three link-column groups (`Shop` / `About` / `Help`) per spec §7.8. Becomes a simple three-cell rail: copyright | `hail thyself` | fulfillment line.

**⚠️ Content reduction notice:** The current footer has navigation columns with ~15 links (mostly placeholder `#`). The new spec replaces this with a three-cell rail. If Mia decides during this task that she wants to keep some nav links, expand the markup to add a second row of columns above the rail — but this is not in the locked spec.

- [ ] **Step 9.1: Replace `web/src/components/Footer.vue`** with:

```vue
<script setup lang="ts">
// Purely presentational.
</script>

<template>
  <footer class="site-footer">
    <span class="left">© Grave Goods · Made by hand</span>
    <span class="center">hail thyself</span>
    <span class="right">Bulk-printed by Sticky Brand</span>
  </footer>
</template>

<style scoped>
.site-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 2rem clamp(1rem, 4vw, 2.25rem);
  background: var(--color-pitch);
  flex-wrap: wrap;
}

.left,
.right {
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--fg);
}

.center {
  font-family: var(--font-brand);
  font-size: 1rem;
  color: var(--color-acid-pink);
  text-transform: none;
  letter-spacing: 0.01em;
}

@media (max-width: 720px) {
  .site-footer {
    flex-direction: column;
    text-align: center;
  }
}
</style>
```

- [ ] **Step 9.2: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 9.3: Visual check**

Run: `npm run dev`
Verify in browser:

- Pure black footer at the bottom.
- Three cells: caps zine left + pink `hail thyself` Permanent Marker center + caps zine right.
- No link columns.

- [ ] **Step 9.4: Commit**

```bash
git add web/src/components/Footer.vue
git commit -m "refactor(footer): rebuild as 3-cell rail (drop link columns per spec)"
```

---

## Task 10: Delete SectionRule.vue

**Files:**

- Delete: `web/src/components/SectionRule.vue`

After Task 5 and Task 7 dropped their `SectionRule` imports, this component is unreferenced.

- [ ] **Step 10.1: Verify SectionRule is unreferenced**

Run: `grep -rn "SectionRule" web/src/`
Expected: no matches. If any match, fix that file before continuing.

- [ ] **Step 10.2: Delete the file**

```bash
rm web/src/components/SectionRule.vue
```

- [ ] **Step 10.3: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 10.4: Commit**

```bash
git rm web/src/components/SectionRule.vue
git commit -m "chore: remove unused SectionRule component"
```

---

## Task 11: CLAUDE.md rewrite

**Files:**

- Modify: `CLAUDE.md` (replace `Aesthetic — locked decisions` + `Anti-patterns` sections only — leave all other sections unchanged)

- [ ] **Step 11.1: Open `CLAUDE.md` and locate the section bounds**

Find the heading `## Aesthetic — locked decisions` and read through to the start of `## Other locked decisions`. Replace everything between those two headings (exclusive of the second heading) with the new content below.

- [ ] **Step 11.2: Replace the `Aesthetic — locked decisions` section** with:

```markdown
## Aesthetic — locked decisions

**Direction:** Horror-Punk Pop-Art. Channels Misfits gig flyers, Vampira/Elvira blacklight horror-host posters, Misfits "3 Hits from Hell" tape-strip collage, Moon-of-Jupiter-style neon-on-black acrylic portraits. NOT goth boutique — the previous "modern goth-occult-warm boutique" direction is dead.

### Palette — three working families

- **Pitch** (`--color-pitch: #000000`) — page background. Pure black, no gradient.
- **Bone** (`--color-bone: #f4ecd8`) — body text, ink-line outlines on dark surfaces. The warm-cream replacement; old `cream-*` tokens are gone.
- **Ink** (`--color-ink: #050505`) — text color on acid-bg surfaces (newsletter pink, taped eyebrows, brand strips on cards).

**Acid accents** — rotating, one per card / section. Multiple acids can coexist in a frame but never blended in one element.

- `--color-acid-pink: #ff2d8a` — primary CTA, brand "goods", manifesto highlight, newsletter section
- `--color-acid-blue: #00d4ff` — nav hover, card brand strip, divider accents
- `--color-acid-lime: #a3e635` — manifesto eyebrow, tenet 03 numeral
- `--color-acid-yellow: #fff200` — hero eyebrow, newsletter submit button text, occasional tape
- `--color-acid-red: #e3151f` — **reserved for warning semantics only** (sold-out, sale, removal). Not decorative.

### Type

- **Permanent Marker** (`--font-brand`) — hand-painted brand wordmark + one signature word per major section (e.g., footer `hail thyself`, manifesto pull-quote).
- **Bowlby One** (`--font-display`) — h1/h2/h3, prices. Chunky uppercase.
- **Special Elite** (`--font-zine`) — eyebrows, micro-CTAs (`Add ↗`), footer caps lines. Typewriter / photocopy register.
- **Inter** (`--font-body`) — body, nav links, card titles in caps. 400/500/700 only.

Removed: Cinzel, Cormorant Garamond, Instrument Sans, Anton SC. Fonts loaded via Google Fonts CDN in `web/index.html`. Self-host before launch.

### Body atmosphere

Body bg is pure `#000000`. **No** radial gradients, **no** grain overlay (both were boutique vocabulary, wrong for punk poster). Hero gets a localized splatter pattern of acid dots; section separation is via 3px bone-cream horizontal rules.

### Geometry

- **Radii:** `--radius-tight: 2px` for cards / inputs, `--radius-sm: 4px` for occasional moments, `--radius-pill: 9999px` reserved for the nav cart pill. **No 14/18px panel rounding.**
- **Shadows:** hard offset blocky shadows REQUIRED — `--shadow-block-bone`, `--shadow-block-ink`, `--shadow-block-pink`, `--shadow-block-blue`. No blur. Hero h1 uses a layered text-shadow (`4px 4px 0 #ff2d8a, 8px 8px 0 #00d4ff`) — too one-off to token.
- **Borders:** heavy ink-line REQUIRED — `--border-bone: 3px solid #f4ecd8`, `--border-ink: 2px solid #050505`. No hairline borders on dark surfaces.
- **Rotations:** small surgical applications — `--rotate-tape: 6deg`, `--rotate-stencil: -2deg`, `--rotate-strip: -1deg`. Used on taped eyebrows, photocopy labels, card brand strips.

### Buttons

- **Primary CTA:** acid-pink bg, ink-black text, 2px ink border, 4px bone-cream offset shadow.
- **Secondary CTA:** bone-cream bg, ink-black text, 2px ink border, 4px acid-blue offset shadow.
- **Cart pill:** acid-pink bg, ink-black text, 2px ink border, 4px bone-cream offset shadow.
- Hover: `translate(-1px, -1px)`. Active: `translate(2px, 2px)`. No glow, no fade.

### Header

3px bone-cream bottom border on pure-pitch background. **No** backdrop-blur translucent. Brand: `grave` in bone-cream + `goods` in acid-pink, Permanent Marker. Caps Inter nav links. Pink cart pill.

### Punk-moment vocabulary

Patterns that recur across sections — keep them in their defined slots, never as ambient texture:

- **Taped eyebrow** — acid-color bg, Special Elite caps, 2px ink border, slight rotation. Section eyebrows only.
- **Brand strip** — acid-color band across top of card, Permanent Marker text in ink-black. Top of every product card; color rotates by index.
- **Image tape** — acid-color rectangle with two bone-cream tape-corner pieces. Card image area until real photos exist.
- **Layered offset shadow** — two overlapping text-shadows in accent colors. Hero h1 only — too loud anywhere else.
- **Highlight word** — acid-color block + ink text + slight rotation. One word per major headline only.
- **Splatter** — multi-stop colored dots. Hero only.
```

- [ ] **Step 11.3: Find the `## Anti-patterns` section and replace its bullet list** with:

```markdown
## Anti-patterns

- ❌ `axios` — use native `fetch`
- ❌ Tailwind v3 syntax (`@tailwind base/components/utilities`)
- ❌ Tailwind `group` utility class
- ❌ **Soft drop shadows** with blur on any UI element — hard offset blocky only
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
```

- [ ] **Step 11.4: Build**

Run: `npm run build`
Expected: success (CLAUDE.md isn't part of the build, but run anyway to confirm nothing accidentally broke).

- [ ] **Step 11.5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude-md): rewrite aesthetic + anti-patterns for horror-punk pop-art direction"
```

---

## Task 12: Final verification

**Files:** none modified. Verification only.

- [ ] **Step 12.1: Confirm no stale references**

Run each grep — all should return zero matches:

```bash
grep -rn "ember\|cream-1\|cream-2\|cream-3\|cream-4\|soot-7\|soot-8\|soot-9\|soot-10" web/src/ || echo "clean"
grep -rn "Cinzel\|Instrument Sans\|Anton SC\|Cormorant" web/src/ web/index.html || echo "clean"
grep -rn "ValuesStrip\|SectionRule\|grain-overlay" web/src/ || echo "clean"
grep -rn "var(--panel)\|var(--bg-soft)\|var(--bg-raised)\|var(--bg-sunken)\|var(--border-strong)" web/src/ || echo "clean"
```

If any return a match, open that file and remove or update the stale reference, then commit it separately.

- [ ] **Step 12.2: Production build**

Run: `npm run build`
Expected: success. Check `web/dist/index.html` exists and references the new font URLs.

- [ ] **Step 12.3: Full visual pass**

Run: `npm run dev`. Walk through the site top to bottom and confirm each section matches:

- Header: hand-painted brand, caps nav, pink cart pill.
- Hero: splatter, yellow taped eyebrow, layered offset headline, two CTAs.
- ProductGrid: blue taped eyebrow, Bowlby title, 4-column grid with rotating-color cards.
- Tenets: 3 columns with big acid numerals.
- Manifesto: lime taped eyebrow + Permanent Marker pull-quote with pink-block `refusals`.
- Newsletter: full-bleed pink, ink h2, bone input + black submit.
- Footer: 3-cell rail.

- [ ] **Step 12.4: Mobile smoke check**

In the browser dev tools, switch to ≤640px width. Confirm:

- Header nav links hide (cart pill still visible).
- Hero stays centered, headline scales down.
- Product grid collapses to 1 column.
- Tenets stack vertically with bottom borders instead of right borders.
- Newsletter form stacks vertically.
- Footer cells stack centered.

No horizontal overflow. No clipping.

- [ ] **Step 12.5: Final commit (only if there are changes)**

If Step 12.1 surfaced stale references, they should already be committed individually. Otherwise no commit needed for this task.

---

## Self-review notes

**Spec coverage:**

- §1 Direction → applied in Task 1 (tokens/global) + every component task.
- §2 Type → Task 1 sets families; §7 sections use them in Tasks 2–9.
- §3 Palette → Task 1 sets, Tasks 2–9 apply.
- §4 Geometry → Task 1 sets, all subsequent tasks consume.
- §5 Body atmosphere → Task 1 (global.css).
- §6 Punk-moment vocabulary → Tasks 2 (header), 3 (hero), 4 (card), 5 (grid eyebrow), 7 (manifesto), 8 (newsletter), 9 (footer).
- §7 Section structure → Tasks 2–9.
- §8 Component changes summary → Tasks 1–10.
- §9 Iconography → out of scope this refresh (placeholder slots only).
- §10 CLAUDE.md rewrites → Task 11.
- §11 Out of scope → respected (no Stripe, Cloudinary, new pages).
- §12 Acceptance criteria → checked in Task 12.

**Type consistency:** `StickerCard` props (Task 4) declare `{ product, index }`. ProductGrid (Task 5) passes both. No drift.

**Placeholder scan:** No "TBD", "TODO" (except the existing Pinia / Resend stubs preserved from current code), no "similar to Task N". Every step has the actual code or command.
