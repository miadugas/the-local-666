# Phase 3 — Backend wiring (pricing + bundles) — Codex handoff (rev 3, post-adversarial-round-2)

GOAL: Wire bundle/sale pricing through the backend — products expose an effective (expiry-filtered) sale price, checkout charges the bundle total as ONE Stripe line item, the webhook persists bundle accounting and fails loud on bad/inconsistent data, the admin enforces sale rules server-side, and the confirmation email reconciles to the charged total.

LOCKED INVARIANT (context): regular price = **$5 flat = `PRICES.SINGLE_CENTS` (500)** for every product (brief decision; all 13 seed rows are 500). `calculateCart` prices regular items off the pack constants, NOT per-product `price_cents`. Variable regular pricing is explicitly OUT OF SCOPE — do not build it.

FILES:

- /Users/miadugas/Developer/grave-goods-store/shared/src/types.ts
- /Users/miadugas/Developer/grave-goods-store/shared/src/order-metadata.ts (NEW)
- /Users/miadugas/Developer/grave-goods-store/shared/src/order-metadata.test.ts (NEW)
- /Users/miadugas/Developer/grave-goods-store/shared/src/index.ts
- /Users/miadugas/Developer/grave-goods-store/backend/src/products/queries.ts
- /Users/miadugas/Developer/grave-goods-store/backend/src/products/admin-queries.ts
- /Users/miadugas/Developer/grave-goods-store/backend/src/routes/admin-products.ts
- /Users/miadugas/Developer/grave-goods-store/backend/src/routes/checkout.ts
- /Users/miadugas/Developer/grave-goods-store/backend/src/routes/stripe-webhook.ts
- /Users/miadugas/Developer/grave-goods-store/backend/src/orders/queries.ts
- /Users/miadugas/Developer/grave-goods-store/backend/src/emails/orderConfirmation.ts

APPROACH:

1. `shared/src/types.ts` — `Product` += `salePriceCents: number | null`, `saleLabel: string | null` (effective, expiry-filtered). `AdminProduct` += `salePriceCents: number | null`, `saleLabel: string | null`, `saleEndsAt: string | null` (ISO 8601, raw for editing).

2. **NEW `shared/src/order-metadata.ts`** — symmetric codec used by BOTH checkout (writer) and webhook (reader) so they can't drift:
   - `type MetaCartItem = { slug: string; qty: number; unitPriceCents: number }`
   - `serializeCartItems(items): string` → `"slug:qty:cents,..."`. Slugs are slugified (a-z0-9 + hyphen), so `:`/`,` never collide.
   - `parseCartItems(raw): MetaCartItem[]` → splits/validates each triple; **throws** on malformed/empty/negative; empty string → `[]`.
   - `describeBundle(breakdown): string` → "1× 5-pack + 1× 3-pack + 2 singles", omitting zero counts; `""` when all zero.
   - `STRIPE_METADATA_VALUE_MAX = 500`; `metadataValueFits(v): boolean`.

3. **NEW `shared/src/order-metadata.test.ts`** — Vitest (shared runner): serialize→parse round-trip; parse rejects malformed (`"x"`, `"x:0:500"`, `"x:1:-5"`, trailing junk); `describeBundle` pure-singles / mixed / empty; `metadataValueFits` boundary at 500.

4. `shared/src/index.ts` — add `export * from "./order-metadata.js";`.

5. `backend/src/products/queries.ts` — extend `ProductRow` + `SELECT_COLUMNS`. Compute BOTH effective fields from the **same predicate** (no stale-label leak):
   `CASE WHEN sale_price_cents IS NOT NULL AND (sale_ends_at IS NULL OR sale_ends_at > NOW()) THEN sale_price_cents ELSE NULL END AS effective_sale_price_cents`, identical predicate wrapping `sale_label`. `mapRow` → `salePriceCents`, `saleLabel`. Frontend never sees `sale_ends_at`.

6. `backend/src/products/admin-queries.ts` — `AdminProductRow` + `COLS` += `sale_price_cents`, `sale_label`, `sale_ends_at`. `mapRow` → `salePriceCents`, `saleLabel`, `saleEndsAt` (Date→ISO or null). `CreateProductInput`/`UpdateProductInput` += `salePriceCents?: number | null`, `saleLabel?: string | null`, `saleEndsAt?: string | null`. `createProduct` INSERT + `updateProduct` dynamic `set(col,val)` handle the three columns. **Clear normalization:** when resulting `salePriceCents` is null, force `sale_label` + `sale_ends_at` to null too (final-state based).

7. `backend/src/routes/admin-products.ts` — server-side sale validation (import `validateSalePrice` from `@grave-goods/shared`):
   - **PATCH loads the current product first** and validates FINAL state: `finalSale = input.salePriceCents ?? current.salePriceCents`; `finalPrice = input.priceCents ?? current.priceCents`. If `finalSale !== null`: (a) `validateSalePrice(finalSale)` → 400 on `!ok`; (b) reject `finalSale >= finalPrice` → 400. (This also covers a `priceCents`-only PATCH that would drop the base below an existing sale.)
   - POST: same checks against the provided `priceCents`.
   - `saleLabel`: trim; empty→null; cap 50 chars (else 400).
   - `saleEndsAt`: allow null; else require a parseable ISO timestamp **in the future** (past/invalid → 400).
   - `salePriceCents: null` clears the sale (label + ends nulled per step 6).

