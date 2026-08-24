import { describe, it, expect } from "vitest";
import {
  expandScheduleBlocks,
  getMonthGridDates,
  getWeekDates,
  groupByDateKey,
  dateKey,
  isSameDay,
  shiftAnchorDate,
  getRangeForView,
} from "@/lib/services/calendarLogic";

describe("expandScheduleBlocks", () => {
  const monday = new Date(2026, 7, 24); // Aug 24 2026 is a Monday
  const block = {
    courseSectionId: "sec-1",
    dayOfWeek: 1, // Monday
    startMinute: 540,
    endMinute: 590,
    isCancelled: false,
    cancelledDate: null,
    substituteName: null,
  };

  it("produces one occurrence per matching weekday in range", () => {
    const rangeEnd = new Date(2026, 7, 24 + 13); // two weeks later
    const occurrences = expandScheduleBlocks([block], monday, rangeEnd);
    expect(occurrences).toHaveLength(2);
    expect(occurrences[0].date.getDay()).toBe(1);
  });

  it("produces nothing for a range with no matching weekday", () => {
    const tuesdayOnly = new Date(2026, 7, 25);
    const occurrences = expandScheduleBlocks([block], tuesdayOnly, tuesdayOnly);
    expect(occurrences).toHaveLength(0);
  });

  it("marks the specific cancelled date, not every occurrence of that weekday", () => {
    const nextMonday = new Date(2026, 7, 31);
    const cancelledBlock = { ...block, isCancelled: true, cancelledDate: nextMonday, substituteName: "Mr. Lee" };
    const rangeEnd = new Date(2026, 7, 24 + 13);
    const occurrences = expandScheduleBlocks([cancelledBlock], monday, rangeEnd);
    expect(occurrences).toHaveLength(2);
    const [first, second] = occurrences;
    expect(isSameDay(first.date, monday)).toBe(true);
    expect(first.isCancelled).toBe(false);
    expect(isSameDay(second.date, nextMonday)).toBe(true);
    expect(second.isCancelled).toBe(true);
    expect(second.substituteName).toBe("Mr. Lee");
  });
});

describe("getMonthGridDates", () => {
  it("returns 42 dates covering full weeks, starting on a Sunday", () => {
    const dates = getMonthGridDates(2026, 7); // August 2026
    expect(dates).toHaveLength(42);
    expect(dates[0].getDay()).toBe(0);
    expect(dates.every((d) => d.getDay() === (dates[0].getDay() + dates.indexOf(d)) % 7)).toBe(true);
  });

  it("includes the 1st and last day of the target month", () => {
    const dates = getMonthGridDates(2026, 7);
    const keys = dates.map(dateKey);
    expect(keys).toContain("2026-08-01");
    expect(keys).toContain("2026-08-31");
  });
});

describe("getWeekDates", () => {
  it("returns 7 consecutive dates starting on Sunday", () => {
    const dates = getWeekDates(new Date(2026, 7, 26)); // a Wednesday
    expect(dates).toHaveLength(7);
    expect(dates[0].getDay()).toBe(0);
    expect(dates[6].getDay()).toBe(6);
  });
});

describe("shiftAnchorDate", () => {
  it("shifts by the correct unit per view", () => {
    const d = new Date(2026, 7, 24); // Aug 24 2026
    expect(shiftAnchorDate(d, "day", 1).getDate()).toBe(25);
    expect(dateKey(shiftAnchorDate(d, "week", 1))).toBe("2026-08-31");
    expect(shiftAnchorDate(d, "month", 1).getMonth()).toBe(8); // September
    expect(dateKey(shiftAnchorDate(d, "agenda", -1))).toBe("2026-07-25");
  });
});

describe("getRangeForView", () => {
  it("day view range is just that day", () => {
    const d = new Date(2026, 7, 24, 15, 30);
    const { start, end } = getRangeForView(d, "day");
    expect(dateKey(start)).toBe("2026-08-24");
    expect(dateKey(end)).toBe("2026-08-24");
    expect(end.getHours()).toBe(23);
  });

  it("month view range covers the full padded grid", () => {
    const { start, end } = getRangeForView(new Date(2026, 7, 24), "month");
    expect(start.getTime()).toBeLessThanOrEqual(new Date(2026, 7, 1).getTime());
    expect(end.getTime()).toBeGreaterThanOrEqual(new Date(2026, 7, 31).getTime());
  });

  it("agenda view range is a 30-day rolling window from the anchor", () => {
    const { start, end } = getRangeForView(new Date(2026, 7, 24), "agenda");
    expect(dateKey(start)).toBe("2026-08-24");
    expect(dateKey(end)).toBe("2026-09-23"); // 30 days after the anchor, inclusive
  });
});

describe("groupByDateKey", () => {
  it("groups and sorts items by date", () => {
    const items = [
      { start: new Date(2026, 7, 24, 14, 0), label: "late" },
      { start: new Date(2026, 7, 24, 9, 0), label: "early" },
      { start: new Date(2026, 7, 25, 9, 0), label: "next day" },
    ];
    const grouped = groupByDateKey(items);
    expect(grouped.size).toBe(2);
    expect(grouped.get("2026-08-24")?.map((i) => i.label)).toEqual(["early", "late"]);
  });
});
