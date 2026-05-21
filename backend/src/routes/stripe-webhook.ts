import type { Request, Response } from "express";
import type Stripe from "stripe";
import { getStripe } from "../payments/stripe.js";
import { env } from "../env.js";
import { insertPaidOrder, type OrderItem } from "../orders/queries.js";
import {
  isConfigured as emailIsConfigured,
  sendOrderConfirmation,
} from "../emails/orderConfirmation.js";

export async function stripeWebhookHandler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!env.stripeWebhookSecret) {
    res.status(503).json({ message: "Webhook is not configured" });
    return;
  }
  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string") {
    res.status(400).json({ message: "Missing signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    // req.body is a Buffer here (express.raw), required for signature verification.
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      env.stripeWebhookSecret,
    );
  } catch {
    res.status(400).json({ message: "Invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    let items: OrderItem[] = [];
    try {
      items = JSON.parse(session.metadata?.items ?? "[]") as OrderItem[];
    } catch {
      items = [];
    }
    const email = session.customer_details?.email ?? null;
    const totalCents = session.amount_total ?? 0;
    const inserted = await insertPaidOrder({
      stripeSessionId: session.id,
      email,
      items,
      totalCents,
    });
    if (inserted && email && emailIsConfigured()) {
      try {
        await sendOrderConfirmation({ email, items, totalCents });
      } catch (err) {
        console.error("[email] order confirmation failed", err);
      }
    }
  }

  res.status(200).json({ received: true });
}
