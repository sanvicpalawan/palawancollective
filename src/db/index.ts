import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Database client — Neon-ready.
 *
 * Everything is driven by a single DATABASE_URL:
 *  - local: postgresql://postgres:postgres@127.0.0.1:5432/app_db
 *  - Neon:  postgresql://USER:PASS@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?pgbouncer=true
 *
 * The pg Pool below is the client Neon recommends for pooled (pgbouncer=true)
 * connection strings. Pool size is kept small because Neon (especially lower
 * plans) caps concurrent connections — the pool waits its turn instead of
 * opening unbounded sockets.
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. For Neon, copy the Pooled connection string from your Neon project settings into .env",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __palawanPool?: Pool;
};

export const pool =
  globalForDb.__palawanPool ??
  new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 10_000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 15_000),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__palawanPool = pool;
}

export const db = drizzle(pool);
