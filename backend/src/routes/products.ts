import { Router } from "express";
import { getProductBySlug, listProducts } from "../products/queries.js";

export const productsRouter = Router();

productsRouter.get("/api/products", async (_req, res) => {
  const products = await listProducts();
  res.json(products);
});

productsRouter.get("/api/products/:slug", async (req, res) => {
  const product = await getProductBySlug(req.params.slug);
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json(product);
});
