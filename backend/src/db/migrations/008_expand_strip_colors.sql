-- 008_expand_strip_colors.sql
-- Expand the strip_color picker from 4 → the full 12-color brand palette
-- (acid-red intentionally excluded — warnings-only), and lock accent_hex to the
-- same palette. Runs inside migrate.ts's per-file BEGIN/COMMIT transaction.

-- 1. Drop EVERY existing CHECK constraint on the strip_color column. Scope by
--    the column's attnum (not a fragile name match) so we never drop the wrong
--    constraint or leave an old, more-restrictive one behind.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid AND att.attname = 'strip_color'
    WHERE con.conrelid = 'products'::regclass
      AND con.contype = 'c'
      AND att.attnum = ANY (con.conkey)
  LOOP
    EXECUTE format('ALTER TABLE products DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE products ADD CONSTRAINT products_strip_color_chk
  CHECK (strip_color IS NULL OR strip_color IN
    ('pink','blue','lime','yellow','orange','mint','sky','violet','peri','blush','bone','plum'));

-- 2. Normalize accent_hex casing (seed shipped uppercase, e.g. #5BCEFA), then
--    snap Cops' near-dupe green to the canonical mint.
UPDATE products SET accent_hex = lower(accent_hex);
UPDATE products SET accent_hex = '#34d399' WHERE accent_hex = '#2ad6a0';

-- 3. accent_hex is rendered into an inline CSS custom property, so guarantee at
--    the DB layer that it's always a palette hex (covers seed + any direct
--    write that bypasses the route validator). This ADD also doubles as the
--    post-migration assertion: it fails if any row is out-of-palette.
--    accent_hex is NOT NULL (002), so no IS NULL branch needed.
ALTER TABLE products ADD CONSTRAINT products_accent_hex_chk
  CHECK (accent_hex IN
    ('#ff2d8a','#00d4ff','#a3e635','#fff200','#ff5e00','#34d399','#5bcefa','#b026ff','#a8c8f0','#f0bcc7','#f4ecd8','#150b1c'));
