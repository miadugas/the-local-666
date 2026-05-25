import { pool } from "../db/pool.js";
import { isStripColor, type Product } from "@grave-goods/shared";

type ProductRow = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  price_cents: number;
  effective_sale_price_cents: number | null;
  effective_sale_label: string | null;
  strip_label: string | null;
  strip_color: string | null;
  accent_hex: string;
  description: string | null;
  is_sold_out: boolean;
  stock: number | null;
  image_url: string;
};

const SALE_IS_ACTIVE =
  "sale_price_cents IS NOT NULL AND (sale_ends_at IS NULL OR sale_ends_at > NOW())";

const SELECT_COLUMNS = `
  id,
  slug,
  title,
  spec,
  price_cents,
  CASE WHEN ${SALE_IS_ACTIVE} THEN sale_price_cents ELSE NULL END AS effective_sale_price_cents,
  CASE WHEN ${SALE_IS_ACTIVE} THEN sale_label ELSE NULL END AS effective_sale_label,
  strip_label,
  strip_color,
  accent_hex,
  description,
  is_sold_out,
  stock,
  image_url
`;

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    spec: row.spec,
    priceCents: row.price_cents,
    salePriceCents: row.effective_sale_price_cents,
    saleLabel: row.effective_sale_label,
    stripLabel: row.strip_label,
    stripColor: isStripColor(row.strip_color) ? row.strip_color : null,
    accentHex: row.accent_hex,
    description: row.description,
    isSoldOut: row.is_sold_out,
    stock: row.stock,
    imageUrl: row.image_url,
  };
}

export async function listProducts(): Promise<Product[]> {
  const result = await pool.query<ProductRow>(
    `SELECT ${SELECT_COLUMNS} FROM products ORDER BY display_order, id`,
  );
  return result.rows.map(mapRow);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const result = await pool.query<ProductRow>(
    `SELECT ${SELECT_COLUMNS} FROM products WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

/**
 * Best-effort stock decrement, called from the Stripe webhook on each newly
 * recorded paid order. Only touches tracked rows (`stock IS NOT NULL`); clamps
 * at 0 (`GREATEST`) so it never goes negative. No row locking — the accepted
 * oversell tradeoff at current volume. Returns the new stock, or `null` when no
 * tracked row matched (untracked product or unknown slug). A returned 0 means
 * the decrement hit the floor — a possible oversell the caller can log.
 */
export async function decrementProductStock(
  slug: string,
  qty: number,
): Promise<number | null> {
  const result = await pool.query<{ stock: number }>(
    `UPDATE products SET stock = GREATEST(stock - $2, 0)
       WHERE slug = $1 AND stock IS NOT NULL
     RETURNING stock`,
    [slug, qty],
  );
  return result.rows[0]?.stock ?? null;
}
