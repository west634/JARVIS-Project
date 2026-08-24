import "server-only";
import { withTenant } from "@/lib/db";
import { computeStatus, isMissing, isDone } from "@/lib/services/assignments";

export type ChildSummary = {
  studentProfileId: string;
  studentUserId: string;
  name: string;
  gradeLevel: number;
  todayClassCount: number;
  dueTodayCount: number;
  missingCount: number;
  courseGrades: { courseName: string; averageScore: number | null }[];
  attendanceStanding: "Excellent" | "Good standing" | "Needs attention";
};

/**
 * Parents see a rollup per child — never the teacher-level detail a
 * student/teacher sees (spec §43: "Parents should not be overwhelmed by
 * teacher-level details").
 */
export async function getParentDashboard(
  schoolId: string,
  parentUserId: string,
): Promise<{ parentName: string; children: ChildSummary[] }> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86_400_000);
  const todayDow = now.getDay();

  return withTenant(schoolId, async (tx) => {
    const parentProfile = await tx.parentProfile.findUniqueOrThrow({
      where: { userId: parentUserId },
      include: {
        user: true,
        guardianLinks: {
          include: {
            studentProfile: {
              include: {
                user: true,
                enrollments: {
                  include: {
                    courseSection: { include: { course: true, scheduleBlocks: true } },
                  },
                },
                attendance: { where: { date: { gte: new Date(now.getTime() - 30 * 86_400_000) } } },
              },
            },
          },
        },
      },
    });

    const children: ChildSummary[] = [];

    for (const link of parentProfile.guardianLinks) {
      const student = link.studentProfile;
      const courseSectionIds = student.enrollments.map((e) => e.courseSectionId);

      const todayClassCount = student.enrollments.reduce(
        (sum, e) => sum + e.courseSection.scheduleBlocks.filter((b) => b.dayOfWeek === todayDow).length,
        0,
      );

      const assignments = await tx.assignment.findMany({
        where: { courseSectionId: { in: courseSectionIds } },
        include: {
          courseSection: { include: { course: true } },
          submissions: {
            where: { studentProfileId: student.id },
            include: { grade: true },
          },
        },
      });

      let dueTodayCount = 0;
      let missingCount = 0;
      const scoresByCourse = new Map<string, number[]>();

      for (const a of assignments) {
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
        if (isMissing(status)) missingCount += 1;
        if (a.dueDate >= startOfToday && a.dueDate < endOfToday && !isDone(status)) dueTodayCount += 1;
        if (grade) {
          const list = scoresByCourse.get(a.courseSection.course.name) ?? [];
          list.push((grade.score / a.points) * 100);
          scoresByCourse.set(a.courseSection.course.name, list);
        }
      }

      const courseGrades = Array.from(scoresByCourse.entries()).map(([courseName, scores]) => ({
        courseName,
        averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      }));

      const recentAttendance = student.attendance;
      const absenceRate =
        recentAttendance.length === 0
          ? 0
          : recentAttendance.filter((a) => a.status === "ABSENT" || a.status === "TARDY").length /
            recentAttendance.length;
      const attendanceStanding =
        absenceRate === 0 ? "Excellent" : absenceRate < 0.1 ? "Good standing" : "Needs attention";

      children.push({
        studentProfileId: student.id,
        studentUserId: student.userId,
        name: student.user.name,
        gradeLevel: student.gradeLevel,
        todayClassCount,
        dueTodayCount,
        missingCount,
        courseGrades,
        attendanceStanding,
      });
    }

    return { parentName: parentProfile.user.name, children };
  });
}
