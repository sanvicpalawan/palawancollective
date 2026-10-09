import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

/**
 * Database client — Neon-ready, reachable from egress-restricted hosts.
 *
 * Everything is driven by a single DATABASE_URL:
 *  - local: postgresql://postgres:postgres@127.0.0.1:5432/app_db
 *  - Neon:  postgresql://USER:PASS@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?pgbouncer=true
 *
 * Transport note
 * --------------
 * This host sits behind a provider egress allowlist that permits outbound TCP
 * only on 80/443/8080 — outbound 5432/5433 is silently dropped (SYN sent, no
 * reply), and the provider's firewall cannot be edited on a trial account
 * ("TRIAL_FIREWALL"). `pg` therefore can never complete the Postgres handshake.
 *
 * `@neondatabase/serverless` speaks the real Postgres wire protocol over a
 * WebSocket on 443, so it needs no new ports and keeps full pg semantics:
 * transactions, advisory locks and parameterised queries all behave exactly as
 * they do over TCP. It is a drop-in for `pg`: `pool.query(text, values)` returns
 * the usual `{ rows, rowCount }`, and `drizzle` accepts it unchanged.
 *
 * The connection string (including `pgbouncer=true`) is passed through as-is,
 * so Neon's pooler still multiplexes connections.
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
