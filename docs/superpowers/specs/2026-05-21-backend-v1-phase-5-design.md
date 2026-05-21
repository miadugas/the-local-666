# Backend v1 — Phase 5: Stripe hosted Checkout + webhook + orders

**Date:** 2026-05-21
**Status:** Approved (design)
**Depends on:** Phase 2 (product DB) + Phase 4 (cart) — complete.

## Goal

Turn the stubbed Checkout button into a real purchase: POST the cart to the
backend, re-price it from the database, create a Stripe hosted Checkout session,
and persist a paid order when Stripe's webhook confirms payment. Guest checkout
only — no customer accounts.

## Scope

**In scope**

- `stripe` SDK + `STRIPE_*` env (optional, like Cloudinary)
- Migration 004: `orders` table (single table, JSONB line items)
- `POST /api/checkout` — re-price from DB, create a Checkout session, return its URL
- `POST /api/webhooks/stripe` — raw-body, signature-verified, inserts a paid order
- Frontend: wire CartDrawer's Checkout button; `/checkout/success` + `/checkout/cancel` routes

**Out of scope**

- Order-confirmation email (Phase 6)
- An admin orders view, refunds, partial fulfillment
- Inventory decrement / stock tracking
- Customer accounts, saved payment methods
- Discounts, shipping rates, tax calculation (flat catalog for now)

## Confirmed decisions

- **Order model:** one `orders` table; line items in a JSONB column as an
  immutable snapshot.
- **Order timing:** created only on `checkout.session.completed` (paid). No
  pending rows.
- **SDK:** official `stripe` Node package (session creation + webhook verification).
- **Re-pricing:** the server trusts only `{ slug, quantity }` from the client and
  prices every line from the DB. Missing slug → 400; sold-out → 409.
- **Webhook idempotency:** `ON CONFLICT (stripe_session_id) DO NOTHING`.
- **Stripe keys:** test-mode `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in
  `backend/.env` for the live test; code is written/committed without them.

## Data model

### Migration `backend/src/db/migrations/004_orders.sql`

```sql
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

`items` shape: `[{ slug, title, quantity, unitPriceCents }]`.

## Backend

### Config — `backend/src/env.ts` + `.env.example`

Add nullable fields:

```ts
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? null,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
```

`.env.example` documents both. The frontend origin for redirect URLs is the
existing `env.frontendUrl`.

### Stripe client — `backend/src/payments/stripe.ts`

```ts
export function isConfigured(): boolean; // STRIPE_SECRET_KEY present
export function getStripe(): Stripe; // singleton; throws if unconfigured
```

### Checkout — `backend/src/routes/checkout.ts` → `POST /api/checkout` (public)

1. If `!isConfigured()` → **503** `{ message: "Checkout is not configured" }`.
2. Validate `items: { slug, quantity }[]` non-empty; each quantity a positive integer → else **400**.
3. For each item, fetch the product by slug (DB). Missing → **400**
   `{ message: "Unknown product: <slug>" }`. `is_sold_out` → **409**
   `{ message: "<title> is sold out" }`.
4. Build Stripe `line_items` from inline `price_data`: `currency: "usd"`,
   `product_data: { name: title, images: [imageUrl] if absolute }`,
   `unit_amount: priceCents`, `quantity`.
5. Create the session: `mode: "payment"`, the line items, `success_url:
${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
   `cancel_url: ${frontendUrl}/checkout/cancel`, and `metadata.items =
JSON.stringify([{ slug, title, quantity, unitPriceCents }])`. Stripe collects
   the email in hosted checkout.
6. Return `{ url: session.url }`.

Queries reuse the existing `getProductBySlug` (Phase 2) which already returns
`isSoldOut`, `priceCents`, `title`, `imageUrl`.

### Webhook — `backend/src/routes/stripe-webhook.ts` → `POST /api/webhooks/stripe`

- Mounted with `express.raw({ type: "application/json" })` **before** the global
  `express.json()` in `index.ts`, so the raw body is available for signature
  verification.
- If `!stripeWebhookSecret` → **503**.
- Verify with `stripe.webhooks.constructEvent(rawBody, sig, secret)`; bad signature
  → **400**.
- On `checkout.session.completed`: insert an order — `stripe_session_id =
session.id`, `email = session.customer_details?.email ?? null`, `items =
JSON.parse(session.metadata.items)`, `total_cents = session.amount_total`,
  `status = "paid"` — with `ON CONFLICT (stripe_session_id) DO NOTHING` (retries).
- Always respond **200** to acknowledged events (so Stripe stops retrying).

### `index.ts` wiring

```ts
app.use(cookieParser());
app.use(cors({ origin: env.frontendUrl, credentials: true }));