8. `backend/src/routes/checkout.ts` — replace per-item `line_items` with ONE custom-amount line:
   - `CartLine[]` from request items: `{ productId: slug, qty, salePriceCents: product.salePriceCents ?? undefined }`. **Server-authoritative** — client sends only `slug`+`quantity`.
   - `cart = calculateCart(lines)`.
   - snapshot `OrderItem[]`: `unitPriceCents = product.salePriceCents ?? PRICES.SINGLE_CENTS` (regular recorded at canonical $5 — matches what bundle math charges, NOT `product.priceCents`).
   - ONE `line_items` entry: `unit_amount: cart.bundleSubtotalCents`, qty 1, `product_data.name = cart.itemCount === 1 ? "Grave Goods sticker" : \`${cart.itemCount} Grave Goods stickers\``.
   - **Description (clean cases — no "0 items"/leading "+"):** regular-only → `describeBundle(breakdown)`; sale-only → `\`${saleItemCount} on sale\``; mixed → `\`${describeBundle(breakdown)} + ${saleItemCount} on sale\``.
   - metadata: `items = serializeCartItems(snapshot-as-MetaCartItem)`, plus `list_subtotal_cents`, `bundle_subtotal_cents`, `savings_cents`, `item_count`, `five_packs`, `three_packs`, `singles`.
   - **Guards before Stripe:** reject `rawItems.length > 50` (cart cap); reject `!metadataValueFits(items)` — both clear 4xx, no Stripe call. Keep empty-cart, sold-out, `isConfigured()` 503.

9. `backend/src/routes/stripe-webhook.ts` — **fail loud + reconcile**:
   - `if (typeof session.amount_total !== "number")` → log + 500 (never `?? 0`).
   - `items = parseCartItems(session.metadata?.items ?? "")` in try/catch; on throw → log raw metadata + 500 (no insert).
   - Parse numeric metadata (`list_subtotal_cents`, `bundle_subtotal_cents`, `item_count`). **Assert** `bundle_subtotal_cents === session.amount_total` AND `Σ items.qty === item_count`; mismatch → log + 500 (no insert).
   - `totalCents = session.amount_total`. Titles via `getProductBySlug` best-effort (fallback slug). `insertPaidOrder({..., listSubtotalCents, bundleSubtotalCents})`. `sendOrderConfirmation` gets `items` + `totalCents` (it self-computes the discount — step 11).

10. `backend/src/orders/queries.ts` — `insertPaidOrder` gains `listSubtotalCents`/`bundleSubtotalCents`; INSERT writes `list_subtotal_cents`, `bundle_subtotal_cents`. Keep `ON CONFLICT (stripe_session_id) DO NOTHING`.

11. `backend/src/emails/orderConfirmation.ts` — reconcile WITHOUT new params: compute `rowsSubtotal = Σ(unitPriceCents × quantity)` and `discountCents = rowsSubtotal − totalCents`. When `discountCents > 0`, render a Subtotal row (`rowsSubtotal`) + "Bundle discount −$X" row above Total (`totalCents`); rows − discount = total, always reconciles. No-discount orders render unchanged.

CONSTRAINTS:

- Do NOT touch `web/` (Phase 4), `seed-products.ts`, the migrations (005 applied), or `shared/src/pricing.ts` (Phase 1, locked & tested — 27 passing).
- Server authoritative on price; client sends only `slug`+`quantity`.
- No new dependencies. Match existing `mapRow` / dynamic `set(col,val)` styles, NodeNext `.js` import extensions, `express.Router` patterns.
- Exactly ONE custom-amount Stripe line.
- `validateSalePrice` is the SINGLE source for the floor — no duplicate `300`/`350` and no duplicate DB CHECK (intentional; single admin write path enforces it).
- `serializeCartItems`/`parseCartItems` are the SINGLE source for metadata encoding — both routes import them.

ACCEPTANCE CRITERIA:

1. `cd backend && npx tsc --noEmit` clean; `cd web && npx vue-tsc --noEmit -p tsconfig.app.json` clean; `npm run test --workspace shared` passes (27 pricing + new order-metadata tests).
2. `/api/products` returns `salePriceCents` AND `saleLabel` both null when no/expired sale; both populated when active.
3. `POST`/`PATCH /api/admin/products`: `salePriceCents 299` → 400; `350` → success; `finalSale >= finalPrice` (incl. `priceCents`-only PATCH) → 400; `saleEndsAt` past/invalid → 400; `salePriceCents: null` → all three sale columns nulled.
4. `checkout.ts` sends exactly ONE `line_item` with `unit_amount === calculateCart(...).bundleSubtotalCents`; `metadata.items === serializeCartItems(...)`; cart > 50 or metadata > 500 chars → 4xx (no Stripe call); description has no "0 items"/leading "+".
5. webhook: `amount_total` not a number → 500; malformed metadata → 500; `bundle_subtotal_cents !== amount_total` or qty-sum mismatch → 500 (no insert in any case); valid → `OrderItem[]` reconstructed, subtotals persisted, email reconciles (rows − discount = total).

VERIFICATION:

- `cd /Users/miadugas/Developer/grave-goods-store/backend && npx tsc --noEmit`
- `cd /Users/miadugas/Developer/grave-goods-store/web && npx vue-tsc --noEmit -p tsconfig.app.json`
- `npm run test --workspace shared`

(Stripe test-mode "4 items = \$18.00" + a malformed-metadata webhook drill are manual integration checks for Phase 6.)
