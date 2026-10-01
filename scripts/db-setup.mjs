#!/usr/bin/env node
/**
 * One-command Neon setup.
 *
 *   npm run db:setup
 *
 * What it does:
 *   1. reads DATABASE_URL from the environment (or .env)
 *   2. connects and reports which project/branch it landed on
 *   3. applies drizzle/0000_initial.sql when the database is empty
 *      (safe to re-run — an initialised database is left untouched)
 *   4. verifies every expected table exists
 *
 * Use this instead of `drizzle-kit push` when you want to see exactly what is
 * happening, or when you only have a SQL connection string and no terminal
 * tooling history. `npm run db:push` remains the canonical schema sync.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const ROOT = process.cwd();
const SQL_FILE = path.join(ROOT, "drizzle", "0000_initial.sql");

const EXPECTED_TABLES = [
  "agent_logs",
  "agents",
  "analytics_events",
  "builds",
  "content_versions",
  "design_tokens",
  "faqs",
  "field_log",
  "galleries",
  "guides",
  "inquiries",
  "media_assets",
  "model_config",
  "nav_items",
  "partners",
  "site_sections",
  "site_settings",
  "social_links",
  "stories",
  "subscribers",
  "team_members",
  "uploaded_files",
];

/** Minimal .env reader — avoids depending on dotenv being installed. */
function envFromFile() {
  const file = path.join(ROOT, ".env");
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

function describe(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname} (user: ${parsed.username})`;
  } catch {
    return "(unparseable connection string)";
  }
}

const fromFile = envFromFile();
const databaseUrl = process.env.DATABASE_URL || fromFile.DATABASE_URL;

if (!databaseUrl) {
  console.error("✗ DATABASE_URL is not set.");
  console.error("  Put your Neon pooled connection string in .env, or export it:");
  console.error('  DATABASE_URL="postgresql://…" npm run db:setup');
  process.exit(1);
}

if (!existsSync(SQL_FILE)) {
  console.error(`✗ Missing ${path.relative(ROOT, SQL_FILE)}.`);
  console.error("  Regenerate it with: npm run db:generate");
  process.exit(1);
}

console.log(`→ target: ${describe(databaseUrl)}\n`);

const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 2,
  connectionTimeoutMillis: 20_000,
});

let client;
try {
  client = await pool.connect();
} catch (error) {
  console.error("✗ Could not connect.\n");
  console.error(`  ${error.message}\n`);
  console.error("  Check:");
  console.error("   • the string is the POOLED one (host contains `-pooler`)");
  console.error("   • the password is copied exactly (reset it in Neon → Roles if unsure)");
  console.error("   • the project is not suspended — open the Neon console once to wake it");
  await pool.end().catch(() => {});
  process.exit(1);
}

try {
  const { rows: info } = await client.query(
    "select current_database() as db, current_user as usr, version() as version",
  );
  console.log(`✓ connected — database "${info[0].db}", role "${info[0].usr}"`);
  console.log(`  ${info[0].version.split(",")[0]}\n`);

  const { rows: found } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public'",
  );
  const existing = new Set(found.map((r) => r.table_name));
  const expected = EXPECTED_TABLES.filter((t) => existing.has(t));

  if (expected.length === EXPECTED_TABLES.length) {
    console.log(`✓ schema already applied — all ${EXPECTED_TABLES.length} tables present`);
  } else if (existing.size > 0 && expected.length > 0) {
    const missing = EXPECTED_TABLES.filter((t) => !existing.has(t));
    console.log(`! partial schema detected (${expected.length}/${EXPECTED_TABLES.length} tables)`);
    console.log(`  missing: ${missing.join(", ")}`);
    console.log("  → run `npm run db:push` to reconcile the remainder\n");
  } else {
    const sql = readFileSync(SQL_FILE, "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`→ applying ${statements.length} statements from drizzle/0000_initial.sql …`);
    await client.query("begin");
    try {
      for (const statement of statements) await client.query(statement);
      await client.query("commit");
      console.log("✓ schema applied\n");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  const { rows: after } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public'",
  );
  const now = new Set(after.map((r) => r.table_name));
  const missing = EXPECTED_TABLES.filter((t) => !now.has(t));

  if (missing.length === 0) {
    console.log(`✓ verified — ${EXPECTED_TABLES.length}/${EXPECTED_TABLES.length} tables ready`);
  } else {
    console.log(`! ${missing.length} table(s) still missing: ${missing.join(", ")}`);
  }

  const { rows: counts } = await client.query(
    `select
       (select count(*)::int from stories)    as stories,
       (select count(*)::int from site_settings) as settings,
       (select count(*)::int from nav_items)  as nav`,
  );
  const c = counts[0];
  const seeded = c.stories + c.settings + c.nav;

  console.log("");
  if (seeded === 0) {
    console.log("✓ database is empty and ready.");
    console.log("  Content seeds itself on the first page load — run `npm run dev`");
    console.log("  and open http://localhost:3000, or just deploy.");
  } else {
    console.log(
      `✓ content present — ${c.stories} stories, ${c.settings} settings, ${c.nav} nav items`,
    );
  }
} catch (error) {
  console.error(`\n✗ setup failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end().catch(() => {});
}
