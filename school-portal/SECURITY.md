# SECURITY.md

This describes what's actually implemented in Phase 1, not an aspirational
checklist. Anything not yet built is called out explicitly under "Known gaps."

## Authentication

- Credentials (email + password) only in Phase 1; the provider boundary
  (`lib/auth/*`) is written so SSO/OAuth can be added later without touching
  callers — see ARCHITECTURE.md §45 roadmap.
- Passwords are hashed with **bcrypt, 12 salt rounds** (`lib/auth/password.ts`).
  Plaintext passwords are never logged or stored.
- Sessions are a signed **JWT (HS256)** in an `httpOnly`, `sameSite=lax`,
  `secure`-in-production cookie (`lib/auth/session.ts`), expiring after 7
  days. The token is verified server-side on every read via `jose` — nothing
  about a session is ever trusted from unverified client state.
- Login is rate-limited per `ip:email` (8 attempts / 5 minutes, in-memory —
  see `lib/auth/rateLimit.ts`). This blunts naive credential stuffing against
  a single instance; a multi-instance deployment needs a shared store
  (Redis or similar) for this to hold — tracked as a Phase 7 item, not
  silently assumed to be handled.
- Login always returns the same generic "Invalid email or password" message
  whether the account doesn't exist or the password is wrong, so the login
  form can't be used to enumerate valid emails.

## Authorization (RBAC)

- Every authorization decision runs through the pure functions in
  `lib/permissions.ts` — the single source of truth, reused by Server
  Components, Server Actions, and (later) the REST API. See
  `tests/unit/permissions.test.ts` for the enforced rules, including the
  explicit regression test that a parent can never submit a student's work
  even if a bug were to pass a matching student ID.
- `lib/auth/guards.ts#requireRole` re-derives the caller's role from the
  verified session cookie on every protected route/action — never from a
  client-supplied value.
