import { pool } from "../db/pool.js";
import type { Product } from "@grave-goods/shared";

type ProductRow = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  price_cents: number;
  accent_hex: string;
  description: string | null;
  is_sold_out: boolean;
};

const SELECT_COLUMNS =
  "id, slug, title, spec, price_cents, accent_hex, description, is_sold_out";

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    spec: row.spec,
    priceCents: row.price_cents,
    accentHex: row.accent_hex,
    description: row.description,
    isSoldOut: row.is_sold_out,
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
