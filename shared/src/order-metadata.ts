import type { CartTotal } from "./pricing.js";

export const STRIPE_METADATA_VALUE_MAX = 500;

export type MetaCartItem = {
  slug: string;
  qty: number;
  unitPriceCents: number;
};

export function serializeCartItems(items: MetaCartItem[]): string {
  return items
    .map((item) => `${item.slug}:${item.qty}:${item.unitPriceCents}`)
    .join(",");
}

export function parseCartItems(raw: string): MetaCartItem[] {
  if (raw === "") return [];

  return raw.split(",").map((part) => {
    const pieces = part.split(":");
    if (pieces.length !== 3) {
      throw new Error("Malformed cart item metadata");
    }

    const [slug, qtyRaw, unitPriceRaw] = pieces;
    const qty = Number(qtyRaw);
    const unitPriceCents = Number(unitPriceRaw);
    if (
      !/^[a-z0-9-]+$/.test(slug) ||
      !Number.isInteger(qty) ||
      qty < 1 ||
      !Number.isInteger(unitPriceCents) ||
      unitPriceCents < 0
    ) {
      throw new Error("Invalid cart item metadata");
    }

    return { slug, qty, unitPriceCents };
  });
}

export function describeBundle(breakdown: CartTotal["breakdown"]): string {
  const parts: string[] = [];
  if (breakdown.fivePacks > 0) {
    parts.push(`${breakdown.fivePacks}× 5-pack`);
  }
  if (breakdown.threePacks > 0) {
    parts.push(`${breakdown.threePacks}× 3-pack`);
  }
  if (breakdown.singles > 0) {
    parts.push(
      breakdown.singles === 1 ? "1 single" : `${breakdown.singles} singles`,
    );
  }
  return parts.join(" + ");
}

export function metadataValueFits(value: string): boolean {
  return value.length <= STRIPE_METADATA_VALUE_MAX;
}
