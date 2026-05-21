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
}): Promise<void> {
  await pool.query(
    `INSERT INTO orders (stripe_session_id, email, items, total_cents, status)
     VALUES ($1, $2, $3, $4, 'paid')
     ON CONFLICT (stripe_session_id) DO NOTHING`,
    [
      input.stripeSessionId,
      input.email,
      JSON.stringify(input.items),
      input.totalCents,
    ],
  );
}
