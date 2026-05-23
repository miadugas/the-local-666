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

export type Product = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  salePriceCents: number | null;
  saleLabel: string | null;
  accentHex: string;
  description: string | null;
  isSoldOut: boolean;
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
  accentHex: string;
  description: string | null;
  isSoldOut: boolean;
  displayOrder: number;
  imageUrl: string;
  imagePublicId: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
