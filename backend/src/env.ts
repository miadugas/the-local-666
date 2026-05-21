import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  loadDotenv({ path: envPath });
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : fallback;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  port: Number(optional("PORT", "4000")),
  frontendUrl: optional("FRONTEND_URL", "http://localhost:5173"),
  adminEmail: process.env.ADMIN_EMAIL?.trim() ?? null,
  adminPassword: process.env.ADMIN_PASSWORD ?? null,
  adminFullName: optional("ADMIN_FULL_NAME", "Store Admin"),
  nodeEnv: optional("NODE_ENV", "development"),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? null,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() ?? null,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? null,
  cloudinaryFolder: optional("CLOUDINARY_FOLDER", "grave-goods"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? null,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
  resendApiKey: process.env.RESEND_API_KEY ?? null,
  emailFrom: optional(
    "EMAIL_FROM",
    "Grave Goods <orders@gravegoodsgoodies.com>",
  ),
};

export const isDev = env.nodeEnv !== "production";
