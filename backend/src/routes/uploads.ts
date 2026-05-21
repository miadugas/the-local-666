import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { isConfigured, signUpload } from "../uploads/cloudinary.js";

export const uploadsRouter = Router();

uploadsRouter.post("/api/admin/uploads/sign", requireAuth, (_req, res) => {
  if (!isConfigured()) {
    res.status(503).json({ message: "Image uploads are not configured" });
    return;
  }
  res.json(signUpload());
});
