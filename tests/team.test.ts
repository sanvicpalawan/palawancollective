import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import { promisify } from "node:util";
import { Pool } from "pg";

// Never use the app's DATABASE_URL implicitly. Each run owns a unique schema,
// and only that schema is dropped. Still use a disposable/local test database.
const schema = `pc_team_test_${randomUUID().replaceAll("-", "")}`;
const statements = readFileSync("drizzle/0000_initial.sql", "utf8")
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);
const teamSql = statements.find((statement) => statement.startsWith('CREATE TABLE "team_members"'));
const execFileAsync = promisify(execFile);

let admin: Pool;
let pool: (typeof import("../src/db/index"))["pool"];
let control: typeof import("../src/lib/control");
let teamRoute: typeof import("../src/app/api/admin/team/route");
let publicRoute: typeof import("../src/app/api/public/site/route");
let uploadsRoute: typeof import("../src/app/uploads/[...path]/route");
let mintOpsToken: typeof import("../src/lib/ops-auth").mintOpsToken;

function coldStart() {
  const globals = globalThis as typeof globalThis & {
    __pcControlSeed?: Promise<void> | null;
    __pcTeamSeed?: Promise<void> | null;
  };
  globals.__pcControlSeed = null;
  globals.__pcTeamSeed = null;
}

before(async () => {
  const testUrl = process.env.TEST_DATABASE_URL;
  assert.ok(testUrl, "Set TEST_DATABASE_URL to a disposable PostgreSQL database to run test:db.");
  assert.ok(teamSql, "The initial SQL must include team_members.");
  admin = new Pool({ connectionString: testUrl });
  await admin.query(`create schema "${schema}"`);

  const isolatedUrl = new URL(testUrl);
  isolatedUrl.searchParams.set("options", `-c search_path=${schema}`);
  Object.assign(process.env, {
    DATABASE_URL: isolatedUrl.toString(),
    DB_POOL_MAX: "2",
    NODE_ENV: "test",
    ADMIN_JWT_SECRET: randomUUID(),
  });
  ({ pool } = await import("../src/db/index"));
  control = await import("../src/lib/control");
  teamRoute = await import("../src/app/api/admin/team/route");
  publicRoute = await import("../src/app/api/public/site/route");
  uploadsRoute = await import("../src/app/uploads/[...path]/route");
  ({ mintOpsToken } = await import("../src/lib/ops-auth"));
});

beforeEach(async () => {
  coldStart();
  await admin.query(`drop schema "${schema}" cascade; create schema "${schema}"`);
  await pool.query(statements.filter((statement) => statement !== teamSql).join("\n"));
  // Reproduce an existing, pre-Dream-Team database: control already seeded,
  // old home-page positions/labels, and no team_members table.
  await pool.query(`
    insert into site_settings (key, value) values ('seed:control', '{"seededAt":"legacy"}');
    insert into site_sections (key, type, title, position, data) values
      ('hero', 'hero', 'Hero', 0, '{"index":"00"}'),
      ('built', 'grid', 'Built', 1, '{"index":"01","custom":"keep"}'),
      ('stories', 'story-blocks', 'Stories', 2, '{"index":"operator-label"}');
  `);
});

after(async () => {
  if (pool) await pool.end();
  if (admin) {
    try {
      await admin.query(`drop schema if exists "${schema}" cascade`);
    } finally {
      await admin.end();
    }
  }
});

async function hasTeamTable() {
  const { rows } = await pool.query("select to_regclass('team_members')::text as relation");
  return rows[0].relation !== null;
}

async function count(table: "team_members" | "site_sections" | "content_versions" | "faqs" | "agents") {
  const { rows } = await pool.query<{ count: number }>(`select count(*)::int as count from ${table}`);
  return rows[0].count;
}

async function opsRequest(method: string, body?: FormData) {
  return new Request("https://palawancollective.test/api/admin/team?id=1", {
    method,
    headers: { Authorization: `Bearer ${await mintOpsToken()}` },
    body,
  });
}

test("section reads repair the missing table and migrate legacy positions exactly once", async () => {
  const sections = await control.getPublishedSections();
  assert.ok(await hasTeamTable());
  assert.equal((await control.getTeam()).length, control.teamSeedRows().length);
  assert.equal(sections.find((section) => section.key === "team")?.position, 1);
  const built = sections.find((section) => section.key === "built");
  assert.equal(built?.position, 2);
  assert.deepEqual(built?.data, { index: "02", custom: "keep" });
  const stories = sections.find((section) => section.key === "stories");
  assert.equal(stories?.position, 3);
  assert.equal(stories?.data.index, "operator-label");

  coldStart();
  assert.deepEqual(await control.getPublishedSections(), sections);
  assert.equal(await count("team_members"), control.teamSeedRows().length);
});

