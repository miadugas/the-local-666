import { describe, it, expect } from "vitest";
import { calculateCart, getBundleNudge, validateSalePrice } from "./pricing.js";

describe("calculateCart bundle math — all regular price", () => {
  const cases: Array<[number, number, number]> = [
    // [itemCount, expectedBundleCents, expectedSavingsCents]
    // pricing: single $4 (400), 3-pack $10 (1000), 5-pack $15 (1500)
    [0, 0, 0],
    [1, 400, 0],
    [2, 800, 0],
    [3, 1000, 200],
    [4, 1400, 200],
    [5, 1500, 500],
    [6, 1900, 500],
    [7, 2300, 500],
    [8, 2500, 700],
    [9, 2900, 700],
    [10, 3000, 1000],
    [11, 3400, 1000],
    [12, 3800, 1000],
    [13, 4000, 1200],
  ];

  it.each(cases)(
    "%i items → bundle $%i cents, savings $%i cents",
    (count, bundle, savings) => {
      const lines = Array.from({ length: count }, (_, i) => ({
        productId: `p${i}`,
        qty: 1,
      }));
      const result = calculateCart(lines);
      expect(result.bundleSubtotalCents).toBe(bundle);
      expect(result.savingsCents).toBe(savings);
    },
  );

  it("aggregates qty across lines correctly", () => {
    const lines = [
      { productId: "a", qty: 2 },
      { productId: "b", qty: 3 },
    ]; // 5 items total
    expect(calculateCart(lines).bundleSubtotalCents).toBe(1500);
  });
});

describe("calculateCart with sale items", () => {
  it("sale-only cart: no bundle applied even at 3+ items", () => {
    const lines = [{ productId: "a", qty: 3, salePriceCents: 350 }];
    const result = calculateCart(lines);
    expect(result.bundleSubtotalCents).toBe(1050); // 3 × $3.50, NOT the $10 3-pack
    expect(result.regularItemCount).toBe(0);
    expect(result.saleItemCount).toBe(3);
  });

  it("mixed cart: 2 sale + 3 regular = sale prices + 3-pack", () => {
    const lines = [
      { productId: "a", qty: 2, salePriceCents: 350 }, // $7
      { productId: "b", qty: 3 }, // $10 (3-pack)
    ];
    const result = calculateCart(lines);
    expect(result.bundleSubtotalCents).toBe(1700); // $7 + $10
    expect(result.regularItemCount).toBe(3);
    expect(result.saleItemCount).toBe(2);
  });

  it("mixed cart: 1 sale + 4 regular = sale + 3-pack + 1 single", () => {
    const lines = [
      { productId: "a", qty: 1, salePriceCents: 350 }, // $3.50
      { productId: "b", qty: 4 }, // 3-pack + 1 = $14
    ];
    const result = calculateCart(lines);
    expect(result.bundleSubtotalCents).toBe(1750); // $3.50 + $14
  });

  it("savings reflects difference from full list price", () => {
    const lines = [
      { productId: "a", qty: 1, salePriceCents: 350 }, // sale: $3.50 vs $4 = $0.50 savings
      { productId: "b", qty: 3 }, // 3-pack: $10 vs $12 = $2 savings
    ];
    const result = calculateCart(lines);
    expect(result.listSubtotalCents).toBe(1600); // 4 × $4
    expect(result.bundleSubtotalCents).toBe(1350); // $3.50 + $10
    expect(result.savingsCents).toBe(250); // $0.50 + $2
  });
});

describe("getBundleNudge — based on regular item count only", () => {
  it("returns null at 0, 8, and above", () => {
    expect(getBundleNudge(0)).toBeNull();
    expect(getBundleNudge(8)).toBeNull();
    expect(getBundleNudge(20)).toBeNull();
  });
  it("returns 3-pack nudge at 1 and 2 regular items", () => {
    expect(getBundleNudge(1)).toContain("3-pack");
    expect(getBundleNudge(2)).toContain("3-pack");
  });
  it("returns 5-pack nudge at 3 and 4 regular items", () => {
    expect(getBundleNudge(3)).toContain("5-pack");
    expect(getBundleNudge(4)).toContain("5-pack");
  });
});

describe("validateSalePrice", () => {
  it("rejects price at or above regular price", () => {
    const result = validateSalePrice(400);
    expect(result.ok).toBe(false);
  });
  it("rejects price below hard floor", () => {
    const result = validateSalePrice(249);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("$2.50");
  });
  it("warns when price below soft floor but above hard floor", () => {
    const result = validateSalePrice(275);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.level).toBe("warn");
  });
  it("safe at $3.50 (healthy margin)", () => {
    const result = validateSalePrice(350);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.level).toBe("safe");
      expect(result.marginPct).toBeGreaterThanOrEqual(30);
    }
  });
  it("rejects negative or zero", () => {
    expect(validateSalePrice(0).ok).toBe(false);
    expect(validateSalePrice(-100).ok).toBe(false);
  });
});
