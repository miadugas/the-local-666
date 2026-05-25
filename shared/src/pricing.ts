// shared/src/pricing.ts
//
// Single source of truth for cart/bundle pricing. Both the Vue cart store and
// the Express checkout import from here — never recompute totals separately.

export const PRICES = {
  SINGLE_CENTS: 400,
  THREE_PACK_CENTS: 1000,
  FIVE_PACK_CENTS: 1500,
} as const;

// Sale price thresholds — derived from real cost structure (verified 2026-05-24).
// Fixed cost per single-item order: COGS $0.30 + packaging $0.40 + postage $0.73
// (flexible first-class letter) + Stripe flat $0.30 = $1.73. Stripe also takes 2.9%
// of revenue. Break-even at sale price P: 0.971 * P = 1.73 → P ≈ $1.78.
export const SALE_HARD_FLOOR_CENTS = 250; // Below this = thin (<~28% margin). Hard block.
export const SALE_SOFT_WARN_CENTS = 300; // Below this = warn admin (margin dips under ~39%).

export type CartLine = {
  productId: string;
  qty: number;
  salePriceCents?: number; // if set, this product is on sale — excluded from bundle math
};

export type CartTotal = {
  itemCount: number;
  regularItemCount: number; // count of items eligible for bundle math
  saleItemCount: number; // count of items on sale (NOT eligible for bundle)
  listSubtotalCents: number; // what it would cost at full regular price (no sales, no bundles)
  bundleSubtotalCents: number; // final total — sale prices + bundled regular items
  savingsCents: number; // listSubtotalCents - bundleSubtotalCents
  breakdown: {
    fivePacks: number;
    threePacks: number;
    singles: number;
    saleSubtotalCents: number; // total spent on sale items (no bundle applied)
  };
};

export function calculateCart(lines: CartLine[]): CartTotal {
  // Split sale items from regular items
  const saleLines = lines.filter((l) => l.salePriceCents !== undefined);
  const regularLines = lines.filter((l) => l.salePriceCents === undefined);

  const saleItemCount = saleLines.reduce((sum, l) => sum + l.qty, 0);
  const regularItemCount = regularLines.reduce((sum, l) => sum + l.qty, 0);
  const itemCount = saleItemCount + regularItemCount;

  // Sale items: priced individually at sale price, NO bundle math
  const saleSubtotalCents = saleLines.reduce(
    (sum, l) => sum + l.salePriceCents! * l.qty,
    0,
  );

  // Regular items: greedy bundle math (5-packs first, then 3-packs, then singles)
  let remaining = regularItemCount;
  const fivePacks = Math.floor(remaining / 5);
  remaining -= fivePacks * 5;
  const threePacks = Math.floor(remaining / 3);
  remaining -= threePacks * 3;
  const singles = remaining;

  const regularBundleSubtotalCents =
    fivePacks * PRICES.FIVE_PACK_CENTS +
    threePacks * PRICES.THREE_PACK_CENTS +
    singles * PRICES.SINGLE_CENTS;

  const bundleSubtotalCents = saleSubtotalCents + regularBundleSubtotalCents;

  // listSubtotalCents = what they would have paid at full regular price with no sales and no bundles
  const listSubtotalCents = itemCount * PRICES.SINGLE_CENTS;

  return {
    itemCount,
    regularItemCount,
    saleItemCount,
    listSubtotalCents,
    bundleSubtotalCents,
    savingsCents: listSubtotalCents - bundleSubtotalCents,
    breakdown: { fivePacks, threePacks, singles, saleSubtotalCents },
  };
}

export function getBundleNudge(regularItemCount: number): string | null {
  // Nudge only counts regular-price items — sale items never trigger or block the nudge
  if (regularItemCount === 1)
    return "Add 2 more regular-price stickers to unlock the 3-pack — save $2";
  if (regularItemCount === 2)
    return "Add 1 more regular-price sticker to unlock the 3-pack — save $2";
  if (regularItemCount === 3)
    return "Add 2 more to upgrade to the 5-pack — save $5";
  if (regularItemCount === 4)
    return "Add 1 more to upgrade to the 5-pack — save $5";
  if (regularItemCount >= 5 && regularItemCount <= 7)
    return "Keep adding — every 3 more saves $2, every 5 saves $5";
  return null;
}

// Sale price validation — call from admin save handler AND server-side enforcement
export type SalePriceValidation =
  | { ok: true; level: "safe" | "warn"; netCents: number; marginPct: number }
  | { ok: false; reason: string };

export function validateSalePrice(salePriceCents: number): SalePriceValidation {
  if (!Number.isInteger(salePriceCents) || salePriceCents <= 0) {
    return {
      ok: false,
      reason: "Sale price must be a positive integer (cents).",
    };
  }
  if (salePriceCents >= PRICES.SINGLE_CENTS) {
    return {
      ok: false,
      reason: `Sale price must be below regular price ($${PRICES.SINGLE_CENTS / 100}).`,
    };
  }
  if (salePriceCents < SALE_HARD_FLOOR_CENTS) {
    return {
      ok: false,
      reason: `Sale price cannot be below $${(SALE_HARD_FLOOR_CENTS / 100).toFixed(2)} — you'd lose money after fees.`,
    };
  }

  // Compute margin at this sale price
  // net = price - COGS - packaging - postage - stripe_fee
  // stripe_fee = 0.029 * price + 30 (cents)
  // fixed costs per single-item order = 30 (COGS) + 40 (packaging) + 73 (postage) + 30 (Stripe flat) = 173 cents
  const FIXED_COSTS_CENTS = 173;
  const netCents = Math.round(
    salePriceCents - FIXED_COSTS_CENTS - 0.029 * salePriceCents,
  );
  const marginPct = Math.round((netCents / salePriceCents) * 100);

  return {
    ok: true,
    level: salePriceCents < SALE_SOFT_WARN_CENTS ? "warn" : "safe",
    netCents,
    marginPct,
  };
}
