/**
 * Pure, DB-agnostic calendar math. No Prisma/Next imports, so it's unit
 * testable in isolation and safe to reuse client-side later if needed.
 */

export type ScheduleBlockLike = {
  courseSectionId: string;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startMinute: number;
  endMinute: number;
  isCancelled: boolean;
  cancelledDate: Date | null;
  substituteName: string | null;
};

export type ClassOccurrence = {
  courseSectionId: string;
  date: Date; // local midnight of the occurrence's day
  startMinute: number;
  endMinute: number;
  isCancelled: boolean;
  substituteName: string | null;
};

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Materializes recurring weekly ScheduleBlocks into concrete date
 * occurrences within [rangeStart, rangeEnd] (inclusive), applying the
 * block's single recorded cancellation (if it falls on that date).
 */
export function expandScheduleBlocks(
  blocks: readonly ScheduleBlockLike[],
  rangeStart: Date,
  rangeEnd: Date,
): ClassOccurrence[] {
  const occurrences: ClassOccurrence[] = [];
  const cursor = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);

  while (cursor.getTime() <= end.getTime()) {
    const dow = cursor.getDay();
    for (const block of blocks) {
      if (block.dayOfWeek !== dow) continue;
      const isCancelledToday =
        block.isCancelled && block.cancelledDate !== null && isSameDay(block.cancelledDate, cursor);
      occurrences.push({
        courseSectionId: block.courseSectionId,
        date: new Date(cursor),
        startMinute: block.startMinute,
        endMinute: block.endMinute,
        isCancelled: isCancelledToday,
        substituteName: isCancelledToday ? block.substituteName : null,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return occurrences;
}

/** Full 6-week (42-day) grid for a month view, padded with adjacent-month dates. */
export function getMonthGridDates(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const gridStart = new Date(year, month, 1 - startPad);
  const dates: Date[] = [];
  for (let i = 0; i < 42; i++) {
    dates.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return dates;
}

/** The 7 dates (Sunday-first) of the week containing `date`. */
export function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

/** Moves the calendar's anchor date by one "page" of the given view. */
export function shiftAnchorDate(date: Date, view: CalendarViewMode, direction: 1 | -1): Date {
  const d = new Date(date);
  if (view === "month") d.setMonth(d.getMonth() + direction);
  else if (view === "week") d.setDate(d.getDate() + 7 * direction);
  else if (view === "day") d.setDate(d.getDate() + direction);
  else d.setDate(d.getDate() + 30 * direction); // agenda: shift the whole rolling window
  return d;
}

/** The date range of data a view needs to fetch to render around `date`. */
export function getRangeForView(date: Date, view: CalendarViewMode): { start: Date; end: Date } {
  if (view === "month") {
    const grid = getMonthGridDates(date.getFullYear(), date.getMonth());
    return { start: startOfDay(grid[0]), end: endOfDay(grid[grid.length - 1]) };
  }
  if (view === "week") {
    const week = getWeekDates(date);
    return { start: startOfDay(week[0]), end: endOfDay(week[6]) };
  }
  if (view === "day") {
    return { start: startOfDay(date), end: endOfDay(date) };
  }
  const start = startOfDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return { start, end: endOfDay(end) };
}

export function groupByDateKey<T extends { start: Date }>(items: readonly T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = dateKey(item.start);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  return map;
}
