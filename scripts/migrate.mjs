// Minimal migration runner: executes every .sql file in supabase/migrations
// in order against DATABASE_URL. Reads env from .env.local.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load DATABASE_URL from .env.local (no dotenv dependency).
const envText = readFileSync(join(root, ".env.local"), "utf8");
const match = envText.match(/^DATABASE_URL=(.*)$/m);
const DATABASE_URL = match?.[1]?.trim();
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const dir = join(root, "supabase", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected. Running", files.length, "migration(s)...");
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf8");
    process.stdout.write(`  • ${f} ... `);
    await client.query(sql);
    console.log("ok");
  }
  console.log("All migrations applied successfully.");
} catch (err) {
  console.error("\nMigration failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
