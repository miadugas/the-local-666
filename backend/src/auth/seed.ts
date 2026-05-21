import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";
import { env } from "../env.js";

const BCRYPT_ROUNDS = 12;

export async function seedAdminIfEmpty(): Promise<void> {
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM admin_users",
  );
  const count = Number(countResult.rows[0]?.count ?? "0");

  if (count > 0) {
    console.log(`[seed] admin_users has ${count} row(s) — skipping seed`);
    return;
  }

  if (!env.adminEmail || !env.adminPassword) {
    console.warn(
      "[seed] admin_users is empty but ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping. Add them and restart, or create the admin via SQL.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, BCRYPT_ROUNDS);

  await pool.query(
    `INSERT INTO admin_users (email, password_hash, full_name)
     VALUES ($1, $2, $3)`,
    [env.adminEmail, passwordHash, env.adminFullName],
  );

  console.log(`[seed] created admin user ${env.adminEmail}`);
}
