/**
 * Shared types between backend (Express) and frontend (Vue) workspaces.
 *
 * Phase 1: auth-related types only. Product, Order, etc. land in later phases.
 */

export type AdminUser = {
  id: number;
  email: string;
  fullName: string;
  createdAt: string; // ISO 8601
};

export type SessionInfo = {
  expiresAt: string; // ISO 8601
};

/**
 * The Local 666 brand palette — single source of truth for selectable colors.
 * ⚠️ Keep these hexes in sync with web/src/styles/tokens.css (Tailwind v4
 * @theme can't import TS, so the values are mirrored there). `acid-red`
 * (#e3151f) is intentionally ABSENT — reserved for warning semantics only.
 */
export const BRAND_COLORS = {
  pink: "#ff2d8a",
  blue: "#00d4ff",
  lime: "#a3e635",
  yellow: "#fff200",
  orange: "#ff5e00",
  mint: "#34d399",
  sky: "#5bcefa",
  violet: "#b026ff",
  peri: "#a8c8f0",
  blush: "#f0bcc7",
  bone: "#f4ecd8",
  plum: "#150b1c",
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;
export const BRAND_COLOR_NAMES = Object.keys(
  BRAND_COLORS,
) as readonly BrandColor[];
export const BRAND_COLOR_HEXES = Object.values(
  BRAND_COLORS,
) as readonly string[];

/** Runtime guard for an accent hex — must be a palette hex (case-insensitive). */
export function isBrandColorHex(value: unknown): value is string {
  return (
    typeof value === "string" && BRAND_COLOR_HEXES.includes(value.toLowerCase())
  );
}

/**
 * Closed set of card brand-strip accent colors = the full brand palette. MUST
 * stay a closed token list: the chosen color maps to a CSS var that flows into
 * an inline style, so a raw DB string must never reach the style. Validate
 * against this on every boundary.
 */
export const STRIP_COLORS = BRAND_COLOR_NAMES;
export type StripColor = BrandColor;

/** Runtime guard — DB/API values are runtime strings, so never cast; validate. */
export function isStripColor(value: unknown): value is StripColor {
  return (
    typeof value === "string" &&
    (BRAND_COLOR_NAMES as readonly string[]).includes(value)
  );
}

export type Product = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  salePriceCents: number | null;
  saleLabel: string | null;
  stripLabel: string | null;
  stripColor: StripColor | null;
  accentHex: string;
  description: string | null;
  isSoldOut: boolean;
  /** null = unlimited/untracked; a number = limited (test run). */
  stock: number | null;
  imageUrl: string;
};

export type AdminProduct = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  salePriceCents: number | null;
  saleLabel: string | null;
  saleEndsAt: string | null;
  stripLabel: string | null;
  stripColor: StripColor | null;
  accentHex: string;
  description: string | null;
  isSoldOut: boolean;
  /** null = unlimited/untracked; a number = limited (test run). */
  stock: number | null;
  displayOrder: number;
  imageUrl: string;
  imagePublicId: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
