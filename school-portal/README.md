# School Portal

A modern, student-first alternative to Blackbaud's K-12 Education Management
suite — built from research into what actually frustrates students, teachers,
parents, and administrators today, not a clone of the incumbent's UI. See
[`RESEARCH.md`](./RESEARCH.md) for the sourced research this is built on,
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the technical design,
[`SECURITY.md`](./SECURITY.md) for what's actually implemented on the
security front, and [`UX_DECISIONS.md`](./UX_DECISIONS.md) for the specific
product decisions and why.

**Status: Phase 2.** Phase 1 shipped authentication, the database schema,
multi-tenancy, role-based access control, and the student/teacher/parent/admin
dashboards. Phase 2 adds class pages, the full assignment lifecycle (create,
submit with file/text/link, grade), a transparent grade-explanation page with
a live what-if calculator, and a keyboard-driven teacher grading workflow with
grade history/undo. See ARCHITECTURE.md §8–§9 for what's built and what's
still ahead. This is a real, working application against a real Postgres
database — not a mockup.

## Stack

Next.js 16 (App Router, Server Components + Server Actions) · TypeScript ·
PostgreSQL · Prisma 7 (with row-level security) · Tailwind CSS v4 · Vitest.

## Local setup

### 1. Create the database and roles

The app uses two Postgres roles by design (see `SECURITY.md`): the main app
role, which is subject to row-level security, and a narrowly-scoped role used
only for the pre-authentication login lookup.

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE school_portal LOGIN PASSWORD 'school_portal_dev' CREATEDB;
CREATE DATABASE school_portal OWNER school_portal;
CREATE ROLE school_portal_auth LOGIN PASSWORD 'school_portal_auth_dev' BYPASSRLS;
GRANT CONNECT ON DATABASE school_portal TO school_portal_auth;
SQL
sudo -u postgres psql -d school_portal -c 'GRANT SELECT ON "User" TO school_portal_auth;'
```

(`CREATEDB` on the main role is only needed so Prisma Migrate can create its
shadow database in local dev — it's not required in production, where
migrations should run with `prisma migrate deploy` instead of `migrate dev`.)

### 2. Configure environment variables

```bash
cp .env.example .env
```

The defaults in `.env.example` match the roles created above. See that file
for what each variable does.

### 3. Install, migrate, seed

```bash
npm install            # also runs `prisma generate` via postinstall
npm run db:migrate      # applies prisma/migrations, including the RLS policies
npm run db:seed         # loads realistic demo data
npm run dev
```

Open <http://localhost:3000>.

## Demo accounts

All development/demo accounts (flagged `isDemo: true` and labeled in the UI)
share the password **`demo1234`**:

| Role | Email |
|---|---|
| Student | `student@example.com` (Weston Cole) |
| Teacher | `teacher@example.com` (Dr. Amara Smith) |
| Parent | `parent@example.com` (Danielle Cole — linked to two children) |
| Admin | `admin@example.com` (Priya Desai) |

The seed data includes a full school (Bright River Academy): 4 teachers, 6
students, 4 course sections with real weekly schedules, a mix of graded,
upcoming, and deliberately-missing assignments (so the "Missing" and
"Students to check on" features have real data to show), attendance history,
announcements, a soccer team, course resources, and two rubric-graded
assignments — including at least one ungraded submission per class, so
`teacher@example.com` always has something real to grade in "Grade
submissions" right after logging in.

## Testing

```bash
npm test          # unit + integration tests (vitest)
npm run lint
npx tsc --noEmit  # or `npm run build`, which typechecks as part of the build
```

`tests/integration/tenant-isolation.test.ts` talks to a real local Postgres
and proves the row-level-security tenant boundary actually holds — it's not
just documented, it's tested against the database engine itself.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Main app connection string. This role is subject to row-level security on every tenant-scoped table. |
| `DATABASE_URL_AUTH` | Least-privilege connection used only for the pre-authentication user lookup by email (`SELECT`-only on `User`, bypasses RLS since the tenant isn't known yet). Never used for anything else. |
| `SESSION_SECRET` | Signs the session cookie (HS256). Must be a strong random value outside local dev. |
| `UPLOADS_DIR` | Optional. Local filesystem directory for assignment submission uploads (default: `./uploads`). See `lib/storage/fileStorage.ts` — this is an interface with one implementation today, meant to be swapped for S3/Blob storage later without touching callers. |

## Deployment notes (Phase 1 scope)

- Run `prisma migrate deploy` (not `migrate dev`) against production —
  it applies committed migrations without creating a shadow database or
  prompting interactively.
- `SESSION_SECRET` must be a strong, unique secret per environment.
- Both Postgres roles need to exist before migrations run, since the RLS
  migration grants policies referencing `school_portal` and the app assumes
  `school_portal_auth` already has its narrow `SELECT` grant (see setup step
  1 above — script this as part of your provisioning, not a manual one-off).
- `npm run build && npm start` for a production Node server. See the
  [Next.js self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting)
  for reverse-proxy/CDN considerations this phase doesn't cover yet
  (see `ARCHITECTURE.md` §8 and `SECURITY.md`'s "Known gaps" for what's
  still ahead).
