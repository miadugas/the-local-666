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
