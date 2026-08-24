import { describe, it, expect } from "vitest";
import { computeStatus, computePriority, isMissing, isDone } from "@/lib/services/assignments";

const NOW = new Date("2026-08-24T12:00:00Z");
const dueIn = (hours: number) => new Date(NOW.getTime() + hours * 60 * 60 * 1000);

describe("computeStatus", () => {
  it("is UPCOMING when not due yet and nothing submitted", () => {
    expect(computeStatus(dueIn(24), NOW, null, null)).toBe("UPCOMING");
  });

  it("is IN_PROGRESS when a draft exists before the due date", () => {
    const status = computeStatus(dueIn(24), NOW, { submittedAt: null, hasDraftContent: true }, null);
    expect(status).toBe("IN_PROGRESS");
  });

  it("is MISSING when past due with no submission", () => {
    expect(computeStatus(dueIn(-1), NOW, null, null)).toBe("MISSING");
  });

  it("is MISSING when past due with only an unsubmitted draft", () => {
    const status = computeStatus(dueIn(-1), NOW, { submittedAt: null, hasDraftContent: true }, null);
    expect(status).toBe("MISSING");
  });

  it("is SUBMITTED when submitted before the due date", () => {
    const submittedAt = dueIn(-2);
    const status = computeStatus(dueIn(1), NOW, { submittedAt, hasDraftContent: false }, null);
    expect(status).toBe("SUBMITTED");
  });

  it("is LATE when submitted after the due date", () => {
    const dueDate = dueIn(-2);
    const submittedAt = dueIn(-1); // after dueDate, before now
    const status = computeStatus(dueDate, NOW, { submittedAt, hasDraftContent: false }, null);
    expect(status).toBe("LATE");
  });

  it("is GRADED once a grade exists, regardless of submission timing", () => {
    const status = computeStatus(dueIn(-5), NOW, { submittedAt: dueIn(-4), hasDraftContent: false }, { score: 95 });
    expect(status).toBe("GRADED");
  });

  it("never silently drifts: a graded submission is never reported MISSING", () => {
    // Regression guard for the exact Blackbaud bug class in RESEARCH.md §2 —
    // status must be derived from real data, not a separately stored flag
    // that can fall out of sync.
    const status = computeStatus(dueIn(-100), NOW, null, { score: 80 });
    expect(status).toBe("GRADED");
  });
});

describe("computePriority", () => {
  it("is null for finished work", () => {
    expect(computePriority("SUBMITTED", dueIn(5), NOW, 30)).toBeNull();
    expect(computePriority("GRADED", dueIn(-5), NOW, 30)).toBeNull();
  });

  it("is HIGH for missing work", () => {
    expect(computePriority("MISSING", dueIn(-1), NOW, 30)).toBe("HIGH");
  });

  it("is HIGH when due soon relative to estimated effort", () => {
    // 2 hours until due, 90 minutes of estimated effort — due imminently.
    expect(computePriority("UPCOMING", dueIn(2), NOW, 90)).toBe("HIGH");
  });

  it("is MEDIUM when due within a few days but not urgent", () => {
    expect(computePriority("UPCOMING", dueIn(48), NOW, 30)).toBe("MEDIUM");
  });

  it("is LOW when due date is far away", () => {
    expect(computePriority("UPCOMING", dueIn(24 * 10), NOW, 30)).toBe("LOW");
  });
});

describe("isMissing / isDone", () => {
  it("agree with each other and are mutually exclusive", () => {
    const statuses = ["UPCOMING", "IN_PROGRESS", "SUBMITTED", "LATE", "MISSING", "GRADED", "RETURNED"] as const;
    for (const s of statuses) {
      expect(isMissing(s) && isDone(s)).toBe(false);
    }
    expect(isMissing("MISSING")).toBe(true);
    expect(isDone("SUBMITTED")).toBe(true);
    expect(isDone("LATE")).toBe(true);
    expect(isDone("GRADED")).toBe(true);
  });
});
