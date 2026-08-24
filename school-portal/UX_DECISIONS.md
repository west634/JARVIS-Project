# UX_DECISIONS.md

Decisions made in Phase 1, and the specific research/product-spec reasoning
behind each — not a general design philosophy essay.

## Grade status is derived, never stored

`Submission`/`Grade` have no `status` column. `lib/services/assignments.ts#computeStatus`
derives UPCOMING / IN_PROGRESS / SUBMITTED / LATE / MISSING / GRADED live from
`dueDate`, `submittedAt`, and whether a `Grade` exists.

**Why:** RESEARCH.md §2 documents a recurring, sourced Blackbaud complaint —
students seeing a different cumulative grade than what's in the teacher's
gradebook, and "Add to cumulative grade" flags silently flipping. That's the
signature of a stored status/flag drifting from the data it's supposed to
reflect. Deriving status from source data at read time makes that entire bug
class structurally impossible — there is nothing to drift out of sync.

## Single-step grade visibility, not Blackbaud's two-step publish

The moment a `Grade` row exists, the student sees it. There is no separate
"Publish Grade" setting plus a second "publish in Assignment Calendar" step.

**Why:** RESEARCH.md §2 and §11 — Blackbaud teachers describe the two-step
requirement as pure added workload with no pedagogical benefit. We
deliberately did not build a hidden-then-released grade state at all, rather
than build it and add a "don't forget to publish" reminder on top.

## Guardian model, not a rigid "parent" role slot

`GuardianLink` is a many-to-many join between `ParentProfile` and
`StudentProfile`, with `relationship`/`isPrimary`/`canViewBilling` fields,
instead of a single `parentId` on the student.

**Why:** RESEARCH.md §2/§5/§11 — Blackbaud locks billing/portal access to
whoever is tagged the one "parent," which concretely blocks a paying
grandparent or a second parent from getting access. Modeling this as a
proper relationship, from the very first migration, avoids a costly schema
migration later once real households (blended families, guardians,
multiple siblings) show up. The seed data deliberately gives one parent
account two linked children to exercise this.

## Priority is a signal, not a score

`computePriority` returns `HIGH`/`MEDIUM`/`LOW` (or nothing, for finished
work) based on urgency relative to estimated effort — never points, streaks,
or badges.

**Why:** Spec §10 explicitly warns against a "distracting gamified system."
Finished assignments get **no** priority value at all rather than a
low/green one — the goal is to shrink the list of things demanding
attention, not to give positive reinforcement for existing in a queue.

## The student home screen leads with Today → Up Next → Missing

In that literal order, before grades, before announcements.

**Why:** Spec §5 states the product's core question is "what do I have to do
today," not "where do I click." Every other panel (recently graded,
announcements) is secondary and placed below the fold intentionally.

## Navigation only lists what exists

Phase 1's sidebar has exactly one item per role ("Home" / "Dashboard").
Classes, Assignments, Calendar, Grades, Messages, etc. are not present as
dead links.

**Why:** Spec §50 — "I want a real working application... do not give me
fake buttons." A nav item pointing at a 404 is a fake button with extra
steps. The nav is expected to grow every phase as real routes land; it will
never get ahead of what's actually built.

## Parents get a rollup, not teacher-level detail

`getParentDashboard` intentionally returns per-course grade averages and
missing/due counts — not the full assignment list, submission text, or
teacher comments a student/teacher sees.

**Why:** Spec §43, verbatim: "Parents should not be overwhelmed by
teacher-level details." This is a deliberately smaller API surface, not a
trimmed-down version of the student view.

## Server Components + one demo banner over client-side "is this a demo" checks

Every protected layout renders `AppShell` server-side with the session's
`isDemo` flag baked in; there's no client fetch to determine this.

**Why:** Matches ARCHITECTURE.md §2's whole reasoning for choosing Server
Components — data needed for first paint should never round-trip through
the client to be fetched again. It's also a direct, low-cost way to satisfy
spec §48 ("clearly label demo accounts") without inventing a separate
mechanism.

## Class page tabs live in the URL, not component state

`?tab=assignments` rather than a `useState` toggle.

**Why:** Spec §3 calls out persistent state as a first-class requirement — "if a user... changes
a view, their settings should persist when navigating away and coming back." A URL-driven tab is
the simplest possible implementation of that: back/forward works, the tab survives a refresh, and
it's a real link a student or teacher can share ("check the Gradebook tab") — none of which a
client-side toggle gives you for free.

## Grading is a queue with autosave-on-navigate, not a form-per-student

Clicking "Save & Next" (or pressing →) always saves the current student's score before moving,
even on the last submission in the queue where there's nowhere to navigate to. Losing a grade
because a teacher hit the last item and the UI treated "no next" as "nothing to do" would be
exactly the kind of silent data loss spec §29 (Reliability) rules out.

## Undo is "restore the prior value," not a separate undo stack

Grading writes the previous score/feedback to `GradeHistory` before overwriting, and "undo"
restores the most recent history row. There's no separate undo/redo state machine to keep
consistent with the actual data — the history table *is* the undo mechanism, and it's also a
complete, inspectable audit trail (spec §13's "grade history" and "undo" turn out to be the same
feature, not two).

## Empty states are written per-context, not "No data"

E.g. "Nothing missing. Great work." / "Nothing waiting on you. Nice." /
"No students with repeated missing work right now."

**Why:** Spec §37 calls for "excellent empty states" explicitly as part of
premium-SaaS-feeling UI. A student's empty "Missing" list is good news and
should read like it.
