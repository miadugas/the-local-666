import bcrypt from "bcrypt";
import { Router } from "express";
import { pool } from "../db/pool.js";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  setSessionCookie,
} from "../auth/cookies.js";
import { createSession, destroySession } from "../auth/session.js";

export const adminRouter = Router();

adminRouter.post("/api/admin/sign-in", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  // Look up admin user
  const result = await pool.query<{
    id: number;
    email: string;
    password_hash: string;
    full_name: string;
    created_at: Date;
  }>(
    `SELECT id, email, password_hash, full_name, created_at
     FROM admin_users
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [email],
  );

  const user = result.rows[0];
  if (!user) {
    // Do not leak existence — same response as wrong password
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // Create session + set cookie
  const token = await createSession(user.id);
  setSessionCookie(res, token);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      createdAt: user.created_at.toISOString(),
    },
  });
});

adminRouter.post("/api/admin/sign-out", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  await destroySession(token);
  clearSessionCookie(res);
  res.status(204).send();
});
