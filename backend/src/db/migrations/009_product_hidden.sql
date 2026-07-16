-- 009_product_hidden.sql
-- Reversible "hidden" flag: pulls a listing off the storefront (and out of
-- checkout) without deleting it. Additive, no backfill — existing rows stay
-- visible. Runs in migrate.ts's per-file transaction.

ALTER TABLE products ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
