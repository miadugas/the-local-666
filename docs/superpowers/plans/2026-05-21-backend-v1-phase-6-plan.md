# Backend v1 Phase 6 — Resend Order-Confirmation Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the Stripe webhook records a paid order, email the customer a receipt via Resend — best-effort and only on a fresh insert.

**Architecture:** `insertPaidOrder` reports whether it actually inserted; the webhook, on a fresh insert with an email and a configured Resend key, sends a confirmation through a small email module — wrapped in try/catch so a send failure never blocks the webhook's 200.

**Tech Stack:** Express 5 (ESM), Postgres (`pg`), `stripe`, `resend`; TypeScript 6.

**Verification approach:** No test runner. Verify via `npm run build`, `psql` (the ON CONFLICT boolean semantics), and `curl` (webhook still 503 unconfigured). The live email send needs a Resend API key + the Phase 5 Stripe keys + the Stripe CLI — flagged, not run here.

**Source spec:** `docs/superpowers/specs/2026-05-21-backend-v1-phase-6-design.md`

---

## File Structure

**Create:** `backend/src/emails/orderConfirmation.ts`
**Modify:** `backend/src/orders/queries.ts` (return boolean), `backend/src/env.ts`, `backend/.env.example`, `backend/src/routes/stripe-webhook.ts`

---

## Task 1: `insertPaidOrder` boolean + Resend client + email module

**Files:**

- Modify: `backend/src/orders/queries.ts`, `backend/src/env.ts`, `backend/.env.example`, `backend/package.json` (via install)
- Create: `backend/src/emails/orderConfirmation.ts`

- [ ] **Step 1.1: `insertPaidOrder` returns whether it inserted**

In `backend/src/orders/queries.ts`, change the function to return a boolean:

```ts
export async function insertPaidOrder(input: {
  stripeSessionId: string;
  email: string | null;
  items: OrderItem[];
  totalCents: number;
}): Promise<boolean> {
  const result = await pool.query(
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
  return (result.rowCount ?? 0) > 0;
}
```

- [ ] **Step 1.2: Install the Resend SDK**

```bash
npm install resend --workspace backend
```

- [ ] **Step 1.3: Add env vars**

In `backend/src/env.ts`, add to the `env` object (after `stripeWebhookSecret`):

```ts
  resendApiKey: process.env.RESEND_API_KEY ?? null,
  emailFrom: optional("EMAIL_FROM", "Grave Goods <orders@gravegoodsgoodies.com>"),
```

Append to `backend/.env.example`:

```bash

# Resend (optional — order-confirmation email is skipped until the key is set)
RESEND_API_KEY=
EMAIL_FROM=Grave Goods <orders@gravegoodsgoodies.com>
```

- [ ] **Step 1.4: Create the email module**

```ts
// backend/src/emails/orderConfirmation.ts
import { Resend } from "resend";
import { env } from "../env.js";
import type { OrderItem } from "../orders/queries.js";

export function isConfigured(): boolean {
  return Boolean(env.resendApiKey);
}

let client: Resend | null = null;

function getResend(): Resend {
  if (!env.resendApiKey) {
    throw new Error("Resend is not configured (RESEND_API_KEY missing)");
  }
  if (!client) {
    client = new Resend(env.resendApiKey);
  }
  return client;
}

function formatCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendOrderConfirmation(input: {
  email: string;
  items: OrderItem[];
  totalCents: number;
}): Promise<void> {
  const rows = input.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px 6px 0;">${escapeHtml(i.title)} &times; ${i.quantity}</td>` +
        `<td style="padding:6px 0;text-align:right;">${formatCents(i.unitPriceCents * i.quantity)}</td></tr>`,
    )
    .join("");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111;">
  <h1 style="font-size:22px;margin:0 0 4px;">Thanks — your goods are summoned.</h1>
  <p style="font-size:14px;color:#444;margin:0 0 20px;">Payment cleared. Here's what's clawing its way to you:</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td style="padding:10px 12px 0 0;border-top:2px solid #111;font-weight:bold;">Total</td>
        <td style="padding:10px 0 0;border-top:2px solid #111;text-align:right;font-weight:bold;">${formatCents(input.totalCents)}</td>
      </tr>
    </tfoot>
  </table>
  <p style="font-size:13px;color:#666;margin:24px 0 0;">Packed and shipped from home — give it a few days to reach you.</p>
  <p style="font-size:13px;color:#666;margin:16px 0 0;">— Grave Goods</p>
</div>`;

  const text =
    `Thanks — your goods are summoned. Payment cleared.\n\n` +
    input.items
      .map(
        (i) =>
          `${i.title} x ${i.quantity} — ${formatCents(i.unitPriceCents * i.quantity)}`,
      )
      .join("\n") +
    `\n\nTotal: ${formatCents(input.totalCents)}\n\n` +
    `Packed and shipped from home — give it a few days.\n— Grave Goods`;

  await getResend().emails.send({
    from: env.emailFrom,
    to: input.email,
    subject: "Your Grave Goods order",
    html,
    text,
  });
}
```

