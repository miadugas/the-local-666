import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env, isDev } from "./env.js";
import { pool } from "./db/pool.js";
import { up as migrateUp } from "./db/migrate.js";
import { seedAdminIfEmpty } from "./auth/seed.js";
import { healthRouter } from "./routes/health.js";

async function boot(): Promise<void> {
  // 1. Run pending migrations
  await migrateUp();

  // 2. Seed admin user if needed
  await seedAdminIfEmpty();

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
