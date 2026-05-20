# Horror-Punk Pop-Art Refresh — Design Spec

**Date:** 2026-05-20
**Status:** Approved direction, pending implementation plan
**Scope:** Full visual overhaul of the Grave Goods storefront

---

## 1. Direction

**Horror-Punk Pop-Art.** Black base, rotating acid neon accents per section/card, hand-painted brand wordmark, heavy bone-cream ink outlines, hard offset blocky shadows, Misfits "3 Hits from Hell" tape-strip card layout.

Aesthetic references (provided by user):

- Misfits Crimson Ghost gig flyers (late-70s / early-80s).
- Vampira and Elvira blacklight horror-host posters (Moon-of-Jupiter-style hand-painted portraits).
- Siouxsie Sioux red-on-black stark contrast portraiture.
- Misfits "3 Hits from Hell" album cover — tape-strip eye-cutout collage.
- David-Bowie-on-black neon acrylic portrait.
- Hashtag tags: `#poppunk`, `#popart`, `#punkrock`, `#horrorpunk`, `#misfits`, `#rancid`, `#theclash`.

**This replaces the previous "modern goth-occult-warm boutique" direction in CLAUDE.md.** The previous Death Rock + boutique italic-serif direction is fully abandoned.

---

## 2. Type system

| Role                                                 | Font                 | Notes                                                                                                                                                |
| ---------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand wordmark                                       | **Permanent Marker** | Hand-painted, replaces Cinzel for the brand. Used for "grave goods" wordmark and one signature word per major section (e.g., footer "hail thyself"). |
| Display impact (h1, h2, prices)                      | **Bowlby One**       | Chunky uppercase. Hero headline, section titles, card prices, newsletter h2.                                                                         |
| Zine / photocopy (eyebrows, micro-CTAs, footer caps) | **Special Elite**    | Typewriter. Used for `VOL. I · A CATALOG OF REFUSALS`, "Add ↗", footer rights line, etc.                                                             |
| Body                                                 | **Inter**            | Workman sans. Body copy, nav links, card titles in caps.                                                                                             |

Fonts loaded via Google Fonts CDN until launch — same `<link>` mechanism as today. Self-hosting before launch stays a separate TODO.

**Drops:** Cinzel, Cormorant Garamond, Instrument Sans, Anton SC.

---

## 3. Color palette

```css
@theme {
  /* Base */
  --color-ink: #050505; /* used on acid-bg sections for text */
  --color-pitch: #000000; /* page background */
  --color-bone: #f4ecd8; /* body text, ink-line outlines */

  /* Acid accents — rotating, one per card / section */
  --color-acid-pink: #ff2d8a;
  --color-acid-blue: #00d4ff;
  --color-acid-lime: #a3e635;
  --color-acid-yellow: #fff200;
  --color-acid-red: #e3151f;
}

:root {
  --bg: var(--color-pitch);
  --fg: var(--color-bone);

  /* Accent role assignments */
  --accent: var(
    --color-acid-pink
  ); /* primary CTA, brand "goods", news section */
  --accent-secondary: var(--color-acid-blue);
  --accent-tertiary: var(--color-acid-lime);
  --accent-quaternary: var(--color-acid-yellow);
  --accent-warning: var(--color-acid-red);
}
```

**Color rules:**

- Every card / section has ONE accent.
- Multiple acids can coexist in the same frame, but never blended within a single element.
- Acid-red `#e3151f` is reserved for "warning" semantics (sold-out, sale, removal confirms) — not decorative.
- Bone-cream `#f4ecd8` is the only text color on dark surfaces; ink-black `#050505` is the only text color on acid surfaces.

**Drops:** entire ember family (`ember-100/300/500/700/900`), entire soot family beyond pure pitch (`soot-700/800/1000`), all cream-100/200/300/400 variants (replaced by single `--color-bone`).

---

## 4. Geometry

Major reversal from current tokens.

