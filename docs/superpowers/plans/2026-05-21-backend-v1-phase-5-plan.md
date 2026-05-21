# Backend v1 Phase 5 — Stripe Checkout + Webhook + Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Checkout button to a real Stripe hosted-checkout flow — re-price the cart from the DB, create a session, and persist a paid order when the signature-verified webhook confirms payment.

**Architecture:** Backend adds the `stripe` SDK, a checkout endpoint (validates + re-prices from the DB, creates a session), a raw-body signature-verified webhook (inserts a paid order idempotently), and migration 004 (`orders`, JSONB items). Frontend wires the CartDrawer button and adds success/cancel routes. Guest checkout.

**Tech Stack:** Express 5 (ESM), Postgres (`pg`), `stripe` SDK; Vue 3.5, vue-router, Pinia.

**Verification approach:** No test runner. Verify via `npm run build`, `npm run db:migrate`, `curl`, and (for the live paths) Stripe test keys + the Stripe CLI. The checkout endpoint validates the cart **before** the `isConfigured` check, so 400/409 are testable without keys; the URL/redirect and webhook insert need test keys. Postgres must be running.

**Source spec:** `docs/superpowers/specs/2026-05-21-backend-v1-phase-5-design.md`

---

## File Structure

**Create (backend):** `db/migrations/004_orders.sql`, `orders/queries.ts`, `payments/stripe.ts`, `routes/checkout.ts`, `routes/stripe-webhook.ts`
**Modify (backend):** `env.ts`, `.env.example`, `index.ts`
**Create (frontend):** `views/CheckoutSuccessView.vue`, `views/CheckoutCancelView.vue`
**Modify (frontend):** `router/index.ts`, `components/CartDrawer.vue`

---

## Task 1: Migration 004 + order persistence

**Files:**

- Create: `backend/src/db/migrations/004_orders.sql`, `backend/src/orders/queries.ts`

- [ ] **Step 1.1: Create the migration**

```sql
-- 004_orders.sql
-- Phase 5: paid orders. One row per completed Stripe Checkout session.

CREATE TABLE orders (
  id                SERIAL PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  email             TEXT,
  items             JSONB NOT NULL,
  total_cents       INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'paid',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 1.2: Create `orders/queries.ts`**

```ts
import { pool } from "../db/pool.js";

export type OrderItem = {
  slug: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
};

export async function insertPaidOrder(input: {
  stripeSessionId: string;
  email: string | null;
  items: OrderItem[];
  totalCents: number;
}): Promise<void> {
  await pool.query(
    `INSERT INTO orders (stripe_session_id, email, items, total_cents, status)
     VALUES ($1, $2, $3, $4, 'paid')
     ON CONFLICT (stripe_session_id) DO NOTHING`,
    [
      input.stripeSessionId,
      input.email,
      JSON.stringify(input.items),
      input.totalCents,
    ],
  );
}
```

- [ ] **Step 1.3: Build + migrate + verify**

```bash
npm run build --workspace backend 2>&1 | tail -2
npm run db:migrate --workspace backend 2>&1 | grep -E "applied|skip|complete"
psql -d grave_goods -c "\d orders" | grep -E "stripe_session_id|items|total_cents|status"
```

Expected: `[migrate] applied 004_orders`; the columns appear (`stripe_session_id` unique, `items` jsonb, etc.).

- [ ] **Step 1.4: Commit**

```bash
git add backend/src/db/migrations/004_orders.sql backend/src/orders/queries.ts
git commit -m "feat(backend): migration 004 — orders + insertPaidOrder

Single orders table with JSONB line items, unique stripe_session_id.
insertPaidOrder is idempotent (ON CONFLICT DO NOTHING) for webhook retries."
```

---

## Task 2: Stripe SDK + env + client

**Files:**

- Modify: `backend/package.json` (via install), `backend/src/env.ts`, `backend/.env.example`
- Create: `backend/src/payments/stripe.ts`

- [ ] **Step 2.1: Install the SDK**

```bash
npm install stripe --workspace backend
```

- [ ] **Step 2.2: Add env vars**

In `backend/src/env.ts`, add to the `env` object (after `cloudinaryFolder`):

```ts
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? null,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
```

Append to `backend/.env.example`:

```bash