- `src/proxy.ts` (Next.js 16's renamed `middleware.ts`) only does a coarse,
  cookie-presence redirect for UX (bounce anonymous users to `/login`
  before a page even renders). It is **not** a security boundary — the
  Next.js docs for Proxy call out exactly this failure mode (a matcher gap
  or refactor silently removing coverage), so every protected layout and
  Server Action independently re-verifies the session.
- **Messaging (Phase 3) enforces `canMessage` twice, on purpose.**
  `lib/services/contacts.ts#getContactableUsers` only ever *lists*
  relationship-scoped contacts (a teacher's actual students and their
  linked guardians, a parent's child's actual teachers, never another
  student, never a bare school directory for non-admins) — but that's a UX
  courtesy, not the enforcement. `lib/actions/messagingActions.ts#createThreadAction`
  independently re-checks `canMessage` for every recipient server-side
  before creating the thread, so a crafted POST with a recipient ID outside
  what the UI would ever show is still rejected.
- **A client/server boundary bug this phase caught at build time, not
  silently.** A Client Component originally imported a plain constant from
  a `"server-only"` service module that pulls in `pg` — this fails the
  production build outright (missing Node builtins in the browser bundle)
  rather than shipping. Fixed by moving client-safe types/constants into a
  dependency-free module (`lib/notificationTypes.ts`). Documented here
  because it's a real instance of the framework's build step acting as a
  genuine safety net for the server/client trust boundary, not just a
  type-checking nicety — see ARCHITECTURE.md §9 for the full story.

## Multi-tenancy (row-level security)

Two independent, deliberately redundant layers — see ARCHITECTURE.md §3:

1. **Application layer.** All tenant data access goes through
   `lib/db.ts#withTenant(schoolId, fn)`, which opens a transaction and sets
   `app.current_school_id` before running any query. `schoolId` is always
   derived from the verified session server-side, never accepted from the
   client.
2. **Database layer.** Every tenant-scoped table has
   `ENABLE ROW LEVEL SECURITY` **and** `FORCE ROW LEVEL SECURITY` (so even
   the owning role is restricted), with a policy on SELECT/INSERT/UPDATE/DELETE
   requiring `"schoolId" = current_setting('app.current_school_id', true)`.
   See `prisma/migrations/20260824165600_row_level_security/migration.sql`.

This **fails closed**: if application code ever forgets to scope a query
(a real bug class, not hypothetical), the database returns zero rows instead
of leaking another school's data. `tests/integration/tenant-isolation.test.ts`
proves this against a real Postgres instance — it creates two schools, verifies
each only sees its own data, verifies an unscoped query returns nothing, and
verifies a deliberately mistagged insert (`schoolId` set to a different
tenant than the transaction's) is rejected by the database itself.

### The one narrow exception

Login has to look up a user by email *before* we know which school they
belong to, so RLS-by-tenant literally cannot apply yet. Rather than weaken
the main role's RLS, a second, least-privilege Postgres role
(`school_portal_auth`) exists solely for that one query: it can only
`SELECT` from `User`, and has `BYPASSRLS` for that narrow purpose. It cannot
write anything, and cannot read any other table. See `lib/db.ts#authDb` and
`lib/auth/actions.ts`. Every other query in the app uses the regular,
RLS-enforced role.

## Input validation

Every Server Action validates its input with `zod` at the boundary
(`lib/auth/actions.ts#loginSchema` today; the same pattern is required for
every action added in later phases) before touching the database. Next.js
also enforces its own Server Action protections out of the box (Origin/Host
CSRF check, encrypted action references, 1MB body cap) — see the
[Server Actions security docs](https://nextjs.org/docs/app/guides/data-security)
bundled with this Next.js version.

## Injection & XSS

- All database access goes through Prisma's parameterized query builder.
  The one raw SQL call in the codebase (`SELECT set_config('app.current_school_id', $1, true)`
  in `lib/db.ts`) uses a Prisma tagged-template parameter, never string
  concatenation.
- React escapes all rendered content by default; the codebase contains no
  `dangerouslySetInnerHTML`.

## Secrets

- `.env` is git-ignored; `.env.example` ships with placeholder/local-dev-only
  values and documents every variable.
- `SESSION_SECRET` must be a real random value outside local dev — the app
  refuses to start a session with a missing or implausibly short secret.

## Audit logging

The `AuditLog` model exists in the schema (actor, action, entity, before/after
JSON diff, timestamp, schoolId) as part of the Phase 1 database design, per
the spec's requirement that grade changes and other sensitive mutations be
traceable. It is not yet written to, because Phase 1 has no mutating
teacher/admin actions yet (grading, roster changes, etc. are Phase 2+). Wiring
every such mutation to write an `AuditLog` row is a Phase 2 requirement, not
an afterthought — the model was designed now specifically so it's ready.

## Known gaps (intentionally not solved in Phase 1)

- **Distributed rate limiting.** Current limiter is per-process/in-memory;
  fine for one instance, not for a horizontally-scaled deployment.
- **File upload malware scanning.** Assignment submission uploads (Phase 2)
  are size-capped (25MB), filename-sanitized, and only ever served back
  through the permission-checked `/api/files/[fileId]` route (never as a
  static/public asset) — see `lib/storage/fileStorage.ts`. There is no
  antivirus/content scanning yet; that needs to land before file uploads
  are trusted from a school with real adversarial users, not before then.
- **Session revocation list.** A stolen JWT is valid until it expires (7
  days) or the secret rotates; there's no server-side "log out everywhere"
  yet.
- **Push/email/SMS notification delivery.** `NotificationPreference` models
  all four channels from spec §20, and the preferences UI lets a user
  toggle them, but only `IN_APP` actually gates whether a `Notification`
  row gets written — there is no push/email/SMS provider wired up. A school
  relying on those channels for anything urgent (spec's `EMERGENCY`
  category) should not assume delivery beyond the in-app center until a
  real provider is connected.
- **Security headers (CSP, HSTS, etc.)** are not yet configured in
  `next.config.ts` — planned for the Phase 7 hardening pass alongside a
  proper accessibility and performance audit.
- **Dependency advisory:** `npm audit` currently flags a transitive,
  dev-only vulnerability in `deepmerge-ts` (via Prisma's own `@prisma/config`
  tooling) — a stack-exhaustion DoS in a build-time dependency, not shipped
  to production and not reachable by user input. Tracked for the next
  Prisma point release rather than downgraded, which would have broken the
  Prisma 7 toolchain this project depends on.
- **Cosmetic startup warning:** a single Node `DeprecationWarning` about
  concurrent `pg` client queries prints once at server boot, before any
  request is served and independent of traffic. It reproduces with zero
  application queries in flight, so it's internal to the `pg`/adapter-pg
  connection-pool warmup rather than a concurrency bug in this codebase's
  query code (audited: every `withTenant` transaction in the app awaits its
  queries sequentially, never `Promise.all`, and the tenant-isolation
  integration test exercises real concurrent transactions without issue).
  Left as a known, harmless startup log line rather than silently ignored.

## Privacy posture (FERPA/COPPA-oriented)

- Tenant isolation (above) is the technical backbone of FERPA's requirement
  that student records not be accessible outside the owning institution.
- The schema collects only what the product needs to function (spec §32) —
  no unnecessary personal data fields exist on `User`/`StudentProfile`.
- Demo/seed accounts are clearly flagged (`User.isDemo`) and labeled in the
  UI, so it's always obvious when looking at sample data vs. a real account.
- Data retention/deletion policy design is a Phase 6+ deliverable (tied to
  admin tooling for account/school offboarding) and is intentionally not
  claimed as solved here.
