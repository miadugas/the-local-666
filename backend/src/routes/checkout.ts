import { Router } from "express";
import type Stripe from "stripe";
import {
  PRICES,
  calculateCart,
  describeBundle,
  metadataValueFits,
  serializeCartItems,
  type CartLine,
} from "@grave-goods/shared";
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
  if (rawItems.length > 50) {
    res.status(400).json({ message: "Cart cannot contain more than 50 items" });
    return;
  }

  const lines: CartLine[] = [];
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
    // Server-authoritative sold-out: manual flag OR a tracked count at zero.
    // The frontend "Only X left" / Sold Out badges are cosmetic — this is the
    // gate that actually blocks a sale.
    const effectiveSoldOut =
      product.isSoldOut || (product.stock !== null && product.stock <= 0);
    if (effectiveSoldOut) {
      res.status(409).json({ message: `${product.title} is sold out` });
      return;
    }
    // Reject ordering more than the remaining tracked stock (test-run cap).
    // Doesn't solve concurrent-checkout races — accepted, best-effort.
    if (product.stock !== null && quantity > product.stock) {
      res
        .status(409)
        .json({ message: `Only ${product.stock} left of ${product.title}` });
      return;
    }
    lines.push({
      productId: product.slug,
      qty: quantity,
      salePriceCents: product.salePriceCents ?? undefined,
    });
    snapshot.push({
      slug: product.slug,
      title: product.title,
      quantity,
      unitPriceCents: product.salePriceCents ?? PRICES.SINGLE_CENTS,
    });
  }

  const cart = calculateCart(lines);
  const bundleDescription = describeBundle(cart.breakdown);
  const description =
    cart.saleItemCount === 0
      ? bundleDescription
      : cart.regularItemCount === 0
        ? `${cart.saleItemCount} on sale`
        : `${bundleDescription} + ${cart.saleItemCount} on sale`;
  const items = serializeCartItems(
    snapshot.map((item) => ({
      slug: item.slug,
      qty: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
  );
  if (!metadataValueFits(items)) {
    res.status(400).json({ message: "Cart metadata is too large" });
    return;
  }

  if (!isConfigured()) {
    res.status(503).json({ message: "Checkout is not configured" });
    return;
  }

  const stripe = getStripe();
  const lineItems: CheckoutLineItem[] = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name:
            cart.itemCount === 1
              ? "The Local 666 — sticker"
              : `The Local 666 — ${cart.itemCount} stickers`,
          ...(description ? { description } : {}),
        },
        unit_amount: cart.bundleSubtotalCents,
      },
      quantity: 1,
    },
  ];
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${env.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.frontendUrl}/checkout/cancel`,
    metadata: {
      items,
      list_subtotal_cents: String(cart.listSubtotalCents),
      bundle_subtotal_cents: String(cart.bundleSubtotalCents),
      savings_cents: String(cart.savingsCents),
      item_count: String(cart.itemCount),
      five_packs: String(cart.breakdown.fivePacks),
      three_packs: String(cart.breakdown.threePacks),
      singles: String(cart.breakdown.singles),
    },
  });

  res.json({ url: session.url });
});
