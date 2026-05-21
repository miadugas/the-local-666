import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env, isDev } from "./env.js";
import { pool } from "./db/pool.js";
import { up as migrateUp } from "./db/migrate.js";
import { seedAdminIfEmpty } from "./auth/seed.js";
import { seedProductsIfEmpty } from "./products/seed.js";
import { healthRouter } from "./routes/health.js";
import { adminRouter } from "./routes/admin.js";
import { meRouter } from "./routes/me.js";
import { productsRouter } from "./routes/products.js";
import { uploadsRouter } from "./routes/uploads.js";
import { adminProductsRouter } from "./routes/admin-products.js";
import { checkoutRouter } from "./routes/checkout.js";

async function boot(): Promise<void> {
  // 1. Run pending migrations
  await migrateUp();

  // 2. Seed admin user if needed
  await seedAdminIfEmpty();

  // 2b. Seed product catalog if needed
  await seedProductsIfEmpty();

  // 3. Build the Express app
  const app = express();

  app.use(cookieParser());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use(healthRouter);
  app.use(adminRouter);
  app.use(meRouter);
  app.use(productsRouter);
  app.use(uploadsRouter);
  app.use(adminProductsRouter);
  app.use(checkoutRouter);

  // Error handler — JSON shape, no stack in prod
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("[error]", err);
      const message = isDev ? err.message : "Internal server error";
      res.status(500).json({ message });
    },
  );

  app.listen(env.port, () => {
    console.log(`[backend] listening on http://localhost:${env.port}`);
  });
}

boot().catch((err) => {
  console.error("[boot] failed", err);
  pool.end().finally(() => process.exit(1));
});
