/**
 * Pure, framework/DB-agnostic assignment logic. Deliberately has no Prisma
 * or Next.js imports so it can be unit tested in isolation (spec §46) and
 * reused identically by dashboards, the assignment center, and the future
 * REST API.
 *
 * Status is *derived*, never stored — see prisma/schema.prisma's comment on
 * Submission and RESEARCH.md §2 (Blackbaud's gradebook drifting from what
 * students actually see is exactly the bug class this avoids).
 */

export type AssignmentStatus =
  | "UPCOMING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "LATE"
  | "MISSING"
  | "GRADED"
  | "RETURNED"; // reserved for a future explicit "send back for revision" action

export type SubmissionSnapshot = {
  submittedAt: Date | null;
  hasDraftContent: boolean; // a Submission row exists with content but not yet submitted
} | null;

export type GradeSnapshot = { score: number } | null;

export function computeStatus(
  dueDate: Date,
  now: Date,
  submission: SubmissionSnapshot,
  grade: GradeSnapshot,
): AssignmentStatus {
  if (grade) return "GRADED";

  if (submission?.submittedAt) {
    return submission.submittedAt > dueDate ? "LATE" : "SUBMITTED";
  }

  const isPastDue = now > dueDate;
  if (isPastDue) return "MISSING";

  if (submission?.hasDraftContent) return "IN_PROGRESS";

  return "UPCOMING";
}

export type Priority = "HIGH" | "MEDIUM" | "LOW" | null;

const HOUR_MS = 60 * 60 * 1000;

/**
 * A useful, non-gamified priority signal (spec §10): how urgently a
 * student should work on this next. Finished work (submitted/graded) has no
 * priority — it's off the list, not a low score to feel good about.
 */
export function computePriority(
  status: AssignmentStatus,
  dueDate: Date,
  now: Date,
  estimatedMinutes: number | null,
): Priority {
  if (["SUBMITTED", "LATE", "GRADED", "RETURNED"].includes(status)) return null;

  if (status === "MISSING") return "HIGH";

  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / HOUR_MS;
  const effortHours = (estimatedMinutes ?? 60) / 60;

  // Due soon relative to how long it will take is what actually matters,
  // not just the calendar date.
  if (hoursUntilDue <= Math.max(24, effortHours * 3)) return "HIGH";
  if (hoursUntilDue <= 24 * 3) return "MEDIUM";
  return "LOW";
}

export function isMissing(status: AssignmentStatus): boolean {
  return status === "MISSING";
}

export function isDone(status: AssignmentStatus): boolean {
  return status === "SUBMITTED" || status === "LATE" || status === "GRADED" || status === "RETURNED";
}