// Stripe webhook needs the raw body — register BEFORE express.json().
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

app.use(express.json({ limit: "1mb" }));
// ...existing routers...
app.use(checkoutRouter);
```

### Order persistence — `backend/src/orders/queries.ts`

```ts
type OrderItem = {
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
}): Promise<void>; // ON CONFLICT (stripe_session_id) DO NOTHING
```

## Frontend

### CartDrawer checkout

`onCheckout` becomes async: POST `/api/checkout` with
`{ items: cart.items.map(i => ({ slug: i.slug, quantity: i.quantity })) }`.
On `{ url }` → `window.location.href = url`. On 503 → "Checkout isn't wired up
yet." On other errors → a generic inline message. The "next drop" stub note is
removed.

### Routes (public) — `web/src/router/index.ts`

```
/checkout/success → CheckoutSuccessView   (clears the cart, thematic confirmation)
/checkout/cancel  → CheckoutCancelView     ("payment cancelled — your cart's intact")
```

`CheckoutSuccessView` calls `cart.clear()` on mount. Neither route is guarded.

## Error handling

- Checkout: 503 (unconfigured), 400 (empty/invalid items, unknown slug), 409 (sold out).
- Webhook: 503 (no secret), 400 (bad signature), 200 (handled / ignored event types).
- Frontend: inline message on checkout failure; the cart is preserved (Stripe
  redirect only happens on success).

## Testing / acceptance

**Backend (curl + Stripe CLI):**

1. Migration 004 applies; `orders` table exists.
2. `POST /api/checkout` with no Stripe key → 503.
3. With a test key: empty items → 400; unknown slug → 400; a sold-out slug
   (`war-criminal`) → 409; a valid cart → `{ url }` (a `checkout.stripe.com` URL).
4. `POST /api/webhooks/stripe` with a bad signature → 400.
5. `stripe listen --forward-to localhost:4000/api/webhooks/stripe` + completing a
   test checkout (or `stripe trigger checkout.session.completed`) inserts one
   `orders` row; replaying the event inserts no duplicate.
6. Root build green.

**Frontend (in-browser, test keys set):** 7. Add items, open the cart, click Checkout → redirected to Stripe test checkout. 8. Complete payment with a test card → redirected to `/checkout/success`; the cart
is empty; an order row exists. 9. Cancel at Stripe → `/checkout/cancel`; the cart is intact.

## File summary

**Create (backend)**

- `backend/src/db/migrations/004_orders.sql`
- `backend/src/payments/stripe.ts`
- `backend/src/orders/queries.ts`
- `backend/src/routes/checkout.ts`
- `backend/src/routes/stripe-webhook.ts`

**Modify (backend)**

- `backend/src/env.ts`, `backend/.env.example`
- `backend/src/index.ts` (raw webhook mount + checkout router)

**Create (frontend)**

- `web/src/views/CheckoutSuccessView.vue`
- `web/src/views/CheckoutCancelView.vue`

**Modify (frontend)**

- `web/src/router/index.ts` (two routes)
- `web/src/components/CartDrawer.vue` (real checkout POST + redirect)

## Roadmap pointer

- **Phase 6:** Resend order-confirmation email — the webhook handler, after
  inserting the order, sends a receipt to `email`. This is the last phase.
- The Phase 3 hard-delete of products should be revisited now that `orders.items`
  snapshots product data: deleting a product no longer corrupts past orders
  (items are snapshotted), so hard-delete remains safe.
