import { pool } from "../db/pool.js";
import type { Product } from "@grave-goods/shared";

type ProductRow = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  price_cents: number;
  effective_sale_price_cents: number | null;
  effective_sale_label: string | null;
  accent_hex: string;
  description: string | null;
  is_sold_out: boolean;
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
  accent_hex,
  description,
  is_sold_out,
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
    accentHex: row.accent_hex,
    description: row.description,
    isSoldOut: row.is_sold_out,
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
