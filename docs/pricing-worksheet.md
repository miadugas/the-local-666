# Grave Goods — Pricing & Profit Projection Worksheet

_Created 2026-05-22. Run this in a **fresh session**, separate from the deploy work._

**Goal:** turn real costs into a retail price per sticker, then enter the prices in the admin (`https://gravegoodsgoodies.com/admin`). The store is live but every price is a placeholder (`$4`, except Deny/Defend/Depose `$3`).

---

## Locked context (don't relitigate)

- **Prices are retail markup, NOT cost passthrough.** Sticky Brand is the **supplier** (where the die-cut vinyl is bulk-printed). The number a customer pays is Mia's retail decision.
- **Sticky Brand only** for fulfillment — never Sticker Mule.
- **Bulk-order + self-ship from home.** No print-on-demand.
- Catalog source of truth = the prod Postgres `products` table. After deciding prices, also re-sync `backend/src/data/seed-products.ts` so the cold-start baseline matches.

---

## ⚠️ The decision that drives everything: shipping

The checkout currently has **no separate shipping line** — the price the customer sees is all they pay. So today, **shipping is effectively free and must be baked into the sticker price.**

Decide first:

- [ ] **Free shipping, baked in** (raise sticker price to cover postage) — simplest UX, common for stickers
- [ ] **Add a flat shipping charge at checkout** (requires a small code change to the Stripe session — not built yet)
- [ ] **Free shipping over $X** threshold (encourages multi-buy; also a code change)

Until a shipping line is built, assume **baked-in**. That single choice can swing the right price by $1–2.

---

## Inputs to gather (Mia fills these in)

| Input                                | Value           | Notes                                                                              |
| ------------------------------------ | --------------- | ---------------------------------------------------------------------------------- |
| Sticky Brand cost — **3" die-cut**   | $\_\_\_\_ /unit | at what order qty? (unit cost drops with volume)                                   |
| Sticky Brand cost — **2.5" die-cut** | $\_\_\_\_ /unit | (only Deny/Defend/Depose today)                                                    |
| Order quantity per design            | \_\_\_\_ units  | drives the unit cost above                                                         |
| **Packaging** per order              | $\_\_\_\_       | rigid mailer / envelope + backing board + any insert                               |
| **Postage** per order                | $\_\_\_\_       | USPS rate for how you actually ship (letter ~$0.73, rigid/flat higher)             |
| **Stripe fee**                       | 2.9% + $0.30    | **per order**, not per item — multi-item orders amortize the $0.30                 |
| Other overhead                       | ~$0/unit        | domain ~$13/yr, Cloudflare free, box owned, Resend free tier — negligible per unit |

---

## Margin model

Per **order** (assuming free/baked-in shipping):

```
net  = revenue − COGS − packaging − postage − stripe_fee
where stripe_fee = 0.029 × revenue + 0.30
margin% = net / revenue
```

> **Note the per-order vs per-item split:** COGS scales per item; **postage, packaging, and the $0.30 Stripe flat fee are per ORDER**. A single-sticker order carries the full shipping+fee load — that's the worst case to price against. Multi-buys get much healthier.

### Illustrative (REPLACE with real numbers)

Single 3" sticker at the current **$4**, free shipping, guesses: COGS $0.80, packaging $0.40, postage $0.73:

```
stripe_fee = 0.029×4 + 0.30 = $0.42
net = 4.00 − 0.80 − 0.40 − 0.73 − 0.42 = $1.65   →  ~41% margin
```

At **$5**: net ≈ $2.62 → ~52%. At **$6**: net ≈ $3.59 → ~60%.
→ This is why $4-with-free-shipping is thin; the real COGS/postage decide it.

---

## Per-product table (fill the blank columns)

12 are 3" ($4 now); Deny/Defend/Depose is 2.5" ($3 now). Decide: **one flat price for all** vs **tiered by size** vs **per-design**.

| #   | Product                                | Size | Now | Unit cost | Target retail | Net/unit | Margin % |
| --- | -------------------------------------- | ---- | --- | --------- | ------------- | -------- | -------- |
| 1   | Protect Trans Kids                     | 3"   | $4  |           |               |          |          |
| 2   | Cops Aren't Your Friends               | 3"   | $4  |           |               |          |          |
| 3   | You Are Not Immune (Junji Ito)         | 3"   | $4  |           |               |          |          |
| 4   | Class Consciousness                    | 3"   | $4  |           |               |          |          |
| 5   | Follow Your Leader                     | 3"   | $4  |           |               |          |          |
| 6   | Devour Feculence (Milchick)            | 3"   | $4  |           |               |          |          |
| 7   | Throbbing Middle Finger to God         | 3"   | $4  |           |               |          |          |
| 8   | Deny. Defend. Depose.                  | 2.5" | $3  |           |               |          |          |
| 9   | Scream F\*ck Die                       | 3"   | $4  |           |               |          |          |
| 10  | Magical Stardust (Satanic Affirmation) | 3"   | $4  |           |               |          |          |
| 11  | I Did That!                            | 3"   | $4  |           |               |          |          |
| 12  | War Criminal                           | 3"   | $4  |           |               |          |          |
| 13  | Luigi                                  | 3"   | $4  |           |               |          |          |

---

## Open decisions

- [ ] Shipping: baked-in vs charged (see top) — **answer this first**
- [ ] Flat price for all vs tiered by size vs per-design
- [ ] Price psychology: round (`$5`) vs charm (`$4.99`) vs `$6`
- [ ] Multi-buy / bundle discount? (e.g. 3 for $X) — encourages bigger orders that amortize shipping
- [ ] Target margin % floor (the line you won't price below)

---

## How to apply the result

1. Admin → `https://gravegoodsgoodies.com/admin` → **Edit** each product → set **price** (+ real **spec** if it changed) → save.
2. Re-sync the seed so a cold start matches prod: update `backend/src/data/seed-products.ts` (`priceCents`), or `pg_dump` the catalog. Commit it.
3. Prices are now launch-ready → back to the deploy roadmap's **Phase 9** (deliverability + flip Stripe live).

_Roadmap: `docs/ROADMAP.md` · Pricing memory: retail markup, not Sticky Brand cost passthrough._