test("a stale seed:team claim from a failed missing-table attempt is repaired", async () => {
  await pool.query("insert into site_settings (key, value) values ('seed:team', '{\"seededAt\":\"failed\"}')");
  await control.getSections();
  assert.equal(await count("team_members"), control.teamSeedRows().length);
  const { rows } = await pool.query("select value from site_settings where key = 'seed:team'");
  assert.notEqual(rows[0].value.seededAt, "failed");
  assert.equal((await control.getPublishedSections()).filter((section) => section.key === "team").length, 1);
});

test("runtime table columns and primary key match the shipped initial SQL", async () => {
  await control.getTeam();
  async function columns() {
    const { rows } = await pool.query(`
      select column_name, data_type, is_nullable, column_default
      from information_schema.columns
      where table_schema = $1 and table_name = 'team_members'
      order by ordinal_position
    `, [schema]);
    return rows;
  }
  const repairedColumns = await columns();
  const { rows: primaryKey } = await pool.query(`
    select a.attname
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'team_members'::regclass and c.contype = 'p'
  `);
  assert.deepEqual(primaryKey, [{ attname: "id" }]);
  await pool.query(`drop table team_members; ${teamSql}`);
  assert.deepEqual(await columns(), repairedColumns);
});

test("failed seeding rolls back the table, claim, roster and section shifts, then retries", async () => {
  const { rows: originalSections } = await pool.query("select * from site_sections order by id");
  await pool.query("alter table site_sections add constraint reject_team check (key <> 'team')");
  await assert.rejects(control.getTeam());
  assert.equal(await hasTeamTable(), false);
  assert.equal((await pool.query("select key from site_settings where key = 'seed:team'")).rowCount, 0);
  assert.deepEqual((await pool.query("select * from site_sections order by id")).rows, originalSections);

  await pool.query("alter table site_sections drop constraint reject_team");
  // No cold-start reset: the failed process promise must have reset itself.
  assert.equal((await control.getTeam()).length, control.teamSeedRows().length);
  assert.equal((await control.getSections()).find((section) => section.key === "built")?.position, 2);
});

test("control seeding also rolls back a premature success flag and retries", async () => {
  await pool.query("delete from site_settings; delete from site_sections");
  await pool.query("alter table faqs add constraint reject_faq check (question = 'not a default')");
  await assert.rejects(control.getSettingsMap());
  assert.equal((await pool.query("select * from site_settings")).rowCount, 0);
  assert.equal(await count("site_sections"), 0);

  await pool.query("alter table faqs drop constraint reject_faq");
  const settings = await control.getSettingsMap();
  assert.equal(settings.site_name, "Palawan Collective");
  assert.ok(await count("faqs") > 0);
  assert.ok(await count("agents") > 0);
  assert.equal(await hasTeamTable(), false); // Unrelated readers do not query the team table.
  assert.equal((await control.getTeam()).length, control.teamSeedRows().length);
  assert.equal((await control.getSections()).find((section) => section.key === "team")?.position, 1);
});

test("edits, visibility and deliberate deletions survive a new process seed check", async () => {
  await control.getTeam();
  await pool.query("update team_members set name = 'Edited by ops', visible = false, position = 99 where id = 1");
  await pool.query("delete from team_members where id = 2");
  await pool.query("update site_sections set title = 'Our people', visible = false where key = 'team'");
  const { rows: before } = await pool.query("select * from team_members order by id");
  coldStart();
  await control.getTeam();
  assert.deepEqual((await pool.query("select * from team_members order by id")).rows, before);
  assert.equal((await control.getTeam(true)).some((member) => member.id === 1), false);
  assert.equal((await control.getPublishedSections()).some((section) => section.key === "team"), false);
  assert.equal((await control.getSections()).find((section) => section.key === "team")?.title, "Our people");
});

test("known legacy photo paths missing from GitHub are not rendered as broken image URLs", async () => {
  await control.getTeam();
  await pool.query("update team_members set photo = '/images/team/1000057187.png' where id = 1");
  const publicRoster = await control.getTeamPublic();
  assert.equal(publicRoster.find((member) => member.id === 1)?.photo, "");
  // The public projection must not rewrite the operator/database row.
  const { rows } = await pool.query("select photo from team_members where id = 1");
  assert.equal(rows[0].photo, "/images/team/1000057187.png");
});

