"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { withTenant } from "@/lib/db";
import { canGradeSubmission } from "@/lib/permissions";
import { notifyUser } from "@/lib/notify";

export type GradeActionResult = { error: string | null };

const gradeSchema = z.object({
  submissionId: z.string().min(1),
  score: z.coerce.number().min(0),
  feedback: z.string().max(5000).optional(),
});

export async function gradeSubmissionAction(input: {
  submissionId: string;
  score: number;
  feedback?: string;
}): Promise<GradeActionResult> {
  const session = await requireRole("TEACHER", "ADMIN");
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid score." };
  const { submissionId, score, feedback } = parsed.data;

  try {
    await withTenant(session.schoolId, async (tx) => {
      const submission = await tx.submission.findUniqueOrThrow({
        where: { id: submissionId },
        include: {
          assignment: { include: { courseSection: { include: { teacher: true, course: true } } } },
          studentProfile: true,
          grade: true,
        },
      });

      if (
        !canGradeSubmission(session, {
          teacherUserId: submission.assignment.courseSection.teacher.userId,
          schoolId: session.schoolId,
        })
      ) {
        throw new Error("You don't have permission to grade this.");
      }
      if (score > submission.assignment.points) {
        throw new Error(`Score can't exceed ${submission.assignment.points} points.`);
      }

      if (submission.grade) {
        // Preserve the prior value before overwriting — this is the entire
        // grade history / undo mechanism (spec §13), not a bolted-on log.
        await tx.gradeHistory.create({
          data: {
            gradeId: submission.grade.id,
            score: submission.grade.score,
            feedback: submission.grade.feedback,
            changedById: session.userId,
          },
        });
        await tx.grade.update({
          where: { id: submission.grade.id },
          data: { score, feedback: feedback ?? "", gradedById: session.userId, gradedAt: new Date() },
        });
      } else {
        await tx.grade.create({
          data: {
            schoolId: session.schoolId,
            submissionId,
            score,
            feedback: feedback ?? "",
            gradedById: session.userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          schoolId: session.schoolId,
          actorUserId: session.userId,
          action: submission.grade ? "grade.update" : "grade.create",
          entityType: "Submission",
          entityId: submissionId,
          before: submission.grade ? { score: submission.grade.score, feedback: submission.grade.feedback } : undefined,
          after: { score, feedback: feedback ?? "" },
        },
      });

      await notifyUser(tx, submission.studentProfile.userId, {
        schoolId: session.schoolId,
        category: "GRADE",
        title: `Grade posted: ${submission.assignment.title}`,
        body: `${submission.assignment.courseSection.course.name} — ${score}/${submission.assignment.points}`,
        linkUrl: `/student/assignments/${submission.assignmentId}`,
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't save that grade." };
  }

  revalidatePath("/teacher");
  return { error: null };
}

/**
 * Restores the most recent prior value from GradeHistory (or removes the
 * grade entirely if there is no prior value — i.e. undoing the first grade
 * given).
 */
export async function undoGradeAction(submissionId: string): Promise<GradeActionResult> {
  const session = await requireRole("TEACHER", "ADMIN");

  try {
    await withTenant(session.schoolId, async (tx) => {
      const submission = await tx.submission.findUniqueOrThrow({
        where: { id: submissionId },
        include: {
          assignment: { include: { courseSection: { include: { teacher: true } } } },
          grade: { include: { history: { orderBy: { changedAt: "desc" }, take: 1 } } },
        },
      });
      if (!submission.grade) return;

      if (
        !canGradeSubmission(session, {
          teacherUserId: submission.assignment.courseSection.teacher.userId,
          schoolId: session.schoolId,
        })
      ) {
        throw new Error("You don't have permission to undo this.");
      }

      const previous = submission.grade.history[0];
      const before = { score: submission.grade.score, feedback: submission.grade.feedback };

      if (previous) {
        await tx.grade.update({
          where: { id: submission.grade.id },
          data: { score: previous.score, feedback: previous.feedback, gradedById: session.userId, gradedAt: new Date() },
        });
        await tx.gradeHistory.delete({ where: { id: previous.id } });
      } else {
        await tx.grade.delete({ where: { id: submission.grade.id } });
      }

      await tx.auditLog.create({
        data: {
          schoolId: session.schoolId,
          actorUserId: session.userId,
          action: "grade.undo",
          entityType: "Submission",
          entityId: submissionId,
          before,
          after: previous ? { score: previous.score, feedback: previous.feedback } : undefined,
        },
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't undo that grade." };
  }

  revalidatePath("/teacher");
  return { error: null };
}
