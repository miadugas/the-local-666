import { describe, it, expect } from "vitest";
import {
  BRAND_COLORS,
  BRAND_COLOR_NAMES,
  isBrandColorHex,
  isStripColor,
} from "./types.js";

describe("isStripColor", () => {
  it("accepts every brand color name (12, red excluded)", () => {
    expect(BRAND_COLOR_NAMES).toHaveLength(12);
    for (const name of BRAND_COLOR_NAMES) {
      expect(isStripColor(name)).toBe(true);
    }
  });

  it("rejects reserved red, unknown names, and non-strings", () => {
    expect(isStripColor("red")).toBe(false);
    expect(isStripColor("teal")).toBe(false);
    expect(isStripColor("")).toBe(false);
    expect(isStripColor(null)).toBe(false);
    expect(isStripColor(42)).toBe(false);
  });
});

describe("isBrandColorHex", () => {
  it("accepts every palette hex, case-insensitively", () => {
    for (const hex of Object.values(BRAND_COLORS)) {
      expect(isBrandColorHex(hex)).toBe(true);
      expect(isBrandColorHex(hex.toUpperCase())).toBe(true);
    }
  });

  it("rejects the reserved acid-red hex and arbitrary values", () => {
    expect(isBrandColorHex("#e3151f")).toBe(false); // reserved red — not selectable
    expect(isBrandColorHex("#123456")).toBe(false);
    expect(isBrandColorHex("red")).toBe(false);
    expect(isBrandColorHex("")).toBe(false);
    expect(isBrandColorHex(null)).toBe(false);
  });
});
