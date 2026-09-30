import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config — reads DATABASE_URL from the environment (or .env).
 *
 * Works identically for:
 *  - local:      postgresql://postgres:postgres@127.0.0.1:5432/app_db
 *  - Neon:       postgresql://USER:PASS@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?pgbouncer=true
 *
 * Usage from the repo root:
 *  npx drizzle-kit push --force     # apply schema changes (simplest)
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and put your Neon connection string in it.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: databaseUrl,
  },
});
