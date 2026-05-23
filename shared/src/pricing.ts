// shared/src/pricing.ts
//
// Single source of truth for cart/bundle pricing. Both the Vue cart store and
// the Express checkout import from here — never recompute totals separately.

export const PRICES = {
  SINGLE_CENTS: 500,
  THREE_PACK_CENTS: 1300,
  FIVE_PACK_CENTS: 2000,
} as const;

// Sale price thresholds — derived from cost structure
// Fixed cost per single-item order: COGS $0.295 + packaging $0.90 + postage $1.19 + Stripe flat $0.30 = $2.69
// Stripe also takes 2.9% of revenue. Break-even at sale price P: 0.971 * P = 2.69 → P = $2.77
export const SALE_HARD_FLOOR_CENTS = 300; // Below this = losing money after fees. Hard block.
export const SALE_SOFT_WARN_CENTS = 350; // Below this = thin margin (<20%). Warn admin.

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
  // fixed costs per single-item order = 29.5 + 90 + 119 + 30 = 268.5 cents (use 269)
  const FIXED_COSTS_CENTS = 269;
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