test("an intentionally emptied roster and deleted block stay deleted", async () => {
  await control.getTeam();
  await pool.query("delete from team_members; delete from site_sections where key = 'team'");
  const { rows: before } = await pool.query("select * from site_sections order by id");
  coldStart();
  assert.deepEqual(await control.getTeamPublic(), []);
  assert.deepEqual((await pool.query("select * from site_sections order by id")).rows, before);
});

test("an existing operator roster without a team seed claim is not overwritten", async () => {
  await pool.query(teamSql!);
  await pool.query("insert into team_members (name, role, position) values ('Existing person', 'Custom role', 12)");
  const team = await control.getTeam();
  assert.equal(team.length, 1);
  assert.equal(team[0].name, "Existing person");
  assert.equal(team[0].role, "Custom role");
  assert.equal(team[0].position, 12);
});

test("independent concurrent cold starts create one roster and shift sections once", async () => {
  const results = await Promise.all(Array.from({ length: 4 }, () => execFileAsync(
    process.execPath,
    ["--import", "tsx", "tests/fixtures/team-cold-start.ts"],
    { env: process.env, timeout: 30_000 },
  )));
  for (const result of results) {
    assert.deepEqual(JSON.parse(result.stdout), { members: control.teamSeedRows().length, teamSections: 1 });
  }
  assert.equal(await count("team_members"), control.teamSeedRows().length);
  const { rows } = await pool.query("select position from site_sections where key = 'built'");
  assert.equal(rows[0].position, 2);
});

test("public site bundle no longer fails on a missing team table", async () => {
  const response = await publicRoute.GET();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.sections.filter((section: { key: string }) => section.key === "team").length, 1);
  assert.equal("seed:team" in body.settings, false);
});

test("authenticated team GET repairs and lists the roster", async () => {
  const response = await teamRoute.GET(await opsRequest("GET"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.team.length, control.teamSeedRows().length);
});

test("authenticated team POST saves photo bytes and roster row durably together", async () => {
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
  const form = new FormData();
  form.set("name", "New person with photo");
  form.set("photoFile", new File([bytes], "portrait.png", { type: "image/png" }));
  const response = await teamRoute.POST(await opsRequest("POST", form));
  assert.equal(response.status, 200);
  const { member } = await response.json();
  assert.equal(member.name, "New person with photo");
  assert.match(member.photo, /^\/uploads\/team-[\w-]+\.png$/);
  assert.equal(await count("team_members"), control.teamSeedRows().length + 1);
  assert.equal(await count("content_versions"), 1);

  const name = member.photo.slice("/uploads/".length);
  const { rows } = await pool.query("select data, size from uploaded_files where name = $1", [name]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].size, bytes.length);
  assert.deepEqual(Buffer.from(rows[0].data, "hex"), bytes);

  const imageResponse = await uploadsRoute.GET(
    new Request(`https://palawancollective.test${member.photo}`),
    { params: Promise.resolve({ path: [name] }) },
  );
  assert.equal(imageResponse.status, 200);
  assert.equal(imageResponse.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), bytes);
});

test("failed team save rolls back an uploaded photo instead of orphaning bytes", async () => {
  await control.getTeam();
  await pool.query("alter table team_members add constraint reject_rolled_back_photo check (name <> 'Rollback photo')");
  const form = new FormData();
  form.set("name", "Rollback photo");
  form.set("photoFile", new File([Buffer.from("photo-bytes")], "portrait.png", { type: "image/png" }));
  const response = await teamRoute.POST(await opsRequest("POST", form));
  assert.equal(response.status, 500);
  assert.equal(await count("team_members"), control.teamSeedRows().length);
  assert.equal((await pool.query("select name from uploaded_files")).rowCount, 0);
  await pool.query("alter table team_members drop constraint reject_rolled_back_photo");
});

test("authenticated team PUT can be the first request against a missing table", async () => {
  const form = new FormData();
  form.set("name", "Renamed on first request");
  const response = await teamRoute.PUT(await opsRequest("PUT", form));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).member.name, "Renamed on first request");
  assert.equal(await count("content_versions"), 1);
});

test("authenticated team DELETE can be the first request against a missing table", async () => {
  const response = await teamRoute.DELETE(await opsRequest("DELETE"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(await count("team_members"), control.teamSeedRows().length - 1);
  assert.equal(await count("content_versions"), 1);
});

test("unauthenticated team requests remain side-effect free", async () => {
  for (const method of ["GET", "POST", "PUT", "DELETE"] as const) {
    const response = await teamRoute[method](new Request("https://palawancollective.test/api/admin/team?id=1", { method }));
    assert.equal(response.status, 401);
  }
  assert.equal(await hasTeamTable(), false);
  assert.equal((await pool.query("select key from site_settings where key = 'seed:team'")).rowCount, 0);
});
