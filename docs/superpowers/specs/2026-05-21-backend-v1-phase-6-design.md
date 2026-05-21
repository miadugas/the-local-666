# Backend v1 — Phase 6 (final): Resend order-confirmation email

**Date:** 2026-05-21
**Status:** Approved (design)
**Depends on:** Phase 5 (Stripe checkout + webhook + orders) — complete.

## Goal

After the Stripe webhook records a paid order, email the customer a receipt via
Resend. Best-effort and idempotent — a failed or duplicate webhook never sends a
duplicate or blocks payment acknowledgement. This is the last phase of Backend v1.

## Scope

**In scope**

- `resend` SDK + `RESEND_API_KEY` / `EMAIL_FROM` env (optional, like Stripe/Cloudinary)
- `insertPaidOrder` returns whether a row was actually inserted
- `sendOrderConfirmation` — a clean HTML + plain-text receipt
- Webhook wiring: email only on a fresh insert, best-effort, never blocking the 200

**Out of scope**

- Admin order-notification emails
- Shipping / tracking / fulfillment emails
- An email templating engine or design system for email
- An email queue / retry mechanism (Resend + Stripe's webhook retries suffice)
- Storing email-sent state on the order

## Confirmed decisions

- **(a)** Email only when `insertPaidOrder` actually inserts a row (idempotent — no
  duplicate emails on Stripe's webhook retries).
- **(b)** Best-effort: a Resend failure is logged; the webhook still returns 200 so
  Stripe does not retry a _paid_ order over an email hiccup.
- **(c)** The email is a clean, light, standard receipt with inline styles — **not**
  the dark site theme (email clients render dark CSS poorly). Brand voice lives in
  the copy.
- **(d)** `RESEND_API_KEY` + `EMAIL_FROM` are optional env; if unconfigured or the
  order has no email, sending is skipped + logged. A custom `EMAIL_FROM` domain must
  be verified in Resend; `onboarding@resend.dev` works for testing.

## Changes

### `backend/src/orders/queries.ts` — `insertPaidOrder` returns `boolean`

Change the return type to `Promise<boolean>` — `true` when a row was inserted,
`false` when `ON CONFLICT (stripe_session_id) DO NOTHING` skipped it:

```ts
export async function insertPaidOrder(input: { ... }): Promise<boolean> {
  const result = await pool.query(/* same INSERT ... ON CONFLICT DO NOTHING */, [...]);
  return (result.rowCount ?? 0) > 0;
}
```

### Config — `backend/src/env.ts` + `.env.example`

```ts
  resendApiKey: process.env.RESEND_API_KEY ?? null,
  emailFrom: optional("EMAIL_FROM", "Grave Goods <orders@gravegoodsgoodies.com>"),
```

`.env.example` documents both. `EMAIL_FROM` has a default so it's always a string;
sending is gated only on `RESEND_API_KEY`.

### Email module — `backend/src/emails/orderConfirmation.ts`

```ts
export function isConfigured(): boolean; // RESEND_API_KEY present; webhook imports this as emailIsConfigured
export async function sendOrderConfirmation(input: {
  email: string;
  items: OrderItem[]; // reused from ../orders/queries
  totalCents: number;
}): Promise<void>; // throws on Resend API error (caller catches)
```

- Lazily builds a singleton Resend client from `RESEND_API_KEY`.
- Renders a receipt: a thank-you line in Grave Goods voice, a table of item rows
  (`title × qty — formatted line total`), the grand total, and a "packed and
  shipped from home — give it a few days" note. Inline styles, light background.
- Subject: `Your Grave Goods order`. From: `env.emailFrom`. To: `input.email`.
- A shared cents→`$X.YY` formatter lives in this module (the frontend's
  `formatPrice` is web-only; the backend keeps a tiny local one).

### Webhook wiring — `backend/src/routes/stripe-webhook.ts`

After computing `items`, capture the insert result and send conditionally:

```ts
const inserted = await insertPaidOrder({ ... });
const email = session.customer_details?.email ?? null;
if (inserted && email && emailIsConfigured()) {
  try {
    await sendOrderConfirmation({ email, items, totalCents: session.amount_total ?? 0 });
  } catch (err) {
    console.error("[email] order confirmation failed", err);
  }
}
```

The `200 { received: true }` response is unchanged and always sent.

## Error handling

- Resend not configured, or no order email → skip + (for "not configured") an
  optional debug log; webhook still 200.
- Resend API error → caught, logged, webhook still 200.
- Duplicate webhook delivery → `insertPaidOrder` returns false → no email.

## Testing / acceptance

1. `insertPaidOrder` returns `true` on first insert, `false` on a duplicate
   `stripe_session_id` (verify via a small psql round-trip or the webhook replay).
2. Webhook with no `RESEND_API_KEY` set → order still inserted, log notes the
   email was skipped, response 200.
3. With `RESEND_API_KEY` + Stripe test keys: completing a test checkout inserts the
   order and sends one confirmation email to the address entered at Stripe;
   replaying the event sends no second email.
4. `npm run build` green across workspaces.

## File summary

**Create**

- `backend/src/emails/orderConfirmation.ts`

**Modify**

- `backend/src/orders/queries.ts` (return `boolean`)
- `backend/src/env.ts`, `backend/.env.example` (Resend vars)
- `backend/src/routes/stripe-webhook.ts` (conditional best-effort send)

## Roadmap pointer

This completes Backend v1 (all six phases). Remaining pre-launch items live
outside this phased build: self-hosting fonts, normalizing sticker images
(Cloudinary), real prices/specs from Sticky Brand, verifying the `EMAIL_FROM`
domain in Resend, and deploying to the_litterbox behind the Cloudflare Tunnel.
