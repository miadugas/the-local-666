import { pool } from "../db/pool.js";

export type OrderItem = {
  slug: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
};

export async function insertPaidOrder(input: {
  stripeSessionId: string;
  email: string | null;
  items: OrderItem[];
  totalCents: number;
  listSubtotalCents: number;
  bundleSubtotalCents: number;
}): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO orders (stripe_session_id, email, items, total_cents, list_subtotal_cents, bundle_subtotal_cents, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'paid')
     ON CONFLICT (stripe_session_id) DO NOTHING`,
    [
      input.stripeSessionId,
      input.email,
      JSON.stringify(input.items),
      input.totalCents,
      input.listSubtotalCents,
      input.bundleSubtotalCents,
    ],
  );
  return (result.rowCount ?? 0) > 0;
}
