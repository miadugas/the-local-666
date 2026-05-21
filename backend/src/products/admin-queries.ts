import { pool } from "../db/pool.js";
import type { AdminProduct } from "@grave-goods/shared";

type AdminProductRow = {
  id: number;
  slug: string;
  title: string;
  spec: string;
  price_cents: number;
  accent_hex: string;
  description: string | null;
  is_sold_out: boolean;
  display_order: number;
  image_url: string;
  image_public_id: string | null;
  created_at: Date;
  updated_at: Date;
};

const COLS =
  "id, slug, title, spec, price_cents, accent_hex, description, is_sold_out, display_order, image_url, image_public_id, created_at, updated_at";

function mapRow(r: AdminProductRow): AdminProduct {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    spec: r.spec,
    priceCents: r.price_cents,
    accentHex: r.accent_hex,
    description: r.description,
    isSoldOut: r.is_sold_out,
    displayOrder: r.display_order,
    imageUrl: r.image_url,
    imagePublicId: r.image_public_id,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export type CreateProductInput = {
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  accentHex: string;
  description: string | null;
  isSoldOut: boolean;
  displayOrder: number;
  imageUrl: string;
  imagePublicId: string | null;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const result = await pool.query<AdminProductRow>(
    `SELECT ${COLS} FROM products ORDER BY display_order, id`,
  );
  return result.rows.map(mapRow);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<AdminProduct> {
  const result = await pool.query<AdminProductRow>(
    `INSERT INTO products
       (slug, title, spec, price_cents, accent_hex, description, is_sold_out, display_order, image_url, image_public_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${COLS}`,
    [
      input.slug,
      input.title,
      input.spec,
      input.priceCents,
      input.accentHex,
      input.description,
      input.isSoldOut,
      input.displayOrder,
      input.imageUrl,
      input.imagePublicId,
    ],
  );
  return mapRow(result.rows[0]);
}

export async function updateProduct(
  id: number,
  input: UpdateProductInput,
): Promise<AdminProduct | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  const set = (col: string, val: unknown) => {
    fields.push(`${col} = $${i++}`);
    values.push(val);
  };

  if (input.slug !== undefined) set("slug", input.slug);
  if (input.title !== undefined) set("title", input.title);
  if (input.spec !== undefined) set("spec", input.spec);
  if (input.priceCents !== undefined) set("price_cents", input.priceCents);
  if (input.accentHex !== undefined) set("accent_hex", input.accentHex);
  if (input.description !== undefined) set("description", input.description);
  if (input.isSoldOut !== undefined) set("is_sold_out", input.isSoldOut);
  if (input.displayOrder !== undefined)
    set("display_order", input.displayOrder);
  if (input.imageUrl !== undefined) set("image_url", input.imageUrl);
  if (input.imagePublicId !== undefined)
    set("image_public_id", input.imagePublicId);

  if (fields.length === 0) {
    const cur = await pool.query<AdminProductRow>(
      `SELECT ${COLS} FROM products WHERE id = $1`,
      [id],
    );
    return cur.rows[0] ? mapRow(cur.rows[0]) : null;
  }

  fields.push("updated_at = NOW()");
  values.push(id);
  const result = await pool.query<AdminProductRow>(
    `UPDATE products SET ${fields.join(", ")} WHERE id = $${i} RETURNING ${COLS}`,
    values,
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
