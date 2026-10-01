# Deploying with Neon (Postgres)

This app is already wired for Neon: one `DATABASE_URL` drives the entire
backend (Drizzle ORM + `pg`), the schema lives in `src/db/schema.ts`, and all
content seeds itself on first use — no manual data setup. File uploads
(site logo, partner logos, media library) are also stored **in Postgres**
(`uploaded_files` table), so Neon is the *only* backend — the site deploys to
Vercel with zero extra services.

## GitHub → Vercel launch checklist

1. **Push the code**
   ```
   git init
   git add .            # .env is git-ignored — it will NOT be committed
   git commit -m "Palawan Collective"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/palawan-collective.git
   git push -u origin main
   ```
2. **Create the Neon database** — steps below; copy the **pooled** string.
3. **Apply the schema to Neon** (from your machine, with a `.env` whose
   `DATABASE_URL` points at Neon):
   ```
   npm run db:setup
   ```
   Safe to re-run — it applies [`drizzle/0000_initial.sql`](./drizzle/0000_initial.sql)
   when the database is empty and otherwise reports what it found. Prefer no
   terminal at all? Paste that same SQL file into the Neon **SQL Editor** and run it.
4. **Import the repo in Vercel** — New Project → import the GitHub repo.
   Framework: Next.js (auto-detected). No build command changes.
5. **Set Vercel environment variables** (Project → Settings →
   Environment Variables) — same names as `.env.example`:
   `DATABASE_URL` (Neon pooled), `ADMIN_PASSKEY`, `ADMIN_JWT_SECRET`,
   `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`,
   `NEXT_PUBLIC_SITE_URL`. Optional: `OPENROUTER_API_KEY`, `OLLAMA_BASE_URL`.
6. **Deploy.** The build doesn't touch the database, and content seeds
   itself on the first request — nothing else to run.
7. **Smoke test:** home page renders → admin (footer Admin / triple-click
   logo → passkey) → upload a logo or partner in the console → it shows on
   the live site and survives a redeploy (it lives in Neon, not the file
   system).

## 1. Create the Neon project

1. Neon console → **New Project** → pick a region (e.g. `us-east-1`, or
   `ap-southeast-1` for lower latency to the Philippines).
2. **Connection Details → Pooled connection string**
   (the host contains `-pooler`).
3. Put it in `.env` as `DATABASE_URL`:

   ```
   DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

   > Use the **pooled** string for a Next.js server. The direct (non-pooler)
   > string is fine for one-off drizzle-kit commands if you prefer.

## 2. Apply the schema

From the repo root, with `.env` in place:

```
npx drizzle-kit push --force
```

That's the whole migration story for now — `push` syncs
`src/db/schema.ts` to the database. If you want versioned migrations later:

```
npx drizzle-kit generate   # writes SQL into drizzle/
npx drizzle-kit migrate
```

### Upgrading an existing Dream Team deployment

A database created before the Dream Team feature may not have `team_members`.
Updating code alone does not synchronize the full database schema.

1. Merge the code update and deploy that revision.
2. From a trusted terminal with `DATABASE_URL` set to the **intended Neon
   project/branch**, synchronize the schema from the same revision:
   ```
   npm run db:push
   ```
   This script uses `--force`; review the schema changes and take a backup
   before running it against production. Do not paste the full initial SQL
   into an already-populated database.
3. Load the home page and `/api/public/site`, then open Ops → Dream team.
   Verify the roster appears, edit a member, reload, and confirm the edit
   persists. `/api/health` checks connectivity only, not table completeness.

The runtime also repairs a **missing `team_members` table only**, provided the
app's database role has `CREATE` permission on its schema. The repair, roster,
section ordering and `seed:team` claim run in one transaction, guarded against
concurrent cold starts. A stale claim from an earlier missing-table failure is
replaced when the table is recreated; any new failure rolls back for retry.
Existing tables are not altered, and edited/hidden/deleted members are not
reset. Other missing tables, incompatible columns, connection failures and
permission errors still require normal database maintenance.

## 3. Seed the content (automatic)

Nothing to run. The first request that touches the database inserts the
default content (stories, builds, guides, FAQs, social links, partners,
default agents, design tokens) exactly once — `src/lib/control.ts`
(`ensureControlSeeded`) is idempotent and never overwrites rows you've edited.

## 4. Set the other env vars

Copy `.env.example` → `.env` (or your host's env UI):

| Var | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon pooled connection string |
| `ADMIN_PASSKEY` | yes for prod | 4-digit /admin passkey |
| `ADMIN_JWT_SECRET` | yes for prod | long random string (command in `.env.example`) |
| `OPENROUTER_API_KEY` | for agents | cloud models; can also be pasted in Admin → Models |
| `OLLAMA_BASE_URL` | for local models | host running `ollama` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | shown + used in WhatsApp links |
| `NEXT_PUBLIC_CONTACT_EMAIL` | yes | shown in footer/forms |
| `NEXT_PUBLIC_SITE_URL` | yes | canonical URLs, sitemap, OpenGraph |

## 5. Deploy the app

- **Vercel / Render / Fly.io** all work — it's a standard Next.js App Router
  app. Set the env vars in the host, then build (`npm run build`) and start.
- The app is fully dynamic for the admin surface and home page
  (`force-dynamic`); no build-time DB access is needed, so deploys never
  require the database to be reachable.

## Storage note (uploads)

Partner logos, the site logo and media-library uploads are stored **in
Postgres** (hex-encoded in the `uploaded_files` table) and served by
`src/app/uploads/[...path]/route.ts`, which also serves any legacy files left
on disk. This is what makes Vercel work with zero extra services — uploads
survive redeploys because they live in Neon.

- Keep logos as SVG or reasonably sized PNG/JPG (they're stored per byte).
  Neon's free plan holds 0.5 GB — plenty for logos and a small media library.
- If you later upload large video libraries, swap `src/lib/storage.ts`
  (three small functions) for an S3-compatible bucket (Cloudflare R2 / S3).
  Nothing else changes — every asset is referenced by its `/uploads/*` URL.

## Operational notes

- Sessions expire after 30 minutes of inactivity (enforced server-side).
- The `/admin` path is disallowed in `robots.txt` and returns a locked
  screen with no login form — the passkey modal is the only entry.
- Every admin save snapshots the previous state
  (`content_versions` table → Admin → Version history), so mistakes are
  one click to undo.
