import "server-only";
import { withTenant } from "@/lib/db";
import { computeStatus, isMissing } from "@/lib/services/assignments";

export type TeacherSchedulePeriod = {
  courseSectionId: string;
  courseName: string;
  sectionName: string;
  room: string | null;
  startMinute: number;
  endMinute: number;
  studentCount: number;
};

export type UngradedSubmission = {
  submissionId: string;
  assignmentTitle: string;
  courseName: string;
  studentName: string;
  submittedAt: Date;
};

export type StudentToCheckOn = {
  studentProfileId: string;
  studentName: string;
  missingCount: number;
};

export type TeacherDashboardData = {
  teacherName: string;
  today: TeacherSchedulePeriod[];
  ungradedCount: number;
  ungradedSubmissions: UngradedSubmission[];
  studentsToCheckOn: StudentToCheckOn[];
  upcomingAssignments: { id: string; title: string; courseName: string; dueDate: Date }[];
};

const MISSING_ASSIGNMENT_ALERT_THRESHOLD = 3;

export async function getTeacherDashboard(
  schoolId: string,
  userId: string,
): Promise<TeacherDashboardData> {
  const now = new Date();
  const todayDow = now.getDay();

  return withTenant(schoolId, async (tx) => {
    const profile = await tx.teacherProfile.findUniqueOrThrow({
      where: { userId },
      include: { user: true },
    });

    const sections = await tx.courseSection.findMany({
      where: { teacherProfileId: profile.id },
      include: {
        course: true,
        scheduleBlocks: true,
        enrollments: true,
      },
    });

    const today: TeacherSchedulePeriod[] = sections
      .flatMap((s) =>
        s.scheduleBlocks
          .filter((b) => b.dayOfWeek === todayDow)
          .map((b) => ({
            courseSectionId: s.id,
            courseName: s.course.name,
            sectionName: s.sectionName,
            room: s.room,
            startMinute: b.startMinute,
            endMinute: b.endMinute,
            studentCount: s.enrollments.length,
          })),
      )
      .sort((a, b) => a.startMinute - b.startMinute);

    const sectionIds = sections.map((s) => s.id);

    const ungradedRows = await tx.submission.findMany({
      where: {
        assignment: { courseSectionId: { in: sectionIds } },
        submittedAt: { not: null },
        grade: null,
      },
      include: {
        assignment: { include: { courseSection: { include: { course: true } } } },
        studentProfile: { include: { user: true } },
      },
      orderBy: { submittedAt: "asc" },
    });

    const ungradedSubmissions: UngradedSubmission[] = ungradedRows.map((s) => ({
      submissionId: s.id,
      assignmentTitle: s.assignment.title,
      courseName: s.assignment.courseSection.course.name,
      studentName: s.studentProfile.user.name,
      submittedAt: s.submittedAt as Date,
    }));

    const upcomingWindowEnd = new Date(now.getTime() + 7 * 86_400_000);
    const upcomingAssignmentsRaw = await tx.assignment.findMany({
      where: {
        courseSectionId: { in: sectionIds },
        dueDate: { gte: now, lte: upcomingWindowEnd },
      },
      include: { courseSection: { include: { course: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    // Missing-work tally per student, across this teacher's sections.
    const assignmentsForMissing = await tx.assignment.findMany({
      where: { courseSectionId: { in: sectionIds }, dueDate: { lt: now } },
      include: {
        courseSection: { include: { enrollments: { include: { studentProfile: { include: { user: true } } } } } },
        submissions: true,
      },
    });

    const missingCountByStudent = new Map<string, { name: string; count: number }>();
    for (const a of assignmentsForMissing) {
      const submittedStudentIds = new Set(a.submissions.filter((s) => s.submittedAt).map((s) => s.studentProfileId));
      for (const enrollment of a.courseSection.enrollments) {
        const studentId = enrollment.studentProfileId;
        if (submittedStudentIds.has(studentId)) continue;
        const status = computeStatus(a.dueDate, now, null, null);
        if (!isMissing(status)) continue;
        const existing = missingCountByStudent.get(studentId);
        const name = enrollment.studentProfile.user.name;
        missingCountByStudent.set(studentId, { name, count: (existing?.count ?? 0) + 1 });
      }
    }

    const studentsToCheckOn: StudentToCheckOn[] = Array.from(missingCountByStudent.entries())
      .map(([studentProfileId, { name, count }]) => ({
        studentProfileId,
        studentName: name,
        missingCount: count,
      }))
      .filter((s) => s.missingCount >= MISSING_ASSIGNMENT_ALERT_THRESHOLD)
      .sort((a, b) => b.missingCount - a.missingCount);

    return {
      teacherName: profile.user.name,
      today,
      ungradedCount: ungradedSubmissions.length,
      ungradedSubmissions: ungradedSubmissions.slice(0, 8),
      studentsToCheckOn,
      upcomingAssignments: upcomingAssignmentsRaw.map((a) => ({
        id: a.id,
        title: a.title,
        courseName: a.courseSection.course.name,
        dueDate: a.dueDate,
      })),
    };
  });
}
