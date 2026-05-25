import type { Request, Response } from "express";
import type Stripe from "stripe";
import { parseCartItems } from "@grave-goods/shared";
import { getStripe } from "../payments/stripe.js";
import { env } from "../env.js";
import { insertPaidOrder, type OrderItem } from "../orders/queries.js";
import {
  decrementProductStock,
  getProductBySlug,
} from "../products/queries.js";
import {
  isConfigured as emailIsConfigured,
  sendOrderConfirmation,
} from "../emails/orderConfirmation.js";

function parseMetadataInt(value: string | undefined, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name} metadata`);
  }
  return parsed;
}

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
    if (typeof session.amount_total !== "number") {
      console.error("[stripe] checkout session missing amount_total", {
        sessionId: session.id,
      });
      res.status(500).json({ message: "Invalid checkout session total" });
      return;
    }

    let metadataItems;
    try {
      metadataItems = parseCartItems(session.metadata?.items ?? "");
    } catch (err) {
      console.error("[stripe] malformed checkout metadata items", {
        sessionId: session.id,
        rawItems: session.metadata?.items,
        err,
      });
      res.status(500).json({ message: "Invalid checkout metadata" });
      return;
    }

    let listSubtotalCents: number;
    let bundleSubtotalCents: number;
    let itemCount: number;
    try {
      listSubtotalCents = parseMetadataInt(
        session.metadata?.list_subtotal_cents,
        "list_subtotal_cents",
      );
      bundleSubtotalCents = parseMetadataInt(
        session.metadata?.bundle_subtotal_cents,
        "bundle_subtotal_cents",
      );
      itemCount = parseMetadataInt(session.metadata?.item_count, "item_count");
    } catch (err) {
      console.error("[stripe] malformed checkout numeric metadata", {
        sessionId: session.id,
        metadata: session.metadata,
        err,
      });
      res.status(500).json({ message: "Invalid checkout metadata" });
      return;
    }

    const metadataQty = metadataItems.reduce((sum, item) => sum + item.qty, 0);
    if (
      bundleSubtotalCents !== session.amount_total ||
      metadataQty !== itemCount
    ) {
      console.error("[stripe] checkout metadata reconciliation failed", {
        sessionId: session.id,
        amountTotal: session.amount_total,
        bundleSubtotalCents,
        metadataQty,
        itemCount,
      });
      res.status(500).json({ message: "Checkout metadata mismatch" });
      return;
    }

    const items: OrderItem[] = [];
    for (const item of metadataItems) {
      const product = await getProductBySlug(item.slug);
      items.push({
        slug: item.slug,
        title: product?.title ?? item.slug,
        quantity: item.qty,
        unitPriceCents: item.unitPriceCents,
      });
    }

    const email = session.customer_details?.email ?? null;
    const totalCents = session.amount_total;
    const inserted = await insertPaidOrder({
      stripeSessionId: session.id,
      email,
      items,
      totalCents,
      listSubtotalCents,
      bundleSubtotalCents,
    });
    // Decrement stock ONLY on the first record. `inserted` is false on Stripe
    // retries (ON CONFLICT DO NOTHING), so retries never double-decrement.
    // Best-effort: the order record is sacred, so a stock failure is logged but
    // never throws past here. Not wrapped in the order-insert transaction by
    // design — never roll back a real payment over a stock hiccup.
    if (inserted) {
      for (const item of metadataItems) {
        try {
          const remaining = await decrementProductStock(item.slug, item.qty);
          if (remaining === 0) {
            console.warn("[stock] decrement hit zero (possible oversell)", {
              sessionId: session.id,
              slug: item.slug,
              qty: item.qty,
            });
          }
        } catch (err) {
          console.error("[stock] decrement failed", {
            sessionId: session.id,
            slug: item.slug,
            err,
          });
        }
      }
    }
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
