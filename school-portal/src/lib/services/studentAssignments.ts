import "server-only";
import { withTenant } from "@/lib/db";
import { computeStatus, computePriority, type AssignmentStatus, type Priority } from "@/lib/services/assignments";

export type StudentAssignmentListItem = {
  id: string;
  title: string;
  courseName: string;
  courseSectionId: string;
  dueDate: Date;
  status: AssignmentStatus;
  priority: Priority;
  points: number;
  score: number | null;
};

/** Every assignment across every class the student is enrolled in — no date window. */
export async function listAllStudentAssignments(
  schoolId: string,
  userId: string,
): Promise<StudentAssignmentListItem[]> {
  const now = new Date();
  return withTenant(schoolId, async (tx) => {
    const profile = await tx.studentProfile.findUniqueOrThrow({ where: { userId } });
    const enrollments = await tx.enrollment.findMany({
      where: { studentProfileId: profile.id },
      select: { courseSectionId: true },
    });
    const courseSectionIds = enrollments.map((e) => e.courseSectionId);

    const assignments = await tx.assignment.findMany({
      where: { courseSectionId: { in: courseSectionIds } },
      include: {
        courseSection: { include: { course: true } },
        submissions: { where: { studentProfileId: profile.id }, include: { grade: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return assignments.map((a) => {
      const submission = a.submissions[0] ?? null;
      const grade = submission?.grade ?? null;
      const status = computeStatus(
        a.dueDate,
        now,
        submission
          ? { submittedAt: submission.submittedAt, hasDraftContent: Boolean(submission.textContent || submission.linkUrl) }
          : null,
        grade ? { score: grade.score } : null,
      );
      return {
        id: a.id,
        title: a.title,
        courseName: a.courseSection.course.name,
        courseSectionId: a.courseSectionId,
        dueDate: a.dueDate,
        status,
        priority: computePriority(status, a.dueDate, now, a.estimatedMinutes),
        points: a.points,
        score: grade?.score ?? null,
      };
    });
  });
}
