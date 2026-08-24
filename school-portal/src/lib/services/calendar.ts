import "server-only";
import { withTenant } from "@/lib/db";
import { expandScheduleBlocks, dateKey } from "@/lib/services/calendarLogic";
import type { CalendarEventCategory } from "@/generated/prisma/enums";

export type CalendarItemKind = CalendarEventCategory | "ASSIGNMENT";

export type CalendarItem = {
  id: string;
  kind: CalendarItemKind;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string | null;
  detail: string | null;
  href: string | null;
  isCancelled: boolean;
  substituteName: string | null;
};

function atMinute(date: Date, minute: number): Date {
  const d = new Date(date);
  d.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
  return d;
}

export async function getStudentCalendarItems(
  schoolId: string,
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarItem[]> {
  return withTenant(schoolId, async (tx) => {
    const profile = await tx.studentProfile.findUniqueOrThrow({ where: { userId } });
    const enrollments = await tx.enrollment.findMany({
      where: { studentProfileId: profile.id },
      include: { courseSection: { include: { course: true, scheduleBlocks: true } } },
    });
    const courseSectionIds = enrollments.map((e) => e.courseSectionId);

    const assignments = await tx.assignment.findMany({
      where: { courseSectionId: { in: courseSectionIds }, dueDate: { gte: rangeStart, lte: rangeEnd } },
      include: { courseSection: { include: { course: true } } },
    });

    const events = await tx.calendarEvent.findMany({
      where: { startAt: { lte: rangeEnd }, endAt: { gte: rangeStart } },
      include: { courseSection: { include: { course: true } } },
    });

    const items: CalendarItem[] = [];

    for (const e of enrollments) {
      const occurrences = expandScheduleBlocks(e.courseSection.scheduleBlocks, rangeStart, rangeEnd);
      for (const occ of occurrences) {
        items.push({
          id: `class-${occ.courseSectionId}-${dateKey(occ.date)}`,
          kind: "CLASS",
          title: e.courseSection.course.name,
          start: atMinute(occ.date, occ.startMinute),
          end: atMinute(occ.date, occ.endMinute),
          allDay: false,
          location: e.courseSection.room,
          detail: occ.isCancelled ? "Class cancelled" : null,
          href: `/student/classes/${occ.courseSectionId}`,
          isCancelled: occ.isCancelled,
          substituteName: occ.substituteName,
        });
      }
    }

    for (const a of assignments) {
      items.push({
        id: `assignment-${a.id}`,
        kind: "ASSIGNMENT",
        title: a.title,
        start: a.dueDate,
        end: a.dueDate,
        allDay: false,
        location: null,
        detail: a.courseSection.course.name,
        href: `/student/assignments/${a.id}`,
        isCancelled: false,
        substituteName: null,
      });
    }

    for (const ev of events) {
      items.push({
        id: `event-${ev.id}`,
        kind: ev.category,
        title: ev.title,
        start: ev.startAt,
        end: ev.endAt,
        allDay: ev.allDay,
        location: ev.location,
        detail: ev.courseSection?.course.name ?? ev.description ?? null,
        href: ev.courseSectionId ? `/student/classes/${ev.courseSectionId}` : null,
        isCancelled: false,
        substituteName: null,
      });
    }

    return items.sort((a, b) => a.start.getTime() - b.start.getTime());
  });
}

export async function getTeacherCalendarItems(
  schoolId: string,
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarItem[]> {
  return withTenant(schoolId, async (tx) => {
    const profile = await tx.teacherProfile.findUniqueOrThrow({ where: { userId } });
    const sections = await tx.courseSection.findMany({
      where: { teacherProfileId: profile.id },
      include: { course: true, scheduleBlocks: true },
    });
    const courseSectionIds = sections.map((s) => s.id);

    const assignments = await tx.assignment.findMany({
      where: { courseSectionId: { in: courseSectionIds }, dueDate: { gte: rangeStart, lte: rangeEnd } },
      include: { courseSection: { include: { course: true } } },
    });

    const events = await tx.calendarEvent.findMany({
      where: { startAt: { lte: rangeEnd }, endAt: { gte: rangeStart } },
      include: { courseSection: { include: { course: true } } },
    });

    const items: CalendarItem[] = [];

    for (const s of sections) {
      const occurrences = expandScheduleBlocks(s.scheduleBlocks, rangeStart, rangeEnd);
      for (const occ of occurrences) {
        items.push({
          id: `class-${occ.courseSectionId}-${dateKey(occ.date)}`,
          kind: "CLASS",
          title: `${s.course.name} · ${s.sectionName}`,
          start: atMinute(occ.date, occ.startMinute),
          end: atMinute(occ.date, occ.endMinute),
          allDay: false,
          location: s.room,
          detail: occ.isCancelled ? "Class cancelled" : null,
          href: `/teacher/classes/${occ.courseSectionId}`,
          isCancelled: occ.isCancelled,
          substituteName: occ.substituteName,
        });
      }
    }

    for (const a of assignments) {
      items.push({
        id: `assignment-${a.id}`,
        kind: "ASSIGNMENT",
        title: a.title,
        start: a.dueDate,
        end: a.dueDate,
        allDay: false,
        location: null,
        detail: `${a.courseSection.course.name} due`,
        href: `/teacher/grade/${a.id}`,
        isCancelled: false,
        substituteName: null,
      });
    }

    for (const ev of events) {
      items.push({
        id: `event-${ev.id}`,
        kind: ev.category,
        title: ev.title,
        start: ev.startAt,
        end: ev.endAt,
        allDay: ev.allDay,
        location: ev.location,
        detail: ev.courseSection?.course.name ?? ev.description ?? null,
        href: ev.courseSectionId ? `/teacher/classes/${ev.courseSectionId}` : null,
        isCancelled: false,
        substituteName: null,
      });
    }

    return items.sort((a, b) => a.start.getTime() - b.start.getTime());
  });
}