# Stripe (optional — checkout is disabled until the secret key is set)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

- [ ] **Step 2.3: Create the client module**

```ts
// backend/src/payments/stripe.ts
import Stripe from "stripe";
import { env } from "../env.js";

export function isConfigured(): boolean {
  return Boolean(env.stripeSecretKey);
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  }
  if (!client) {
    client = new Stripe(env.stripeSecretKey);
  }
  return client;
}
```

- [ ] **Step 2.4: Build**

```bash
npm run build --workspace backend 2>&1 | tail -2
```

Expected: success (the `stripe` package ships its own types).

- [ ] **Step 2.5: Commit**

```bash
git add backend/package.json package-lock.json backend/src/env.ts backend/.env.example backend/src/payments/stripe.ts
git commit -m "feat(backend): add stripe SDK + client module + env

Optional STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET. isConfigured() gates
checkout; getStripe() lazily builds a singleton client."
```

---

## Task 3: Checkout endpoint

**Files:**

- Create: `backend/src/routes/checkout.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 3.1: Create `checkout.ts`**

Validation runs before the `isConfigured` check so 400/409 are reachable without keys.

```ts
import { Router } from "express";
import type Stripe from "stripe";
import { getStripe, isConfigured } from "../payments/stripe.js";
import { getProductBySlug } from "../products/queries.js";
import type { OrderItem } from "../orders/queries.js";
import { env } from "../env.js";

export const checkoutRouter = Router();

