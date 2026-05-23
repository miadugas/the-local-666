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
  const rowsSubtotal = input.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const discountCents = rowsSubtotal - input.totalCents;
  const rows = input.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px 6px 0;">${escapeHtml(i.title)} &times; ${i.quantity}</td>` +
        `<td style="padding:6px 0;text-align:right;">${formatCents(i.unitPriceCents * i.quantity)}</td></tr>`,
    )
    .join("");
  const discountRows =
    discountCents > 0
      ? `<tr>
        <td style="padding:10px 12px 0 0;border-top:2px solid #111;">Subtotal</td>
        <td style="padding:10px 0 0;border-top:2px solid #111;text-align:right;">${formatCents(rowsSubtotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px 0 0;">Bundle discount</td>
        <td style="padding:6px 0 0;text-align:right;">-${formatCents(discountCents)}</td>
      </tr>`
      : "";
  const totalBorder = discountCents > 0 ? "" : "border-top:2px solid #111;";
  const textDiscount =
    discountCents > 0
      ? `\n\nSubtotal: ${formatCents(rowsSubtotal)}\nBundle discount: -${formatCents(discountCents)}`
      : "";

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111;">
  <h1 style="font-size:22px;margin:0 0 4px;">Thanks — your goods are summoned.</h1>
  <p style="font-size:14px;color:#444;margin:0 0 20px;">Payment cleared. Here's what's clawing its way to you:</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tbody>${rows}</tbody>
    <tfoot>
      ${discountRows}
      <tr>
        <td style="padding:10px 12px 0 0;${totalBorder}font-weight:bold;">Total</td>
        <td style="padding:10px 0 0;${totalBorder}text-align:right;font-weight:bold;">${formatCents(input.totalCents)}</td>
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
    `${textDiscount}\n\nTotal: ${formatCents(input.totalCents)}\n\n` +
    `Packed and shipped from home — give it a few days.\n— Grave Goods`;

  await getResend().emails.send({
    from: env.emailFrom,
    to: input.email,
    subject: "Your Grave Goods order",
    html,
    text,
  });
}
