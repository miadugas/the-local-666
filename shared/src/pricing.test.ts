import { describe, it, expect } from "vitest";
import { calculateCart, getBundleNudge, validateSalePrice } from "./pricing.js";

describe("calculateCart bundle math — all regular price", () => {
  const cases: Array<[number, number, number]> = [
    // [itemCount, expectedBundleCents, expectedSavingsCents]
    [0, 0, 0],
    [1, 500, 0],
    [2, 1000, 0],
    [3, 1300, 200],
    [4, 1800, 200],
    [5, 2000, 500],
    [6, 2500, 500],
    [7, 3000, 500],
    [8, 3300, 700],
    [9, 3800, 700],
    [10, 4000, 1000],
    [11, 4500, 1000],
    [12, 5000, 1000],
    [13, 5300, 1200],
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
    expect(calculateCart(lines).bundleSubtotalCents).toBe(2000);
  });
});

describe("calculateCart with sale items", () => {
  it("sale-only cart: no bundle applied even at 3+ items", () => {
    const lines = [{ productId: "a", qty: 3, salePriceCents: 350 }];
    const result = calculateCart(lines);
    expect(result.bundleSubtotalCents).toBe(1050); // 3 × $3.50, NOT $13
    expect(result.regularItemCount).toBe(0);
    expect(result.saleItemCount).toBe(3);
  });

  it("mixed cart: 2 sale + 3 regular = sale prices + 3-pack", () => {
    const lines = [
      { productId: "a", qty: 2, salePriceCents: 350 }, // $7
      { productId: "b", qty: 3 }, // $13 (3-pack)
    ];
    const result = calculateCart(lines);
    expect(result.bundleSubtotalCents).toBe(2000); // $7 + $13
    expect(result.regularItemCount).toBe(3);
    expect(result.saleItemCount).toBe(2);
  });

  it("mixed cart: 1 sale + 4 regular = sale + 3-pack + 1 single", () => {
    const lines = [
      { productId: "a", qty: 1, salePriceCents: 400 }, // $4
      { productId: "b", qty: 4 }, // 3-pack + 1 = $18
    ];
    const result = calculateCart(lines);
    expect(result.bundleSubtotalCents).toBe(2200); // $4 + $18
  });

  it("savings reflects difference from full list price", () => {
    const lines = [
      { productId: "a", qty: 1, salePriceCents: 350 }, // sale: $3.50 vs $5 = $1.50 savings
      { productId: "b", qty: 3 }, // 3-pack: $13 vs $15 = $2 savings
    ];
    const result = calculateCart(lines);
    expect(result.listSubtotalCents).toBe(2000); // 4 × $5
    expect(result.bundleSubtotalCents).toBe(1650); // $3.50 + $13
    expect(result.savingsCents).toBe(350); // $1.50 + $2
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
    const result = validateSalePrice(500);
    expect(result.ok).toBe(false);
  });
  it("rejects price below hard floor", () => {
    const result = validateSalePrice(299);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("$3.00");
  });
  it("warns when price below soft floor but above hard floor", () => {
    const result = validateSalePrice(300);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.level).toBe("warn");
  });
  it("safe at $4 (industry margin floor)", () => {
    const result = validateSalePrice(400);
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