checkoutRouter.post("/api/checkout", async (req, res) => {
  const rawItems = req.body?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    res.status(400).json({ message: "Cart is empty" });
    return;
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
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
```

- [ ] **Step 3.2: Mount in `index.ts`**

```ts
import { checkoutRouter } from "./routes/checkout.js";
```

After `app.use(adminProductsRouter);`:

```ts
app.use(checkoutRouter);
```

- [ ] **Step 3.3: Build + verify validation paths (no keys needed)**

```bash
npm run build --workspace backend 2>&1 | tail -2
cd backend && npx tsx src/index.ts > /tmp/p5-t3.log 2>&1 & sleep 3
echo "=== empty cart (expect 400) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/checkout -H 'Content-Type: application/json' -d '{"items":[]}'
echo "=== unknown slug (expect 400) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/checkout -H 'Content-Type: application/json' -d '{"items":[{"slug":"nope","quantity":1}]}'
echo "=== sold-out war-criminal (expect 409) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/checkout -H 'Content-Type: application/json' -d '{"items":[{"slug":"war-criminal","quantity":1}]}'
echo "=== valid cart, no key (expect 503) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/checkout -H 'Content-Type: application/json' -d '{"items":[{"slug":"protect-trans-kids","quantity":2}]}'
pkill -f "tsx src/index.ts"; cd ..
```

Expected: `400`, `400`, `409`, `503`. (With a test key set, the last returns 200 + a `checkout.stripe.com` URL.)

- [ ] **Step 3.4: Commit**

```bash
git add backend/src/routes/checkout.ts backend/src/index.ts
git commit -m "feat(backend): POST /api/checkout — re-price + Stripe session

Validates the cart and re-prices every line from the DB (unknown slug 400,
sold-out 409) before checking Stripe config (503). Builds inline price_data
line items, stashes a snapshot in session metadata, returns the session URL."
```

---

## Task 4: Stripe webhook

**Files:**

- Create: `backend/src/routes/stripe-webhook.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 4.1: Create the webhook handler**

```ts
// backend/src/routes/stripe-webhook.ts
import type { Request, Response } from "express";
import type Stripe from "stripe";
import { getStripe } from "../payments/stripe.js";
import { env } from "../env.js";
import { insertPaidOrder, type OrderItem } from "../orders/queries.js";

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
    await insertPaidOrder({
      stripeSessionId: session.id,
      email: session.customer_details?.email ?? null,
      items,
      totalCents: session.amount_total ?? 0,
    });
  }

  res.status(200).json({ received: true });
}
```

- [ ] **Step 4.2: Mount BEFORE `express.json()` in `index.ts`**

Add the import:

```ts
import { stripeWebhookHandler } from "./routes/stripe-webhook.js";
```

Between the `cors` middleware and `app.use(express.json(...))`, insert:

```ts
// Stripe webhook needs the raw body for signature verification — must be
// registered before the JSON body parser consumes it.
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

app.use(express.json({ limit: "1mb" }));
```

(The existing `app.use(express.json(...))` line stays; the webhook line goes immediately above it.)

- [ ] **Step 4.3: Build + verify the unconfigured path**

```bash
npm run build --workspace backend 2>&1 | tail -2
cd backend && npx tsx src/index.ts > /tmp/p5-t4.log 2>&1 & sleep 3
echo "=== webhook, no secret (expect 503) ===" && curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/webhooks/stripe -H 'Content-Type: application/json' -d '{}'
echo "=== public products still 200 ===" && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/products
pkill -f "tsx src/index.ts"; cd ..
```

Expected: `503` (no webhook secret locally), `200` (the raw-body mount didn't break JSON routes).

With test keys + the Stripe CLI, the full check is:
`stripe listen --forward-to localhost:4000/api/webhooks/stripe`, then
`stripe trigger checkout.session.completed` → one new `orders` row; re-triggering
the same event id inserts no duplicate. A tampered body → 400.

- [ ] **Step 4.4: Commit**

```bash
git add backend/src/routes/stripe-webhook.ts backend/src/index.ts
git commit -m "feat(backend): POST /api/webhooks/stripe — paid order on completion

Raw-body, signature-verified webhook (mounted before express.json). On
checkout.session.completed it inserts a paid order from the session
metadata snapshot + amount_total; idempotent on retries. 503 when the
webhook secret isn't set, 400 on a bad signature."
```

---

## Task 5: Frontend — checkout button + success/cancel routes

**Files:**

- Modify: `web/src/components/CartDrawer.vue`, `web/src/router/index.ts`
- Create: `web/src/views/CheckoutSuccessView.vue`, `web/src/views/CheckoutCancelView.vue`

- [ ] **Step 5.1: Real checkout in `CartDrawer.vue`**

Replace the stub `showCheckoutNote`/`onCheckout` script with an async POST + redirect:

```ts
const checkoutError = ref("");

async function onCheckout() {
  checkoutError.value = "";
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
      }),
    });
    if (res.status === 503) {
      checkoutError.value = "Checkout isn't wired up yet.";
      return;
    }
    if (!res.ok) {
      const data = await res
        .json()
        .catch(() => ({ message: "Checkout failed." }));
      checkoutError.value = data.message ?? "Checkout failed.";
      return;
    }
    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
  } catch {
    checkoutError.value = "Checkout failed. Try again.";
  }
}
```

Remove the `showCheckoutNote` ref. Replace the footer note element:

```html
<p v-if="checkoutError" class="note">{{ checkoutError }}</p>
```

And recolor `.note` to the warning color:

```css
.note {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  color: var(--color-acid-red);
  margin: 0;
}
```

- [ ] **Step 5.2: Create `CheckoutSuccessView.vue`**

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { useCartStore } from "../stores/cart";

const cart = useCartStore();
onMounted(() => cart.clear());
</script>

<template>
  <main class="result">
    <h1 class="title">Dug up &amp; on its way</h1>
    <p class="body">
      Payment went through. Your goods are being pulled from the crypt — a
      receipt's on its way to your inbox.
    </p>
    <a href="/" class="btn">Back to the shop</a>
  </main>
</template>

<style scoped>
.result {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
  background: var(--color-pitch);
  padding: clamp(1.5rem, 6vw, 4rem);
  width: min(640px, 92vw);
  margin: 0 auto;
}
.title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  color: var(--color-bone);
  margin: 0;
}
.body {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-bone);
  margin: 0;
}
.btn {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 0.7rem 1.1rem;
  text-decoration: none;
}
</style>
```

- [ ] **Step 5.3: Create `CheckoutCancelView.vue`**

```vue
<script setup lang="ts"></script>

<template>
  <main class="result">
    <h1 class="title">Changed your mind?</h1>
    <p class="body">
      Payment cancelled — your cart's intact. No hard feelings.
    </p>
    <a href="/" class="btn">Back to the shop</a>
  </main>
</template>

<style scoped>
.result {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
  background: var(--color-pitch);
  padding: clamp(1.5rem, 6vw, 4rem);
  width: min(640px, 92vw);
  margin: 0 auto;
}
.title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  color: var(--color-bone);
  margin: 0;
}
.body {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-bone);
  margin: 0;
}
.btn {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 0.7rem 1.1rem;
  text-decoration: none;
}
</style>
```

- [ ] **Step 5.4: Add the routes**

In `web/src/router/index.ts`, add to the `routes` array (after the storefront route):

```ts
    {
      path: "/checkout/success",
      name: "checkout-success",
      component: () => import("../views/CheckoutSuccessView.vue"),
    },
    {
      path: "/checkout/cancel",
      name: "checkout-cancel",
      component: () => import("../views/CheckoutCancelView.vue"),
    },
