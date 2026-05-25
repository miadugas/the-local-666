-- 007_product_stock.sql
-- Per-product inventory count. Nullable: NULL = unlimited / untracked, a number
-- = limited (test runs). Additive, NO backfill — every existing row stays NULL
-- (unlimited) until Mia sets a count in the admin. CHECK keeps it non-negative.
-- Runs in migrate.ts's per-file transaction (BEGIN/COMMIT).

ALTER TABLE products ADD COLUMN stock INTEGER
  CHECK (stock IS NULL OR stock >= 0);