- [ ] **Step 1.5: Build**

```bash
npm run build --workspace backend 2>&1 | tail -2
```

Expected: success (the `resend` package ships its own types).

- [ ] **Step 1.6: Verify the ON CONFLICT boolean semantics (psql)**

`insertPaidOrder` returns `rowCount > 0`. Confirm Postgres reports 0 affected rows on a conflicting insert:

```bash
psql -d grave_goods -c "INSERT INTO orders (stripe_session_id, email, items, total_cents) VALUES ('test_sess_p6','x@example.com','[]'::jsonb,400) ON CONFLICT (stripe_session_id) DO NOTHING"
psql -d grave_goods -c "INSERT INTO orders (stripe_session_id, email, items, total_cents) VALUES ('test_sess_p6','x@example.com','[]'::jsonb,400) ON CONFLICT (stripe_session_id) DO NOTHING"
psql -d grave_goods -c "DELETE FROM orders WHERE stripe_session_id = 'test_sess_p6'"
```

Expected: the first prints `INSERT 0 1` (→ `insertPaidOrder` would return true), the second `INSERT 0 0` (→ false), then `DELETE 1`.

- [ ] **Step 1.7: Commit**

```bash
git add backend/src/orders/queries.ts backend/src/env.ts backend/.env.example backend/package.json package-lock.json backend/src/emails/orderConfirmation.ts
git commit -m "feat(backend): Resend client + order-confirmation email + insert reports inserted

insertPaidOrder now returns whether a row was inserted (false on conflict).
Adds the resend SDK, optional RESEND_API_KEY/EMAIL_FROM env, and
sendOrderConfirmation (light HTML + text receipt). Not wired yet."
```

---

## Task 2: Send the email from the webhook

**Files:**

- Modify: `backend/src/routes/stripe-webhook.ts`

- [ ] **Step 2.1: Import the email module**

In `backend/src/routes/stripe-webhook.ts`, add below the existing imports:

```ts
import {
  isConfigured as emailIsConfigured,
  sendOrderConfirmation,
} from "../emails/orderConfirmation.js";
```

- [ ] **Step 2.2: Send on a fresh insert (best-effort)**

Replace the `checkout.session.completed` block's insert call:

```ts
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
```

- [ ] **Step 2.3: Build + verify the webhook still responds**

```bash
npm run build --workspace backend 2>&1 | tail -2
cd backend && npx tsx src/index.ts > /tmp/p6-t2.log 2>&1 & sleep 3
echo "webhook-unconfigured:$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:4000/api/webhooks/stripe -H 'Content-Type: application/json' -d '{}')"
echo "products:$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/api/products)"
pkill -f "tsx src/index.ts"; cd ..
```

Expected: `503` (no webhook secret locally) and `200` (the app is otherwise healthy). With Resend + Stripe test keys + `stripe listen`/`trigger`, completing a test checkout sends exactly one confirmation email; replaying the event sends none.

- [ ] **Step 2.4: Full root build**

```bash
npm run build 2>&1 | tail -4
```

Expected: all three workspaces build clean.

- [ ] **Step 2.5: Commit**

```bash
git add backend/src/routes/stripe-webhook.ts
git commit -m "feat(backend): email order confirmation from the webhook

On checkout.session.completed, when the order is freshly inserted and an
email + Resend key are present, send the confirmation — best-effort, in a
try/catch so a send failure never blocks the webhook 200."
```

---

## Self-Review notes

**Spec coverage:**

- `insertPaidOrder` returns boolean (§Changes) → Task 1
- Resend SDK + env (§Config) → Task 1
- `sendOrderConfirmation` HTML/text receipt (§Email module) → Task 1
- Webhook conditional best-effort send (§Webhook wiring) → Task 2
- Acceptance items 1–4 → Task 1 (psql boolean, build), Task 2 (webhook 503, full build)

**Placeholder scan:** No "TBD"/"TODO". The email HTML/text are complete strings; live-send steps are explicitly gated on keys, not vague.

**Type consistency:** `OrderItem` (Phase 5, `orders/queries.ts`) is consumed by `sendOrderConfirmation` (Task 1) and passed from the webhook (Task 2). `insertPaidOrder`'s new `Promise<boolean>` return is consumed as `inserted` (Task 2). The email module exports `isConfigured` (imported as `emailIsConfigured` in the webhook) + `sendOrderConfirmation`, matching the spec. `env.resendApiKey`/`env.emailFrom` (Task 1) are used by the email module.
