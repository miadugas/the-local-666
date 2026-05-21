import { createHash } from "node:crypto";
import { env } from "../env.js";

export function isConfigured(): boolean {
  return Boolean(
    env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret,
  );
}

export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export function signUpload(): SignedUpload {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = env.cloudinaryFolder;
  // Cloudinary signed-upload: sha1 of params sorted by key as key=value&...,
  // with the api_secret appended. Here: folder, then timestamp (already sorted).
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(toSign + env.cloudinaryApiSecret)
    .digest("hex");

  return {
    cloudName: env.cloudinaryCloudName as string,
    apiKey: env.cloudinaryApiKey as string,
    timestamp,
    folder,
    signature,
  };
}
