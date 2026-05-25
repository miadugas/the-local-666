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
 * Closed set of card brand-strip accent colors. MUST stay a closed token list:
 * the chosen color maps to a CSS var that flows into an inline style, so a raw
 * DB string must never reach the style. Validate against this on every boundary.
 */
export const STRIP_COLORS = ["pink", "blue", "yellow", "lime"] as const;
export type StripColor = (typeof STRIP_COLORS)[number];

/** Runtime guard — DB/API values are runtime strings, so never cast; validate. */
export function isStripColor(value: unknown): value is StripColor {
  return (
    typeof value === "string" &&
    (STRIP_COLORS as readonly string[]).includes(value)
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
