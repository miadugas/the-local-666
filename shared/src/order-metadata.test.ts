import { describe, expect, it } from "vitest";
import {
  STRIPE_METADATA_VALUE_MAX,
  describeBundle,
  metadataValueFits,
  parseCartItems,
  serializeCartItems,
} from "./order-metadata.js";

describe("order metadata cart item codec", () => {
  it("round-trips serialized cart items", () => {
    const items = [
      { slug: "the-local-666", qty: 2, unitPriceCents: 500 },
      { slug: "sale-sticker", qty: 1, unitPriceCents: 425 },
    ];

    expect(parseCartItems(serializeCartItems(items))).toEqual(items);
  });

  it.each(["x", "x:0:500", "x:1:-5", "x:1:500,"])(
    "rejects malformed metadata: %s",
    (raw) => {
      expect(() => parseCartItems(raw)).toThrow();
    },
  );
});

describe("describeBundle", () => {
  it("describes pure singles", () => {
    expect(
      describeBundle({
        fivePacks: 0,
        threePacks: 0,
        singles: 2,
        saleSubtotalCents: 0,
      }),
    ).toBe("2 singles");
  });

  it("describes mixed bundle packs", () => {
    expect(
      describeBundle({
        fivePacks: 1,
        threePacks: 1,
        singles: 2,
        saleSubtotalCents: 0,
      }),
    ).toBe("1× 5-pack + 1× 3-pack + 2 singles");
  });

  it("returns empty string for an empty regular bundle", () => {
    expect(
      describeBundle({
        fivePacks: 0,
        threePacks: 0,
        singles: 0,
        saleSubtotalCents: 0,
      }),
    ).toBe("");
  });
});

describe("metadataValueFits", () => {
  it("allows values at the Stripe metadata boundary", () => {
    expect(metadataValueFits("x".repeat(STRIPE_METADATA_VALUE_MAX))).toBe(true);
  });

  it("rejects values beyond the Stripe metadata boundary", () => {
    expect(metadataValueFits("x".repeat(STRIPE_METADATA_VALUE_MAX + 1))).toBe(
      false,
    );
  });
});
