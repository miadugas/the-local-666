import { Router } from "express";
import { Resend } from "resend";
import { env } from "../env.js";

export const subscribeRouter = Router();

// Loose server-side shape check; the client input is type="email" too.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

subscribeRouter.post("/api/subscribe", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ message: "Enter a valid email." });
    return;
  }

  if (!env.resendApiKey || !env.resendAudienceId) {
    console.warn("[subscribe] Resend audience not configured — skipping");
    res.status(503).json({ message: "Signups aren't wired up yet." });
    return;
  }

  try {
    const resend = new Resend(env.resendApiKey);
    const { error } = await resend.contacts.create({
      email,
      audienceId: env.resendAudienceId,
      unsubscribed: false,
    });
    if (error) {
      // Most often this is "already a contact" — don't punish a repeat signup.
      // Log it so a genuine failure (e.g. wrong audience id) stays visible.
      console.error("[subscribe] resend contacts.create error", error);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[subscribe] failed", err);
    res.status(500).json({ message: "Couldn't sign you up — try again." });
  }
});
