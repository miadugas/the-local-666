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
