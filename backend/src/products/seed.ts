import { pool } from "../db/pool.js";
import { SEED_PRODUCTS } from "../data/seed-products.js";

export async function seedProductsIfEmpty(): Promise<void> {
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM products",
  );
  const count = Number(countResult.rows[0]?.count ?? "0");

  if (count > 0) {
    console.log(`[seed] products has ${count} row(s) — skipping seed`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const product of SEED_PRODUCTS) {
      await client.query(
        `INSERT INTO products
           (slug, title, spec, price_cents, accent_hex, description, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          product.slug,
          product.title,
          product.spec,
          product.priceCents,
          product.accentHex,
          product.description,
          product.displayOrder,
        ],
      );
    }
    await client.query("COMMIT");
    console.log(`[seed] inserted ${SEED_PRODUCTS.length} products`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[seed] product seed FAILED", err);
    throw err;
  } finally {
    client.release();
  }
}