| Property  | Old                                      | New                                                                                                                                                                                                                                                                                                        |
| --------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radii     | `--radius-md: 14px`, `--radius-lg: 18px` | `--radius-tight: 2px` (cards, inputs); pill (`9999px`) reserved for nav cart pill only                                                                                                                                                                                                                     |
| Shadows   | Soft drop `0 20px 45px rgba(0,0,0,0.45)` | **Hard offset blocky** — `--shadow-block-bone: 4px 4px 0 #f4ecd8`, `--shadow-block-ink: 3px 3px 0 #050505`, `--shadow-block-pink: 4px 4px 0 #ff2d8a`, `--shadow-block-blue: 4px 4px 0 #00d4ff`. Hero h1 uses a layered text-shadow (`4px 4px 0 #ff2d8a, 8px 8px 0 #00d4ff`) inline — too one-off to token. |
| Borders   | Hairline `rgba(239,231,218,0.18)`        | **Heavy ink-line** — `--border-bone: 3px solid #f4ecd8`, `--border-ink: 2px solid #050505`                                                                                                                                                                                                                 |
| Rotations | None                                     | New tokens: `--rotate-tape: 6deg`, `--rotate-stencil: -2deg`, `--rotate-strip: -1deg`. Used surgically on stencil bars, tape labels, brand strips.                                                                                                                                                         |

**This reverses two anti-patterns from the current CLAUDE.md** ("no hard offset shadows", "no 4px rect corners"). Both become required under this direction. CLAUDE.md is rewritten accordingly (see §10).

---

## 5. Body atmosphere

- **Page background:** pure `#000000`. No radial gradients, no atmospheric stops.
- **Grain overlay:** removed. Grain was cinematic atmosphere; punk poster vocabulary is flat solid-color print.
- **Hero splatter:** subtle paint splatter pattern positioned dots in accent colors. Implemented as a single absolutely-positioned element with `box-shadow` multi-stops simulating splatter.
- **Section separation:** 3px solid bone-cream horizontal rules between sections.

---

## 6. Punk-moment vocabulary

Patterns that recur across sections. Defining them once so they stay consistent:

| Moment                    | Visual                                                                                                                 | Where it appears                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Taped eyebrow**         | Acid-color background, `Special Elite` caps, 2px ink border, rotated `-1deg` to `-2deg`                                | Section eyebrows (`VOL. I · A CATALOG OF REFUSALS`, `★ FRESH OUT OF THE GROUND`, `THE PART WHERE WE GET SERIOUS`) |
| **Brand strip**           | Acid-color band across top of card, `Permanent Marker` text in ink-black                                               | Top of every product card (color rotates)                                                                         |
| **Image tape**            | Acid-color rectangle with two cream tape-corner pieces (one top-left rotated `-6deg`, one bottom-right rotated `6deg`) | Card image placeholder area until real photos exist                                                               |
| **Layered offset shadow** | Two overlapping text-shadows in accent colors (`4px 4px 0 #ff2d8a, 8px 8px 0 #00d4ff`)                                 | Hero h1 only — too loud anywhere else                                                                             |
| **Hard-offset shadow**    | Single solid block shadow, no blur (`4px 4px 0 #f4ecd8`)                                                               | All CTAs, newsletter input + button, cart pill                                                                    |
| **Highlight word**        | Acid-color background block, ink-black text, rotated `-1deg`, no border                                                | One word per major headline (`refusals`, `damned`)                                                                |
| **Splatter**              | Multi-stop colored dots, low opacity                                                                                   | Hero only                                                                                                         |

**Anti-pattern:** these moments scattered everywhere — they lose meaning. Use them in the defined slots above.

---

## 7. Section structure

Same 7 sections from the current site, all rebuilt visually. No new pages.

**Mobile breakpoints (≤640px):**

- Header: nav links collapse to a hamburger toggle (out of scope here — placeholder icon button OK for v1).
- Hero h1 scales to 48px; lede + CTAs stack center.
- Product grid collapses 4-col → 2-col at `md`, 2-col → 1-col at `sm`.
- Tenets rail: right-borders become 3px bottom-borders; layout stacks vertically.
- Newsletter form stacks input + submit vertically; offset shadows stay.
- Footer: three columns become a centered vertical stack.

### 7.1 Header (`Header.vue`)

- Pure black bg, 3px solid bone-cream bottom border.
- Brand wordmark: `grave` in bone-cream + `goods` in acid-pink, `Permanent Marker` 26px.
- Nav links: caps `Inter 700`, 12px, 0.18em tracking. Hover → acid-blue.
- Cart pill: acid-pink background, ink-black text, 2px ink border, 3px bone-cream offset shadow.
- Sticky.

### 7.2 Hero (`Hero.vue`)

