import "server-only";
import { withTenant } from "@/lib/db";
import { isSameDay } from "@/lib/services/calendarLogic";

export type ScheduleEntry = {
  scheduleBlockId: string;
  courseSectionId: string;
  courseName: string;
  withWhom: string; // teacher name (student view) or student count label (teacher view)
  room: string | null;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  isCancelledToday: boolean;
  substituteName: string | null;
};

const now = () => new Date();

export async function getStudentWeeklySchedule(schoolId: string, userId: string): Promise<ScheduleEntry[]> {
  const today = now();
  return withTenant(schoolId, async (tx) => {
    const profile = await tx.studentProfile.findUniqueOrThrow({ where: { userId } });
    const enrollments = await tx.enrollment.findMany({
      where: { studentProfileId: profile.id },
      include: {
        courseSection: { include: { course: true, teacher: { include: { user: true } }, scheduleBlocks: true } },
      },
    });

    const entries: ScheduleEntry[] = [];
    for (const e of enrollments) {
      for (const b of e.courseSection.scheduleBlocks) {
        const isCancelledToday = b.isCancelled && b.cancelledDate !== null && isSameDay(b.cancelledDate, today);
        entries.push({
          scheduleBlockId: b.id,
          courseSectionId: e.courseSectionId,
          courseName: e.courseSection.course.name,
          withWhom: e.courseSection.teacher.user.name,
          room: e.courseSection.room,
          dayOfWeek: b.dayOfWeek,
          startMinute: b.startMinute,
          endMinute: b.endMinute,
          isCancelledToday,
          substituteName: isCancelledToday ? b.substituteName : null,
        });
      }
    }
    return entries.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinute - b.startMinute);
  });
}

export async function getTeacherWeeklySchedule(schoolId: string, userId: string): Promise<ScheduleEntry[]> {
  const today = now();
  return withTenant(schoolId, async (tx) => {
    const profile = await tx.teacherProfile.findUniqueOrThrow({ where: { userId } });
    const sections = await tx.courseSection.findMany({
      where: { teacherProfileId: profile.id },
      include: { course: true, scheduleBlocks: true, enrollments: true },
    });

    const entries: ScheduleEntry[] = [];
    for (const s of sections) {
      for (const b of s.scheduleBlocks) {
        const isCancelledToday = b.isCancelled && b.cancelledDate !== null && isSameDay(b.cancelledDate, today);
        entries.push({
          scheduleBlockId: b.id,
          courseSectionId: s.id,
          courseName: `${s.course.name} · ${s.sectionName}`,
          withWhom: `${s.enrollments.length} students`,
          room: s.room,
          dayOfWeek: b.dayOfWeek,
          startMinute: b.startMinute,
          endMinute: b.endMinute,
          isCancelledToday,
          substituteName: isCancelledToday ? b.substituteName : null,
        });
      }
    }
    return entries.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinute - b.startMinute);
  });
}
