-- 003_product_images.sql
-- Phase 3: product images move onto the row (local path or Cloudinary URL).

ALTER TABLE products ADD COLUMN image_url TEXT;
ALTER TABLE products ADD COLUMN image_public_id TEXT;

UPDATE products
   SET image_url = '/stickers/' || slug || '.png'
 WHERE image_url IS NULL;

ALTER TABLE products ALTER COLUMN image_url SET NOT NULL;
