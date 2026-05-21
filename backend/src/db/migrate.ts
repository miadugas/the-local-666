import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, "migrations");

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function listApplied(): Promise<Set<string>> {
  const result = await pool.query<{ version: string }>(
    "SELECT version FROM schema_migrations",
  );
  return new Set(result.rows.map((row) => row.version));
}

function listMigrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function applyMigration(filename: string): Promise<void> {
  const version = filename.replace(/\.sql$/, "");
  const sql = readFileSync(resolve(migrationsDir, filename), "utf8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [
      version,
    ]);
    await client.query("COMMIT");
    console.log(`[migrate] applied ${version}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[migrate] FAILED ${version}`, err);
    throw err;
  } finally {
    client.release();
  }
}

export async function up(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await listApplied();
  const files = listMigrationFiles();

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (applied.has(version)) {
      console.log(`[migrate] skip ${version} (already applied)`);
      continue;
    }
    await applyMigration(file);
  }
  console.log("[migrate] up complete");
}

// Only run the CLI when migrate.ts is the entry point — not when imported
// by the boot orchestration in index.ts.
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isMain) {
  const command = process.argv[2];

  if (command === "up") {
    up()
      .then(() => pool.end())
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        pool.end();
        process.exit(1);
      });
  } else {
    console.error(`Unknown command: ${command ?? "(none)"}. Usage: migrate up`);
    process.exit(1);
  }
}
