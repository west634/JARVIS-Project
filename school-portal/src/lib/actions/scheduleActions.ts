"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { withTenant } from "@/lib/db";
import { canManageClassSchedule } from "@/lib/permissions";
import { notifyUsers } from "@/lib/notify";

const cancelSchema = z.object({
  scheduleBlockId: z.string().min(1),
  date: z.string().min(1),
  substituteName: z.string().max(200).optional(),
});

export type CancelClassState = { error: string | null; success: boolean };

export async function cancelClassAction(
  _prevState: CancelClassState,
  formData: FormData,
): Promise<CancelClassState> {
  const session = await requireRole("TEACHER", "ADMIN");
  const parsed = cancelSchema.safeParse({
    scheduleBlockId: formData.get("scheduleBlockId"),
    date: formData.get("date"),
    substituteName: formData.get("substituteName") || undefined,
  });
  if (!parsed.success) return { error: "Pick a date to cancel.", success: false };
  const { scheduleBlockId, date, substituteName } = parsed.data;
  // Parse "YYYY-MM-DD" into a local-midnight Date explicitly — `new
  // Date(dateString)` parses as UTC, which can land on the wrong local day
  // depending on the server's timezone offset.
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!dateParts) return { error: "Enter a valid date.", success: false };
  const cancelledDate = new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]));
  if (Number.isNaN(cancelledDate.getTime())) return { error: "Enter a valid date.", success: false };

  try {
    await withTenant(session.schoolId, async (tx) => {
      const block = await tx.scheduleBlock.findUniqueOrThrow({
        where: { id: scheduleBlockId },
        include: {
          courseSection: {
            include: { teacher: true, course: true, enrollments: { include: { studentProfile: true } } },
          },
        },
      });

      if (
        !canManageClassSchedule(session, {
          teacherUserId: block.courseSection.teacher.userId,
          schoolId: session.schoolId,
        })
      ) {
        throw new Error("You don't have permission to change this class's schedule.");
      }
      if (cancelledDate.getDay() !== block.dayOfWeek) {
        const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        throw new Error(`That class only meets on ${DAY_NAMES[block.dayOfWeek]}s — pick a ${DAY_NAMES[block.dayOfWeek]} date.`);
      }

      await tx.scheduleBlock.update({
        where: { id: scheduleBlockId },
        data: { isCancelled: true, cancelledDate, substituteName: substituteName || null },
      });

      await notifyUsers(
        tx,
        block.courseSection.enrollments.map((e) => e.studentProfile.userId),
        {
          schoolId: session.schoolId,
          category: "SCHEDULE",
          title: `${block.courseSection.course.name} cancelled`,
          body: `${cancelledDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}${substituteName ? ` — substitute: ${substituteName}` : ""}`,
          linkUrl: "/student/schedule",
        },
      );
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't cancel this class.", success: false };
  }

  revalidatePath("/teacher/schedule");
  revalidatePath("/student/schedule");
  return { error: null, success: true };
}
