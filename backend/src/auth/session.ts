import { randomBytes } from "node:crypto";
import { pool } from "../db/pool.js";

const SESSION_DURATION_DAYS = 30;

export type SessionLookup = {
  sessionToken: string;
  adminUserId: number;
  expiresAt: Date;
  user: {
    id: number;
    email: string;
    fullName: string;
    createdAt: Date;
  };
};

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(adminUserId: number): Promise<string> {
  const token = generateSessionToken();
  await pool.query(
    `INSERT INTO sessions (session_token, admin_user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' days')::INTERVAL)`,
    [token, adminUserId, SESSION_DURATION_DAYS],
  );
  return token;
}

export async function lookupSession(
  token: string | undefined,
): Promise<SessionLookup | null> {
  if (!token) return null;

  const result = await pool.query<{
    session_token: string;
    admin_user_id: number;
    expires_at: Date;
    user_id: number;
    email: string;
    full_name: string;
    user_created_at: Date;
  }>(
    `SELECT
       s.session_token,
       s.admin_user_id,
       s.expires_at,
       u.id AS user_id,
       u.email,
       u.full_name,
       u.created_at AS user_created_at
     FROM sessions s
     JOIN admin_users u ON u.id = s.admin_user_id
     WHERE s.session_token = $1
       AND s.expires_at > NOW()
     LIMIT 1`,
    [token],
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];

  return {
    sessionToken: row.session_token,
    adminUserId: row.admin_user_id,
    expiresAt: row.expires_at,
    user: {
      id: row.user_id,
      email: row.email,
      fullName: row.full_name,
      createdAt: row.user_created_at,
    },
  };
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await pool.query("DELETE FROM sessions WHERE session_token = $1", [token]);
}
