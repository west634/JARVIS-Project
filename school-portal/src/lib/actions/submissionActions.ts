"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { withTenant } from "@/lib/db";
import { canSubmitAssignment } from "@/lib/permissions";
import { fileStorage, MAX_FILE_BYTES } from "@/lib/storage/fileStorage";

const payloadSchema = z.object({
  assignmentId: z.string().min(1),
  textContent: z.string().max(20000).optional(),
  linkUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

export type SubmissionActionState = {
  error: string | null;
  success: boolean;
};

async function handle(
  formData: FormData,
  markSubmitted: boolean,
): Promise<SubmissionActionState> {
  const session = await requireRole("STUDENT");
  const parsed = payloadSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    textContent: formData.get("textContent") ?? undefined,
    linkUrl: formData.get("linkUrl") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "That submission wasn't valid — check the link format and try again.", success: false };
  }
  const { assignmentId, textContent, linkUrl } = parsed.data;

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const oversized = files.find((f) => f.size > MAX_FILE_BYTES);
  if (oversized) {
    return { error: `"${oversized.name}" is larger than the ${MAX_FILE_BYTES / 1024 / 1024}MB limit.`, success: false };
  }

  if (!canSubmitAssignment(session, { studentUserId: session.userId, schoolId: session.schoolId })) {
    return { error: "You don't have permission to submit this.", success: false };
  }

  try {
    await withTenant(session.schoolId, async (tx) => {
      const profile = await tx.studentProfile.findUniqueOrThrow({ where: { userId: session.userId } });
      const assignment = await tx.assignment.findUniqueOrThrow({ where: { id: assignmentId } });

      // Confirms real enrollment — a well-formed assignmentId for a class
      // this student isn't in must not be submittable.
      await tx.enrollment.findFirstOrThrow({
        where: { studentProfileId: profile.id, courseSectionId: assignment.courseSectionId },
      });

      const existing = await tx.submission.findUnique({
        where: { assignmentId_studentProfileId: { assignmentId, studentProfileId: profile.id } },
      });

      const data = {
        textContent: textContent || null,
        linkUrl: linkUrl || null,
        ...(markSubmitted ? { submittedAt: new Date() } : {}),
      };

      const submission = existing
        ? await tx.submission.update({ where: { id: existing.id }, data })
        : await tx.submission.create({
            data: {
              schoolId: session.schoolId,
              assignmentId,
              studentProfileId: profile.id,
              ...data,
            },
          });

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const stored = await fileStorage.save({
          subdir: `submissions/${submission.id}`,
          fileName: file.name,
          data: buffer,
        });
        await tx.submissionFile.create({
          data: {
            submissionId: submission.id,
            fileName: file.name,
            storageKey: stored.storageKey,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: stored.sizeBytes,
          },
        });
      }
    });
  } catch {
    // Never leave the student wondering whether it worked (spec §29).
    return {
      error: "Your file hasn't been submitted yet. Please check your connection and try again.",
      success: false,
    };
  }

  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student");
  return { error: null, success: true };
}

export async function submitAssignmentAction(
  _prevState: SubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  return handle(formData, true);
}

export async function saveDraftAction(
  _prevState: SubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  return handle(formData, false);
}
