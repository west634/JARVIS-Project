import "server-only";
import { withTenant } from "@/lib/db";
import { computeStatus, isMissing } from "@/lib/services/assignments";

export type AdminDashboardData = {
  schoolName: string;
  studentCount: number;
  teacherCount: number;
  courseSectionCount: number;
  attendanceTodayPresentRate: number | null;
  assignmentCompletionRate: number;
  missingWorkCount: number;
  recentAnnouncements: { id: string; title: string; publishAt: Date; authorName: string }[];
  teacherWorkload: { teacherName: string; sectionCount: number; ungradedCount: number }[];
};

export async function getAdminDashboard(schoolId: string): Promise<AdminDashboardData> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86_400_000);

  return withTenant(schoolId, async (tx) => {
    const school = await tx.school.findUniqueOrThrow({ where: { id: schoolId } });

    // Sequential, not Promise.all: every query in this function shares one
    // transaction/connection, which cannot run concurrent queries.
    const studentCount = await tx.studentProfile.count();
    const teacherCount = await tx.teacherProfile.count();
    const courseSectionCount = await tx.courseSection.count();

    const todaysAttendance = await tx.attendance.findMany({
      where: { date: { gte: startOfToday, lt: endOfToday } },
    });
    const attendanceTodayPresentRate =
      todaysAttendance.length === 0
        ? null
        : todaysAttendance.filter((a) => a.status === "PRESENT").length / todaysAttendance.length;

    const windowStart = new Date(now.getTime() - 30 * 86_400_000);
    const recentAssignments = await tx.assignment.findMany({
      where: { dueDate: { gte: windowStart, lte: now } },
      include: {
        courseSection: { include: { enrollments: true } },
        submissions: true,
      },
    });

    let expectedSubmissions = 0;
    let completedSubmissions = 0;
    let missingWorkCount = 0;
    for (const a of recentAssignments) {
      const submittedIds = new Set(a.submissions.filter((s) => s.submittedAt).map((s) => s.studentProfileId));
      for (const enrollment of a.courseSection.enrollments) {
        expectedSubmissions += 1;
        if (submittedIds.has(enrollment.studentProfileId)) {
          completedSubmissions += 1;
        } else {
          const status = computeStatus(a.dueDate, now, null, null);
          if (isMissing(status)) missingWorkCount += 1;
        }
      }
    }
    const assignmentCompletionRate =
      expectedSubmissions === 0 ? 1 : completedSubmissions / expectedSubmissions;

    const recentAnnouncementsRaw = await tx.announcement.findMany({
      orderBy: { publishAt: "desc" },
      take: 5,
      include: { author: true },
    });

    const teachers = await tx.teacherProfile.findMany({
      include: {
        user: true,
        sectionsTaught: {
          include: {
            assignments: {
              include: { submissions: { include: { grade: true } } },
            },
          },
        },
      },
    });

    const teacherWorkload = teachers
      .map((t) => {
        const ungradedCount = t.sectionsTaught.reduce((sum, section) => {
          return (
            sum +
            section.assignments.reduce((s, a) => {
              return s + a.submissions.filter((sub) => sub.submittedAt && !sub.grade).length;
            }, 0)
          );
        }, 0);
        return {
          teacherName: t.user.name,
          sectionCount: t.sectionsTaught.length,
          ungradedCount,
        };
      })
      .sort((a, b) => b.ungradedCount - a.ungradedCount);

    return {
      schoolName: school.name,
      studentCount,
      teacherCount,
      courseSectionCount,
      attendanceTodayPresentRate,
      assignmentCompletionRate,
      missingWorkCount,
      recentAnnouncements: recentAnnouncementsRaw.map((a) => ({
        id: a.id,
        title: a.title,
        publishAt: a.publishAt,
        authorName: a.author.name,
      })),
      teacherWorkload,
    };
  });
}
