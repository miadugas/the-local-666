import { Router } from "express";
import { lookupSession } from "../auth/session.js";
import { SESSION_COOKIE } from "../auth/cookies.js";

export const meRouter = Router();

meRouter.get("/api/me", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const session = await lookupSession(token);

  if (!session) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  res.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      createdAt: session.user.createdAt.toISOString(),
    },
  });
});
