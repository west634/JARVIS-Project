import type { SessionPayload } from "@/lib/auth/session";

/**
 * Centralized, pure RBAC rules. These functions take only plain data (never
 * a request/cookie/DB handle) so they're trivially unit-testable and are the
 * single source of truth reused by Server Components, Server Actions, and
 * (later) the REST API — see ARCHITECTURE.md §4.
 *
 * These are the *only* functions in the codebase allowed to make an
 * authorization decision. Every Server Action must call one of these before
 * touching the database; UI-level hiding of buttons is a courtesy, not a
 * security boundary.
 */

export type MinimalUser = Pick<SessionPayload, "userId" | "schoolId" | "role">;

export function isSameSchool(user: MinimalUser, schoolId: string): boolean {
  return user.schoolId === schoolId;
}

export function canViewOwnDashboard(user: MinimalUser): boolean {
  return ["STUDENT", "TEACHER", "PARENT", "ADMIN"].includes(user.role);
}

/** Parents can never submit or otherwise mutate a student's coursework. */
export function canSubmitAssignment(
  user: MinimalUser,
  target: { studentUserId: string; schoolId: string },
): boolean {
  if (!isSameSchool(user, target.schoolId)) return false;
  if (user.role === "PARENT") return false;
  if (user.role === "STUDENT") return user.userId === target.studentUserId;
  return false;
}

export function canGradeSubmission(
  user: MinimalUser,
  target: { teacherUserId: string; schoolId: string },
): boolean {
  if (!isSameSchool(user, target.schoolId)) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "TEACHER") return user.userId === target.teacherUserId;
  return false;
}

export function canCreateAssignment(
  user: MinimalUser,
  target: { teacherUserId: string; schoolId: string },
): boolean {
  return canGradeSubmission(user, target);
}

/**
 * Whether `user` may view a given student's academic record (grades,
 * attendance, submissions). True for the student themself, any teacher or
 * admin at the same school, or a parent with an active guardian link
 * (`guardianStudentIds` — computed by the caller from `GuardianLink` rows,
 * never trusted from client input).
 */
export function canViewStudent(
  user: MinimalUser,
  target: { studentUserId: string; schoolId: string },
  guardianStudentIds: readonly string[] = [],
): boolean {
  if (!isSameSchool(user, target.schoolId)) return false;
  switch (user.role) {
    case "STUDENT":
      return user.userId === target.studentUserId;
    case "TEACHER":
    case "ADMIN":
      return true;
    case "PARENT":
      return guardianStudentIds.includes(target.studentUserId);
    default:
      return false;
  }
}

/**
 * Narrower than canViewStudent: for private per-submission artifacts (an
 * uploaded file), only the student themself, the *specific* teacher who
 * owns that course section, an admin, or a linked guardian may access it —
 * not every teacher in the school.
 */
export function canAccessSubmissionFile(
  user: MinimalUser,
  target: { studentUserId: string; teacherUserId: string; schoolId: string },
  guardianStudentIds: readonly string[] = [],
): boolean {
  if (!isSameSchool(user, target.schoolId)) return false;
  switch (user.role) {
    case "STUDENT":
      return user.userId === target.studentUserId;
    case "TEACHER":
      return user.userId === target.teacherUserId;
    case "ADMIN":
      return true;
    case "PARENT":
      return guardianStudentIds.includes(target.studentUserId);
    default:
      return false;
  }
}

export function canTakeAttendance(
  user: MinimalUser,
  target: { teacherUserId: string; schoolId: string },
): boolean {
  return canGradeSubmission(user, target);
}

export function canManageSchoolSettings(user: MinimalUser, schoolId: string): boolean {
  return isSameSchool(user, schoolId) && user.role === "ADMIN";
}

export function canPostAnnouncement(user: MinimalUser, schoolId: string): boolean {
  return isSameSchool(user, schoolId) && (user.role === "ADMIN" || user.role === "TEACHER");
}

export function canMessage(
  sender: MinimalUser,
  recipient: { role: MinimalUser["role"]; schoolId: string },
): boolean {
  if (!isSameSchool(sender, recipient.schoolId)) return false;
  // Students may not message other students directly (school-safe
  // messaging, RESEARCH.md §21) — only staff, or their own teachers/parents.
  if (sender.role === "STUDENT" && recipient.role === "STUDENT") return false;
  return true;
}
