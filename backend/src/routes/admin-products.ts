import { Router, type Response } from "express";
import { validateSalePrice } from "@grave-goods/shared";
import { requireAuth } from "../auth/middleware.js";
import {
  listAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  type CreateProductInput,
  type UpdateProductInput,
} from "../products/admin-queries.js";

export const adminProductsRouter = Router();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

function parseSalePriceCents(
  value: unknown,
  res: Response,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const salePriceCents = Number(value);
  if (!Number.isInteger(salePriceCents)) {
    res
      .status(400)
      .json({ message: "salePriceCents must be an integer or null" });
    return undefined;
  }
  return salePriceCents;
}

function parseSaleLabel(
  value: unknown,
  res: Response,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const saleLabel = String(value).trim();
  if (saleLabel.length > 50) {
    res
      .status(400)
      .json({ message: "saleLabel must be 50 characters or less" });
    return undefined;
  }
  return saleLabel || null;
}

function parseSaleEndsAt(
  value: unknown,
  res: Response,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const saleEndsAt = String(value).trim();
  const timestamp = Date.parse(saleEndsAt);
  if (!saleEndsAt || Number.isNaN(timestamp) || timestamp <= Date.now()) {
    res
      .status(400)
      .json({ message: "saleEndsAt must be a future ISO timestamp or null" });
    return undefined;
  }
  return saleEndsAt;
}

function validateFinalSale(
  salePriceCents: number | null,
  priceCents: number,
  res: Response,
): boolean {
  if (salePriceCents === null) return true;

  const validation = validateSalePrice(salePriceCents);
  if (!validation.ok) {
    res.status(400).json({ message: validation.reason });
    return false;
  }
  if (salePriceCents >= priceCents) {
    res.status(400).json({ message: "Sale price must be below priceCents" });
    return false;
  }
  return true;
}

adminProductsRouter.get(
  "/api/admin/products",
  requireAuth,
  async (_req, res) => {
    res.json(await listAdminProducts());
  },
);

adminProductsRouter.post(
  "/api/admin/products",
  requireAuth,
  async (req, res) => {
    const b = req.body ?? {};
    const title = String(b.title ?? "").trim();
    if (!title) {
      res.status(400).json({ message: "Title is required" });
      return;
    }
    const slug = b.slug ? slugify(String(b.slug)) : slugify(title);
    if (!slug) {
      res
        .status(400)
        .json({ message: "Could not derive a slug from the title" });
      return;
    }
    const priceCents = Number(b.priceCents);
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      res
        .status(400)
        .json({ message: "priceCents must be a non-negative integer" });
      return;
    }
    const imageUrl = String(b.imageUrl ?? "").trim();
    if (!imageUrl) {
      res.status(400).json({ message: "imageUrl is required" });
      return;
    }
    const salePriceCents = parseSalePriceCents(b.salePriceCents, res);
    if (b.salePriceCents !== undefined && salePriceCents === undefined) return;
    const saleLabel = parseSaleLabel(b.saleLabel, res);
    if (b.saleLabel !== undefined && saleLabel === undefined) return;
    const saleEndsAt = parseSaleEndsAt(b.saleEndsAt, res);
    if (b.saleEndsAt !== undefined && saleEndsAt === undefined) return;

    const finalSalePriceCents = salePriceCents ?? null;
    if (!validateFinalSale(finalSalePriceCents, priceCents, res)) return;

    const input: CreateProductInput = {
      slug,
      title,
      spec: String(b.spec ?? "").trim(),
      priceCents,
      salePriceCents: finalSalePriceCents,
      saleLabel,
      saleEndsAt,
      accentHex: String(b.accentHex ?? "").trim(),
      description: b.description ? String(b.description) : null,
      isSoldOut: Boolean(b.isSoldOut),
      displayOrder: Number.isInteger(Number(b.displayOrder))
        ? Number(b.displayOrder)
        : 0,
      imageUrl,
      imagePublicId: b.imagePublicId ? String(b.imagePublicId) : null,
    };

    try {
      res.status(201).json(await createProduct(input));
    } catch (err) {
      if (isUniqueViolation(err)) {
        res
          .status(409)
          .json({ message: "A product with that slug already exists" });
        return;
      }
      throw err;
    }
  },
);

adminProductsRouter.patch(
  "/api/admin/products/:id",
  requireAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const input: UpdateProductInput = {};
    if (b.title !== undefined) input.title = String(b.title);
    if (b.slug !== undefined) input.slug = slugify(String(b.slug));
    if (b.spec !== undefined) input.spec = String(b.spec);
    if (b.priceCents !== undefined) {
      const pc = Number(b.priceCents);
      if (!Number.isInteger(pc) || pc < 0) {
        res
          .status(400)
          .json({ message: "priceCents must be a non-negative integer" });
        return;
      }
      input.priceCents = pc;
    }
    if (b.accentHex !== undefined) input.accentHex = String(b.accentHex);
    if (b.description !== undefined)
      input.description = b.description === null ? null : String(b.description);
    if (b.isSoldOut !== undefined) input.isSoldOut = Boolean(b.isSoldOut);
    if (b.displayOrder !== undefined)
      input.displayOrder = Number(b.displayOrder);
    if (b.imageUrl !== undefined) input.imageUrl = String(b.imageUrl);
    if (b.imagePublicId !== undefined)
      input.imagePublicId =
        b.imagePublicId === null ? null : String(b.imagePublicId);
    const salePriceCents = parseSalePriceCents(b.salePriceCents, res);
    if (b.salePriceCents !== undefined && salePriceCents === undefined) return;
    if (b.salePriceCents !== undefined) input.salePriceCents = salePriceCents;
    const saleLabel = parseSaleLabel(b.saleLabel, res);
    if (b.saleLabel !== undefined && saleLabel === undefined) return;
    if (b.saleLabel !== undefined) input.saleLabel = saleLabel;
    const saleEndsAt = parseSaleEndsAt(b.saleEndsAt, res);
    if (b.saleEndsAt !== undefined && saleEndsAt === undefined) return;
    if (b.saleEndsAt !== undefined) input.saleEndsAt = saleEndsAt;

    const current = await getAdminProductById(id);
    if (!current) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    const finalSalePriceCents =
      input.salePriceCents !== undefined
        ? input.salePriceCents
        : current.salePriceCents;
    const finalPriceCents =
      input.priceCents !== undefined ? input.priceCents : current.priceCents;
    if (!validateFinalSale(finalSalePriceCents, finalPriceCents, res)) return;

    try {
      const updated = await updateProduct(id, input);
      if (!updated) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json(updated);
    } catch (err) {
      if (isUniqueViolation(err)) {
        res
          .status(409)
          .json({ message: "A product with that slug already exists" });
        return;
      }
      throw err;
    }
  },
);

adminProductsRouter.delete(
  "/api/admin/products/:id",
  requireAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const ok = await deleteProduct(id);
    if (!ok) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.status(204).send();
  },
);