- Splatter pattern (acid dots) absolutely positioned center.
- Taped eyebrow (acid-yellow): `VOL. I · A CATALOG OF REFUSALS`.
- h1: `Bowlby One` 78px caps, 3-line `Stickers for / the positively / damned`, layered offset shadow (pink + blue), `_` no italics.
- Lede: `Inter 500` 16px, bone-cream, max-width 540px.
- Two CTAs: primary (acid-pink bg, ink text, bone offset), secondary (bone-cream bg, ink text, blue offset).

### 7.3 Featured arrivals (`ProductGrid.vue`)

- Header row: taped eyebrow (acid-blue) `★ FRESH OUT OF THE GROUND`, Bowlby title `In the catalog`, right-aligned grid link `all 17 →` in Special Elite acid-pink.
- 4-column grid (1-col mobile, 2-col tablet, 4-col desktop), 14px gap.

### 7.4 Sticker card (`StickerCard.vue`)

- Outer: pure black bg, 3px solid bone-cream border.
- Brand strip (top): acid-color background (rotated through pink/blue/yellow/lime by card index), `Permanent Marker` 18px ink-black centered, 3px bone-cream bottom border.
- Image area: acid-color rectangle (same as brand strip), with two bone-cream tape pieces at corners (-6deg top-left, +6deg bottom-right), `Bowlby One` 32px placeholder text in ink-black centered. Replace with real product photo when Cloudinary lands.
- Meta: caps `Inter 700` 13px title (min-height 32px for 2-line consistency), $-prefixed price in `Bowlby One` 22px accent-colored, "Add ↗" in Special Elite caps bone-cream.

### 7.5 Tenets rail (`Tenets.vue` — renamed from `ValuesStrip.vue`)

- Three-column grid, no horizontal gap, 3px bone-cream right-borders between (none on last).
- Each tenet: `Bowlby One` 48px numeral (`01`/`02`/`03`) in rotating acids (pink/blue/lime), Special Elite 13px caps body below.
- Placeholder content: `Bulk printed. Hand shipped.` / `Profits stay leftist.` / `Stickers, not merch.` — Mia to rewrite.

### 7.6 Manifesto (`Manifesto.vue`)

- Black bg, taped eyebrow (acid-lime, rotated `-2deg`): `THE PART WHERE WE GET SERIOUS`.
- Pull-quote: `Permanent Marker` 38px, max-width 720px, centered, bone-cream.
- One highlighted word: acid-pink block with ink text, rotated `-1deg` inline.
- Placeholder copy: `We don't sell merch. We sell little plastic refusals you can stick on the world until the world feels less like a cage.` — Mia to confirm or rewrite.

### 7.7 Newsletter — "Join the wake" (`Newsletter.vue`)

- Full-bleed acid-pink background section.
- h2: `Bowlby One` 42px ink-black caps `JOIN THE WAKE`.
- Subhead: `Inter 500` ink-black `Restocks, new drops, occasional manifestos. No spam, no algorithm.`
- Form: bone-cream input (2px ink border, 4px ink offset shadow), ink-black submit button (acid-yellow text, 2px ink border, 4px ink offset shadow).

### 7.8 Footer (`Footer.vue`)

- Pure black bg, no border-top.
- Three-column flex: copyright in Special Elite caps bone-cream | `hail thyself` in `Permanent Marker` 16px acid-pink center | fulfillment line in Special Elite caps bone-cream.

### Deletions

- `SectionRule.vue` — delete entirely. Section separation handled by inline 3px borders between sections.

---

## 8. Component changes summary

| File                                 | Action                                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `web/src/styles/tokens.css`          | Full rewrite — drop ember + cream families; add bone, acid family, rotation tokens, hard-offset shadow tokens, tight radius. |
| `web/src/styles/global.css`          | Drop body radial-gradient and grain overlay; pure black bg; section divider rule.                                            |
| `web/index.html`                     | Swap Google Fonts links: drop Cinzel/Instrument Sans/Anton SC; add Permanent Marker / Bowlby One / Special Elite / Inter.    |
| `web/src/components/Header.vue`      | Rebuild                                                                                                                      |
| `web/src/components/Hero.vue`        | Rebuild                                                                                                                      |
| `web/src/components/ProductGrid.vue` | Rebuild                                                                                                                      |
| `web/src/components/StickerCard.vue` | Rebuild around tape-strip layout                                                                                             |
| `web/src/components/Manifesto.vue`   | Rebuild                                                                                                                      |
| `web/src/components/ValuesStrip.vue` | Rename to `Tenets.vue`, rebuild                                                                                              |
| `web/src/components/Newsletter.vue`  | Rebuild                                                                                                                      |
| `web/src/components/Footer.vue`      | Rebuild                                                                                                                      |
| `web/src/components/SectionRule.vue` | Delete                                                                                                                       |
| `web/src/App.vue`                    | Update import (`ValuesStrip` → `Tenets`); remove `.grain-overlay`.                                                           |
| `CLAUDE.md`                          | Rewrite "Aesthetic — locked decisions", "Anti-patterns" sections (see §10).                                                  |

