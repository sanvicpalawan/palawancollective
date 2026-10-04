import { pool } from "@/db";

export const dynamic = "force-dynamic";

const REQUIRED_TABLES = [
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
] as const;

/**
 * Readiness check for the actual backend, not just the Postgres connection.
 * In particular, upload writes need both `media_assets` and `uploaded_files`;
 * checking `SELECT 1` alone used to report healthy when those tables were
 * missing, hiding the reason an upload could not be saved.
 */
export async function GET() {
  try {
    const { rows } = await pool.query<{ table_name: string }>(
      `select table_name
       from information_schema.tables
       where table_schema = current_schema()
         and table_type = 'BASE TABLE'
         and table_name = any($1::text[])`,
      [REQUIRED_TABLES],
    );
    const present = new Set(rows.map((row) => row.table_name));
    const missingTables = REQUIRED_TABLES.filter((table) => !present.has(table));
    const ready = missingTables.length === 0;

    return Response.json(
      {
        ok: ready,
        database: "connected",
        schema: ready ? "ready" : "incomplete",
        ...(ready ? {} : { missingTables }),
      },
      {
        status: ready ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("[health] backend check failed:", error instanceof Error ? error.message : error);
    return Response.json(
      { ok: false, database: "unavailable" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
