-- 006_strip_label_color.sql
-- Per-product card "brand strip" label + color (replaces the positional
-- STRIPS[index % 4] logic in the storefront card). Additive nullable columns;
-- strip_color is constrained to the closed acid-color token set.
-- Runs in migrate.ts's per-file transaction (BEGIN/COMMIT), so the backfill
-- commits atomically with the schema change.

ALTER TABLE products ADD COLUMN strip_label TEXT;
ALTER TABLE products ADD COLUMN strip_color TEXT
  CHECK (strip_color IS NULL OR strip_color IN ('pink', 'blue', 'yellow', 'lime'));

-- Backfill the existing catalog (slugs verbatim from seed-products.ts).
-- Any slug that doesn't match is left NULL and degrades to the positional
-- fallback in StickerCard — not a hard failure.
UPDATE products SET strip_label = 'Protect',     strip_color = 'pink'   WHERE slug = 'protect-trans-kids';
UPDATE products SET strip_label = 'A.C.A.B.',    strip_color = 'blue'   WHERE slug = 'cops-arent-your-friends';
UPDATE products SET strip_label = 'Wake up',     strip_color = 'yellow' WHERE slug = 'you-are-not-immune';
UPDATE products SET strip_label = 'Class!',      strip_color = 'lime'   WHERE slug = 'class-consciousness';
UPDATE products SET strip_label = 'Obey.',       strip_color = 'pink'   WHERE slug = 'follow-your-leader';
UPDATE products SET strip_label = 'Devour.',     strip_color = 'blue'   WHERE slug = 'devour-feculence';
UPDATE products SET strip_label = 'Up yours.',   strip_color = 'yellow' WHERE slug = 'throbbing-middle-finger';
UPDATE products SET strip_label = 'Deny.',       strip_color = 'lime'   WHERE slug = 'deny-defend-depose';
UPDATE products SET strip_label = 'Briefly.',    strip_color = 'pink'   WHERE slug = 'scream-fuck-die';
UPDATE products SET strip_label = 'Hail.',       strip_color = 'blue'   WHERE slug = 'magical-stardust';
UPDATE products SET strip_label = 'I did that.', strip_color = 'yellow' WHERE slug = 'i-did-that';
UPDATE products SET strip_label = 'Guilty.',     strip_color = 'lime'   WHERE slug = 'war-criminal';
UPDATE products SET strip_label = 'A guy.',      strip_color = 'pink'   WHERE slug = 'luigi';