```

- [ ] **Step 5.5: Build + in-browser check**

```bash
npm run build --workspace web 2>&1 | tail -3
npm run dev
```

At `http://localhost:5173` (no Stripe keys): add an item, open the cart, click
**Checkout** → the inline note reads "Checkout isn't wired up yet." (503 path).
Visit `/checkout/success` directly → the cart clears and the confirmation shows;
`/checkout/cancel` → the cancel message. With test keys set, Checkout instead
redirects to Stripe; a completed test payment returns to `/checkout/success`.
Stop the dev server.

- [ ] **Step 5.6: Commit**

```bash
git add web/src/components/CartDrawer.vue web/src/router/index.ts web/src/views/CheckoutSuccessView.vue web/src/views/CheckoutCancelView.vue
git commit -m "feat(web): real checkout POST + success/cancel routes

CartDrawer's Checkout posts the cart to /api/checkout and redirects to the
returned Stripe URL (inline message on 503/error). Adds /checkout/success
(clears the cart) and /checkout/cancel."
```

---

## Self-Review notes

**Spec coverage:**

- Migration 004 + JSONB items (§Data model) → Task 1
- `insertPaidOrder` idempotent (§Order persistence) → Task 1
- Stripe SDK + env + client (§Config, §Stripe client) → Task 2
- `POST /api/checkout` re-price + 400/409/503 + session (§Checkout) → Task 3
- Raw-body webhook + signature + paid-order insert (§Webhook, §index wiring) → Task 4
- CartDrawer checkout + success/cancel routes (§Frontend) → Task 5
- Acceptance items 1–9 → Tasks 1 (migrate), 3 (validation curls), 4 (webhook), 5 (in-browser)

**Placeholder scan:** No "TBD"/"TODO". All code complete; commands have expected output. Live-path steps (URL return, webhook insert, Stripe redirect) are explicitly gated on test keys, not left vague.

**Type consistency:** `OrderItem` (Task 1) is the snapshot shape built in checkout (Task 3) and parsed in the webhook (Task 4) and stored by `insertPaidOrder` (Task 1). `isConfigured`/`getStripe` (Task 2) are used by checkout (Task 3) and the webhook (Task 4). `getProductBySlug` (Phase 2) returns `priceCents/title/imageUrl/isSoldOut` used in Task 3. The checkout request body `{ items: [{slug, quantity}] }` (Task 3) matches what CartDrawer sends (Task 5).
