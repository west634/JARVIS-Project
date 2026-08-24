# ARCHITECTURE.md

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| App framework | Next.js 15 (App Router) + TypeScript | Server Components give near-instant navigation and cut client JS; Server Actions give us mutations without hand-rolling a REST layer for every form; one framework serves web + API. |
| Database | PostgreSQL | Real row-level security, strong typing, mature migration tooling, JSON columns where useful (e.g. notification preferences), scales to multi-tenant SaaS. |
| ORM | Prisma | Typed schema-as-code, migration history, works well with RLS via `SET LOCAL` session vars. |
| Auth | Auth.js (NextAuth) v5, credentials provider (Phase 1) | Session cookies, pluggable providers so SSO/Google/Microsoft can be added later (§45 of the spec) without a rewrite. |
| Styling | Tailwind CSS v4 | Matches the tooling already used in this repo's `client/`; fast to build a consistent design system with. |
| Validation | Zod | Shared schema between server actions and forms; single source of truth for input validation at the boundary (§31). |
| Testing | Vitest (unit/integration), Playwright (e2e, later phase) | Fast, TS-native, good Next.js support. |

Everything lives under `school-portal/` at the repo root, as a separate app from the pre-existing
`client/`/`server/` SENTINEL voice-assistant project. The two products are unrelated; nothing in
SENTINEL is modified.

## 2. Why Server Components + Server Actions instead of a separate SPA/API split

The spec's performance requirements (§28: <1s first meaningful render, minimal loading states,
never reload the whole app) push strongly toward **rendering on the server and streaming HTML**,
not shipping a client SPA that fetches JSON after mount. Next.js App Router gives us:

- Data fetched directly in Server Components, in parallel, with per-segment caching — the "Today"
  dashboard's four data sources (schedule, assignments, missing work, announcements) fetch
  concurrently and stream in as each resolves, instead of one waterfall.
