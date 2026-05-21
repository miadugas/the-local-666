-- 004_orders.sql
-- Phase 5: paid orders. One row per completed Stripe Checkout session.

CREATE TABLE orders (
  id                SERIAL PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  email             TEXT,
  items             JSONB NOT NULL,
  total_cents       INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'paid',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
