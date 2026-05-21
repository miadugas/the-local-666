import { Router } from "express";
import type Stripe from "stripe";
import { getStripe, isConfigured } from "../payments/stripe.js";
import { getProductBySlug } from "../products/queries.js";
import type { OrderItem } from "../orders/queries.js";
import { env } from "../env.js";

type CheckoutLineItem = NonNullable<
  NonNullable<
    Parameters<Stripe["checkout"]["sessions"]["create"]>[0]
  >["line_items"]
>[number];

export const checkoutRouter = Router();

checkoutRouter.post("/api/checkout", async (req, res) => {
  const rawItems = req.body?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    res.status(400).json({ message: "Cart is empty" });
    return;
  }

  const lineItems: CheckoutLineItem[] = [];
  const snapshot: OrderItem[] = [];

  for (const raw of rawItems) {
    const slug = String(raw?.slug ?? "");
    const quantity = Number(raw?.quantity);
    if (!slug || !Number.isInteger(quantity) || quantity < 1) {
      res.status(400).json({ message: "Invalid cart item" });
      return;
    }
    const product = await getProductBySlug(slug);
    if (!product) {
      res.status(400).json({ message: `Unknown product: ${slug}` });
      return;
    }
    if (product.isSoldOut) {
      res.status(409).json({ message: `${product.title} is sold out` });
      return;
    }
    const images = product.imageUrl.startsWith("http")
      ? [product.imageUrl]
      : undefined;
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: product.title, ...(images ? { images } : {}) },
        unit_amount: product.priceCents,
      },
      quantity,
    });
    snapshot.push({
      slug: product.slug,
      title: product.title,
      quantity,
      unitPriceCents: product.priceCents,
    });
  }

  if (!isConfigured()) {
    res.status(503).json({ message: "Checkout is not configured" });
    return;
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${env.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.frontendUrl}/checkout/cancel`,
    metadata: { items: JSON.stringify(snapshot) },
  });

  res.json({ url: session.url });
});
