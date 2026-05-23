-- 005_sale_and_order_totals.sql
-- Pricing & bundles: per-product sale fields + order-level bundle accounting.
-- A product is "on sale" when sale_price_cents IS NOT NULL
-- AND (sale_ends_at IS NULL OR sale_ends_at > NOW()).

ALTER TABLE products ADD COLUMN sale_price_cents INTEGER
  CHECK (sale_price_cents IS NULL OR sale_price_cents >= 0);
ALTER TABLE products ADD COLUMN sale_label TEXT;
ALTER TABLE products ADD COLUMN sale_ends_at TIMESTAMPTZ;

-- Bundle accounting: list price (pre-discount) vs what the customer actually paid.
ALTER TABLE orders ADD COLUMN list_subtotal_cents INTEGER;
ALTER TABLE orders ADD COLUMN bundle_subtotal_cents INTEGER;
