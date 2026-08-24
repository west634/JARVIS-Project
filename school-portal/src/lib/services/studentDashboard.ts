import "server-only";
import { withTenant } from "@/lib/db";
import {
  computeStatus,
  computePriority,
  isMissing,
  isDone,
  type AssignmentStatus,
  type Priority,
} from "@/lib/services/assignments";

export type AssignmentCard = {
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

export type SchedulePeriod = {
  courseSectionId: string;
  courseName: string;
  teacherName: string;
  room: string | null;
  startMinute: number;
  endMinute: number;
  isCancelled: boolean;
  substituteName: string | null;
};

export type StudentDashboardData = {
  studentName: string;
  gradeLevel: number;
  today: SchedulePeriod[];
  upNext: AssignmentCard | null;
  missing: AssignmentCard[];
  recentlyGraded: AssignmentCard[];
  announcements: { id: string; title: string; body: string; publishAt: Date }[];
};

const WINDOW_DAYS_BACK = 10;
const WINDOW_DAYS_FORWARD = 21;

export async function getStudentDashboard(
  schoolId: string,
  userId: string,
): Promise<StudentDashboardData> {
  const now = new Date();

  return withTenant(schoolId, async (tx) => {
    const profile = await tx.studentProfile.findUniqueOrThrow({
      where: { userId },
      include: { user: true },
    });

    const enrollments = await tx.enrollment.findMany({
      where: { studentProfileId: profile.id },
      include: {
        courseSection: {
          include: {
            course: true,
            teacher: { include: { user: true } },
            scheduleBlocks: true,
          },
        },
      },
    });

    const courseSectionIds = enrollments.map((e) => e.courseSectionId);
    const todayDow = now.getDay();

    const today: SchedulePeriod[] = enrollments
      .flatMap((e) =>
        e.courseSection.scheduleBlocks
          .filter((b) => b.dayOfWeek === todayDow)
          .map((b) => ({
            courseSectionId: e.courseSection.id,
            courseName: e.courseSection.course.name,
            teacherName: e.courseSection.teacher.user.name,
            room: e.courseSection.room,
            startMinute: b.startMinute,
            endMinute: b.endMinute,
            isCancelled: b.isCancelled,
            substituteName: b.substituteName,
          })),
      )
      .sort((a, b) => a.startMinute - b.startMinute);

    const windowStart = new Date(now.getTime() - WINDOW_DAYS_BACK * 86_400_000);
    const windowEnd = new Date(now.getTime() + WINDOW_DAYS_FORWARD * 86_400_000);

    const assignments = await tx.assignment.findMany({
      where: {
        courseSectionId: { in: courseSectionIds },
        dueDate: { gte: windowStart, lte: windowEnd },
      },
      include: {
        courseSection: { include: { course: true } },
        submissions: {
          where: { studentProfileId: profile.id },
          include: { grade: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const cards: AssignmentCard[] = assignments.map((a) => {
      const submission = a.submissions[0] ?? null;
      const grade = submission?.grade ?? null;
      const status = computeStatus(
        a.dueDate,
        now,
        submission
          ? {
              submittedAt: submission.submittedAt,
              hasDraftContent: Boolean(
                submission.textContent || submission.linkUrl,
              ),
            }
          : null,
        grade ? { score: grade.score } : null,
      );
      const priority = computePriority(status, a.dueDate, now, a.estimatedMinutes);
      return {
        id: a.id,
        title: a.title,
        courseName: a.courseSection.course.name,
        courseSectionId: a.courseSectionId,
        dueDate: a.dueDate,
        status,
        priority,
        points: a.points,
        score: grade?.score ?? null,
      };
    });

    const upcoming = cards
      .filter((c) => !isDone(c.status) && !isMissing(c.status))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    const missing = cards
      .filter((c) => isMissing(c.status))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    const recentlyGraded = cards
      .filter((c) => c.status === "GRADED")
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())
      .slice(0, 5);

    const announcements = await tx.announcement.findMany({
      where: {
        publishAt: { lte: now },
        audiences: { some: { audienceType: "SCHOOL" } },
      },
      orderBy: { publishAt: "desc" },
      take: 5,
    });

    return {
      studentName: profile.user.name,
      gradeLevel: profile.gradeLevel,
      today,
      upNext: upcoming[0] ?? null,
      missing,
      recentlyGraded,
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        publishAt: a.publishAt,
      })),
    };
  });
}