---

## 9. Iconography (future)

Slots defined now; illustrations land later.

- **Brand mark:** optional small hand-illustrated Crimson-Ghost-style skull next to the wordmark. Not in this refresh.
- **Card image area:** acid-color tape rectangle now; replaced by product photo when Cloudinary phase lands.
- **Hero splatter:** dot pattern now; could swap for a hand-illustrated skull / coffin / dagger later.
- **Section dividers:** plain 3px borders now; could host hand-illustrated Crimson Ghost icons later.

---

## 10. CLAUDE.md rewrites

Sections in `/CLAUDE.md` that change:

**`Aesthetic — locked decisions`** — replace entirely:

- Direction: `Horror-Punk Pop-Art. Channels Misfits gig flyers, Vampira/Elvira blacklight horror-host posters, Misfits "3 Hits from Hell" tape-strip collage, Moon-of-Jupiter-style neon-on-black acrylic portraits.`
- Palette table updated with `--color-pitch / --color-bone / --color-ink / --color-acid-*` (drop ember + cream + soot tables).
- Type table updated with Permanent Marker / Bowlby One / Special Elite / Inter (drop Cinzel / Instrument Sans / Anton SC).
- Geometry section updated — radii tight (2–4px) + pill for cart only; hard-offset blocky shadows REQUIRED; 2–3px solid outlines REQUIRED; rotation tokens listed.
- Buttons: primary = acid-pink bg with bone-cream offset shadow; secondary = bone-cream bg with acid-blue offset shadow.
- Header: 3px bone bottom border + hand-painted brand. No backdrop-blur translucent.

**`Anti-patterns`** — replace entirely:

- ❌ Soft radial-gradient body backgrounds — pure pitch only.
- ❌ Cinzel, Cormorant, Garamond, engraved serif headlines.
- ❌ Pill-rounded cards or 14/18px panel corners.
- ❌ Hairline borders on dark cards.
- ❌ Ember-orange anywhere. Old ember/soot/cream tokens are gone.
- ❌ Soft drop shadows (`0 Ypx Xpx rgba(...)` blur) on any UI element — hard offset only.
- ❌ Mixing multiple acid accents inside one element — one acid per element.
- ❌ Decorative use of acid-red. Reserved for warning semantics.

**Keep unchanged:** all infrastructure (Stripe Checkout, Sticky Brand, Cloudflare Tunnel, Tailwind v4, Vue 3 SPA, no UI library, no Sticker Mule, Tailwind syntax rules, naming conventions, cart UI = plain "Cart").

---

## 11. Out of scope

- ❌ Stripe Products / Checkout wiring (phase 5).
- ❌ Cloudinary signed uploads, real product photography.
- ❌ Backend / Express workspace.
- ❌ New pages (`/about`, `/manifesto`) — manifesto stays inline on home.
- ❌ Hand-illustrated brand mark (Crimson Ghost / skulls) — placeholder slots only.
- ❌ Self-hosting fonts on the_litterbox — Google Fonts CDN until launch.
- ❌ Replacing placeholder product photos — image-tape placeholders remain.

---

## 12. Acceptance criteria

The refresh is "done" when:

1. `npm run dev` boots without console errors; visiting `/` renders the new homepage.
2. All 7 sections (Header, Hero, ProductGrid, Tenets, Manifesto, Newsletter, Footer) match the §7 specs.
3. `tokens.css` contains only the new token families; no ember/soot/cream/cinzel references remain anywhere in `web/src/`.
4. CLAUDE.md `Aesthetic — locked decisions` + `Anti-patterns` sections match §10.
5. `npm run build` produces a clean `web/dist/` with no warnings about unused tokens or missing fonts.
6. The mocked product catalog from `web/src/data/products.ts` renders in the new card layout, with brand strips rotating through pink → blue → yellow → lime → repeat by `index % 4`.
7. No `SectionRule.vue` references remain.
8. Visual check on mobile (≤640px) — single-column grid, sections stack cleanly, type scales legibly. No horizontal overflow.