- `revalidatePath`/`revalidateTag` for precise cache invalidation after a mutation (e.g. submitting
  an assignment invalidates just that student's assignment list, not the whole app).
- Server Actions double as the "clean API layer" the spec asks for (§36) — each action is a typed,
  server-side function with its own auth check, independently callable and independently testable.
- Client Components are used only where real interactivity is required (submission drag-and-drop,
  the command palette, filters that must persist without a full navigation).

A conventional REST/GraphQL API is not precluded — §36 asks for one, and Server Actions here are
implemented as thin wrappers over a `lib/services/*` layer that has no dependency on Next.js
request context, so a `app/api/v1/*` route layer can be added on top of the same services without
duplicating business logic. That boundary is set up in Phase 1 (`lib/services/`) even though the
public REST surface itself is a later-phase deliverable.

## 3. Multi-tenancy

Single database, shared schema, **every tenant-scoped table carries a `schoolId`**. Two
independent layers enforce isolation, deliberately redundant (§31: never rely on client-side
authorization alone):

1. **Application layer.** All reads/writes go through `lib/db.ts`'s `forSchool(schoolId)` helper
   or through service functions that take an authenticated `Session` and derive `schoolId` from it
   server-side — never from client input. No component or action is allowed to accept a raw
   `schoolId` from the client and trust it.
2. **Database layer (Postgres RLS).** Every tenant-scoped table has `ENABLE ROW LEVEL SECURITY`
   and a policy restricting rows to `current_setting('app.current_school_id')`. Prisma's
   `$transaction` wraps each request in a transaction that starts with
   `SET LOCAL app.current_school_id = '<id>'`, set from the verified session — so even a bug in
   application-layer filtering cannot leak cross-tenant rows. See `prisma/migrations/*_rls/` and
   `lib/db.ts`.

```
Platform (single Postgres instance)
 └── School (row per tenant)
      ├── users (schoolId FK, RLS-scoped)
      ├── courses (schoolId FK, RLS-scoped)
      ├── assignments (via course → school, RLS-scoped)
      └── ... every other tenant table
```

`School` itself and a small number of platform-global tables (e.g. a future billing/plan table)
are the only tables without `schoolId`.

## 4. RBAC

Roles: `STUDENT`, `TEACHER`, `PARENT`, `ADMIN` (modeled as a Postgres enum `Role` on `User`, plus a
`GuardianLink` join table so a parent can be linked to multiple students and a student can have
multiple guardians — deliberately not Blackbaud's single rigid "parent" slot, per `RESEARCH.md`
§11).

- **Server-side enforcement only.** Every Server Action and data-fetching function starts by
  calling `requireRole()`/`requireSession()` (`lib/auth/guards.ts`), which reads the verified
  session — never a client-supplied role string. UI-level hiding of buttons/nav items is a courtesy,
  not a security boundary.
- Permission checks are centralized in `lib/permissions.ts` as pure functions
  (`canSubmitAssignment(user, assignment)`, `canGradeSubmission(user, submission)`,
  `canViewStudent(user, student)`, …) so they're unit-testable in isolation from HTTP/DB and reused
  identically across Server Components, Server Actions, and (later) the REST API.
- Parents are hard-blocked at the permission-function level from any submission-mutating action —
  `canSubmitAssignment` returns `false` for `PARENT` unconditionally, independent of any
  guardian-student link, so this can never regress via a data bug (§4 of the spec: "Parents must
  NOT be able to submit student work").

## 5. Database schema (Phase 1 scope, full entity list per spec §33)

Implemented in `prisma/schema.prisma`. Core entities and relationships:

- `School` — tenant root.
- `AcademicYear`, `Term` — scoped to `School`.
- `User` — one row per person, `role` enum, `schoolId`. Auth credentials live in `Account`
  (Auth.js) referencing `User`.
- `StudentProfile`, `TeacherProfile`, `ParentProfile`, `AdminProfile` — role-specific extension
  tables (1:1 with `User`) instead of nullable columns crammed onto `User`.
- `GuardianLink` — `ParentProfile` ↔ `StudentProfile`, many-to-many, with a `relationship` field.
- `Department`, `Course`, `CourseSection` — a `Course` (e.g. "Biology") has one or more
  `CourseSection`s (e.g. "Biology — Period 3"), each taught by a teacher, scoped to a `Term`.
- `Enrollment` — `StudentProfile` ↔ `CourseSection`, the roster.
- `Assignment` — belongs to a `CourseSection`, has category, points, due date, rubric ref.
- `Rubric`, `RubricCriterion`.
- `Submission` — belongs to `Assignment` + `StudentProfile`; status enum
  (`UPCOMING/IN_PROGRESS/SUBMITTED/LATE/MISSING/GRADED/RETURNED`) is *derived*, not stored, by
  `lib/services/assignments.ts#computeStatus` (a pure, unit-tested function) from due date,
  submission timestamp, and grade state — this avoids the exact "status silently drifts from
  reality" class of bug found in Blackbaud's gradebook complaints (`RESEARCH.md` §2).
- `Grade` — one row per graded `Submission`, plus `GradeHistory` for the audit trail the spec
  requires (§29, §33).
- `Attendance`, `Schedule`/`ScheduleBlock`, `CalendarEvent`, `Announcement`, `AnnouncementAudience`,
  `Message`, `MessageThread`, `Notification`, `NotificationPreference`, `Resource`, `Activity`,
  `Team`, `AuditLog`.

Every table above (other than `School`) has a `schoolId` column (denormalized where the natural FK
chain is deep, e.g. `Assignment.schoolId` is duplicated from
`Assignment.courseSection.course.schoolId`) specifically so RLS policies and indexes can be simple
and uniform rather than requiring a join to authorize every query.

Indexes: every foreign key, plus composite indexes on `(schoolId, dueDate)` on `Assignment` and
`(schoolId, studentProfileId, status-relevant columns)` on `Submission`, since "what's due" and
"what's missing" are the hottest queries in the whole product (dashboards, §5–§10 of the spec).

## 6. Auditability & reliability

- `AuditLog` records actor, action, entity, before/after diff (JSON), timestamp, `schoolId` — every
  grade change, role change, and submission event writes one.
- Grade edits never overwrite in place: `Grade` has a `GradeHistory` table, and the current grade
  is the latest history row — this gives "undo" and full grade history (spec §13) for free from
  the data model, not as a bolted-on feature.
- Mutations that matter (submission, grading) run inside a single Prisma `$transaction`, so a
  partial failure can't leave, e.g., a `Submission` row with no `File` rows attached.

## 7. Directory layout

```
school-portal/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    app/
      (auth)/login/
      (student)/... student nav routes
      (teacher)/...
      (parent)/...
      (admin)/...
      api/                 # future public REST surface, thin wrapper over lib/services
    components/             # shared UI primitives (Card, Badge, EmptyState, etc.)
    lib/
      auth/                 # session helpers, guards.ts
      db.ts                 # Prisma client + RLS transaction helper
      permissions.ts         # pure RBAC functions, unit tested
      services/              # business logic, framework-agnostic
        assignments.ts       # status computation, priority scoring
        dashboard.ts          # "Today"/"Up Next"/"Missing" aggregation
      validation/             # zod schemas
    types/
  tests/
    unit/
    integration/
```

## 8. Phase 2: courses, assignments, submissions, grades, gradebook

Built on top of the Phase 1 foundation without changing it:

- **Class pages** (`app/student/classes`, `app/teacher/classes`) — Overview/Assignments/Grades
  (or Gradebook)/Resources tabs, all URL-driven (`?tab=`) rather than client-state-driven, so a
  class page's tab is bookmarkable and shareable, matching the "persistent filters" requirement
  the same way the assignment list's status filter does.
- **Submission system** — `lib/actions/submissionActions.ts` (Server Actions) plus
  `lib/storage/fileStorage.ts`, a storage interface with a local-filesystem implementation for
  now. Uploaded files are never public/static; they're only ever served through
  `app/api/files/[fileId]/route.ts`, which re-derives the requester's permission
  (`canAccessSubmissionFile`) on every single request rather than trusting a signed/guessable
  URL. Submission and draft-save share one `handle()` implementation, differing only in whether
  `submittedAt` gets set — this is also where the spec's "tell the student exactly what happened
  if it fails" requirement (§29) is implemented: a failed submission returns a specific error
  string, never a silent failure.
- **Grade calculation** (`lib/services/grades.ts`) is pure and framework-free by design — the
  same `computeWeightedGrade`/`projectWhatIf` functions run server-side to build the Grades page
  and client-side (imported directly into a Client Component) to power the live "what if" tool
  with zero network round-trips per keystroke.
- **Grading workflow** (`app/teacher/grade/[assignmentId]`) calls
  `lib/actions/gradingActions.ts` directly from client event handlers (not through a `<form>`) —
  a supported Server Actions pattern — so keyboard-driven navigation (←/→) and autosave-on-navigate
  can share one code path. Every grade write records the prior value to `GradeHistory` before
  overwriting, which is the entire "grade history + undo" feature: there's no separate undo
  stack to keep in sync, undoing is just restoring (and deleting) the latest history row. Every
  grade mutation also writes an `AuditLog` row — the first real consumer of that Phase 1 model.
- **Ownership/enrollment checks that double as 404s.** Every service function that uses
  `findUniqueOrThrow`/`findFirstOrThrow` to both fetch a record and verify the caller may see it
  (e.g. "this section, but only if this student is enrolled") is wrapped in
  `lib/notFound.ts#withNotFoundOn404`, which turns Prisma's P2025 into Next's `notFound()` — a
  clean 404 page, never a raw stack trace, whether the ID is bogus or just someone else's.

## 9. Phase 3: calendar, schedule, notifications, messaging

- **Calendar** (`lib/services/calendarLogic.ts` + `lib/services/calendar.ts`) separates pure date
  math (recurring-schedule expansion, month/week grids, view date ranges — all unit tested, zero
  DB/framework imports) from the DB-backed merge of three sources into one `CalendarItem[]`:
  `CalendarEvent` rows, assignment due dates, and `ScheduleBlock` occurrences expanded across the
  requested range. Day/Week/Month/Agenda views and date navigation are plain links
  (`?view=&date=`), so — like the assignment filters and class tabs before it — the view survives
  back/forward and refresh for free. Clicking an event opens a contextual detail panel (a small
  client component) instead of a full page navigation, per spec §11.
- **Schedule** (`lib/services/schedule.ts`) is deliberately a different view of the same
  `ScheduleBlock` data: a generic weekly timetable template plus "right now / next up," not a
  dated view. A specific day's cancellation (`ScheduleBlock.isCancelled`/`cancelledDate`) only
  shows inline on the timetable when that day is today — the Calendar is where a *future* specific
  cancellation shows correctly, because it's already expanding concrete dated occurrences. Two
  views, two different jobs, deliberately not merged into one.
- **Notifications** (`lib/notify.ts` for writing, `lib/services/notifications.ts` for reading) are
  generated at the point of the real event, not batched: `assignmentActions.ts` notifies every
  enrolled student on assignment creation, `gradingActions.ts` notifies the student when a grade
  posts, `scheduleActions.ts` notifies enrolled students on a class cancellation, and
  `messagingActions.ts` notifies recipients on a new thread or reply. `notifyUser`/`notifyUsers`
  always run inside the caller's existing tenant transaction (never open their own), and check the
  recipient's `NotificationPreference` before writing — defaulting to enabled so a school never
  silently drops a grade/assignment notice because no preference row exists yet. Only the `IN_APP`
  channel is wired to real delivery; `PUSH`/`EMAIL`/`SMS` preferences are stored (spec §20 asks for
  the categories/channels model) but have no delivery backend behind them yet — see SECURITY.md
  and README for what that means honestly, not aspirationally.
- **Messaging** (`lib/services/contacts.ts`, `lib/services/messaging.ts`,
  `lib/actions/messagingActions.ts`) keeps the "school-safe" constraint from `lib/permissions.ts`
  (`canMessage`) enforced twice: once by only ever *listing* real, relationship-scoped contacts
  (a teacher's actual students and their guardians, a parent's child's actual teachers — never the
  whole directory, and never another student), and again by re-checking `canMessage` server-side
  on send, so the contact list being scoped correctly is a UX nicety, not the security boundary.
  Read state is a `lastReadAt` timestamp per `MessageThreadParticipant`, not a boolean — viewing a
  thread is what marks it read, matching how the notification center's "unread" also works off a
  comparison rather than a flag that could drift.

### A client/server boundary bug this phase caught

`NOTIFICATION_CATEGORIES` (a plain array) was originally exported from `lib/services/notifications.ts`,
a `"server-only"` module that imports `lib/db.ts` (and therefore `pg`). The preferences form is a
Client Component and imported it directly — which failed the production build, not silently: bundling
`pg` for the browser fails on missing Node builtins (`net`, `tls`, …). Fixed by extracting the
client-safe types/constants into `lib/notificationTypes.ts`, which has no server/database
dependency, and having the server module re-export from it. The general rule this establishes:
**a Client Component may import `type`s from a `lib/services/*.ts` file, but never a runtime value**
— any shared constant/enum-array a client component needs belongs in a plain, dependency-free
module instead.

## 10. Roadmap (phases 4–7, not built yet)

Matches the spec's phased plan: Phase 4 (parent portal depth, athletics, announcements), Phase 5
(AI features), Phase 6 (analytics/import-export/integrations), Phase 7
(perf/accessibility/security/mobile polish). Each phase builds on the service-layer boundary
established in Phase 1 rather than bypassing it.
