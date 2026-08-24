import { describe, it, expect } from "vitest";
import {
  canSubmitAssignment,
  canGradeSubmission,
  canViewStudent,
  canManageSchoolSettings,
  canMessage,
  isSameSchool,
} from "@/lib/permissions";

const SCHOOL_A = "school-a";
const SCHOOL_B = "school-b";

describe("canSubmitAssignment", () => {
  it("never allows a parent to submit, even for their own linked child", () => {
    const parent = { userId: "parent-1", schoolId: SCHOOL_A, role: "PARENT" as const };
    const target = { studentUserId: "parent-1", schoolId: SCHOOL_A }; // even a spoofed match
    expect(canSubmitAssignment(parent, target)).toBe(false);
  });

  it("allows a student to submit only their own work", () => {
    const student = { userId: "student-1", schoolId: SCHOOL_A, role: "STUDENT" as const };
    expect(canSubmitAssignment(student, { studentUserId: "student-1", schoolId: SCHOOL_A })).toBe(true);
    expect(canSubmitAssignment(student, { studentUserId: "student-2", schoolId: SCHOOL_A })).toBe(false);
  });

  it("blocks cross-school submission even for a matching student id", () => {
    const student = { userId: "student-1", schoolId: SCHOOL_A, role: "STUDENT" as const };
    expect(canSubmitAssignment(student, { studentUserId: "student-1", schoolId: SCHOOL_B })).toBe(false);
  });

  it("blocks teachers and admins from submitting on a student's behalf", () => {
    const teacher = { userId: "teacher-1", schoolId: SCHOOL_A, role: "TEACHER" as const };
    const admin = { userId: "admin-1", schoolId: SCHOOL_A, role: "ADMIN" as const };
    const target = { studentUserId: "student-1", schoolId: SCHOOL_A };
    expect(canSubmitAssignment(teacher, target)).toBe(false);
    expect(canSubmitAssignment(admin, target)).toBe(false);
  });
});

describe("canGradeSubmission", () => {
  it("allows the owning teacher, and admins, but not other teachers", () => {
    const owner = { userId: "teacher-1", schoolId: SCHOOL_A, role: "TEACHER" as const };
    const otherTeacher = { userId: "teacher-2", schoolId: SCHOOL_A, role: "TEACHER" as const };
    const admin = { userId: "admin-1", schoolId: SCHOOL_A, role: "ADMIN" as const };
    const target = { teacherUserId: "teacher-1", schoolId: SCHOOL_A };

    expect(canGradeSubmission(owner, target)).toBe(true);
    expect(canGradeSubmission(otherTeacher, target)).toBe(false);
    expect(canGradeSubmission(admin, target)).toBe(true);
  });

  it("blocks grading across schools even for the same teacher id", () => {
    const teacher = { userId: "teacher-1", schoolId: SCHOOL_B, role: "TEACHER" as const };
    const target = { teacherUserId: "teacher-1", schoolId: SCHOOL_A };
    expect(canGradeSubmission(teacher, target)).toBe(false);
  });
});

describe("canViewStudent", () => {
  const target = { studentUserId: "student-1", schoolId: SCHOOL_A };

  it("allows the student to view themself", () => {
    const student = { userId: "student-1", schoolId: SCHOOL_A, role: "STUDENT" as const };
    expect(canViewStudent(student, target)).toBe(true);
  });

  it("denies a different student", () => {
    const student = { userId: "student-2", schoolId: SCHOOL_A, role: "STUDENT" as const };
    expect(canViewStudent(student, target)).toBe(false);
  });

  it("allows any teacher/admin at the same school", () => {
    const teacher = { userId: "teacher-1", schoolId: SCHOOL_A, role: "TEACHER" as const };
    const admin = { userId: "admin-1", schoolId: SCHOOL_A, role: "ADMIN" as const };
    expect(canViewStudent(teacher, target)).toBe(true);
    expect(canViewStudent(admin, target)).toBe(true);
  });

  it("allows a parent ONLY with an explicit guardian link, never by default", () => {
    const parent = { userId: "parent-1", schoolId: SCHOOL_A, role: "PARENT" as const };
    expect(canViewStudent(parent, target)).toBe(false);
    expect(canViewStudent(parent, target, ["student-1"])).toBe(true);
    expect(canViewStudent(parent, target, ["some-other-student"])).toBe(false);
  });
});

describe("canManageSchoolSettings", () => {
  it("is admin-only, and school-scoped", () => {
    const admin = { userId: "admin-1", schoolId: SCHOOL_A, role: "ADMIN" as const };
    const teacher = { userId: "teacher-1", schoolId: SCHOOL_A, role: "TEACHER" as const };
    expect(canManageSchoolSettings(admin, SCHOOL_A)).toBe(true);
    expect(canManageSchoolSettings(admin, SCHOOL_B)).toBe(false);
    expect(canManageSchoolSettings(teacher, SCHOOL_A)).toBe(false);
  });
});

describe("canMessage", () => {
  it("blocks student-to-student messaging (school-safe messaging)", () => {
    const s1 = { userId: "s1", schoolId: SCHOOL_A, role: "STUDENT" as const };
    expect(canMessage(s1, { role: "STUDENT", schoolId: SCHOOL_A })).toBe(false);
  });

  it("allows student-to-teacher and cross-school is always blocked", () => {
    const student = { userId: "s1", schoolId: SCHOOL_A, role: "STUDENT" as const };
    expect(canMessage(student, { role: "TEACHER", schoolId: SCHOOL_A })).toBe(true);
    expect(canMessage(student, { role: "TEACHER", schoolId: SCHOOL_B })).toBe(false);
  });
});

describe("isSameSchool", () => {
  it("is a strict equality check", () => {
    const user = { userId: "u1", schoolId: SCHOOL_A, role: "ADMIN" as const };
    expect(isSameSchool(user, SCHOOL_A)).toBe(true);
    expect(isSameSchool(user, SCHOOL_B)).toBe(false);
  });
});
