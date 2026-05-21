import type { Request, Response, NextFunction } from "express";
import { lookupSession, type SessionLookup } from "./session.js";
import { SESSION_COOKIE } from "./cookies.js";

// Augment Express Request to carry auth info — used by downstream handlers.
declare module "express-serve-static-core" {
  interface Request {
    auth?: SessionLookup;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const session = await lookupSession(token);

  if (!session) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  req.auth = session;
  next();
}

/**
 * Role gate. Phase 1 has only admin users, so this is effectively a no-op
 * after requireAuth. Exists so Phase 3 CRUD endpoints can wire it cleanly.
 */
export function requireRole(_role: "admin") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    // Future: check req.auth.user.role === _role once roles exist.
    next();
  };
}
