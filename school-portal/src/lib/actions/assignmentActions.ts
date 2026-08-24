"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { withTenant } from "@/lib/db";
import { canCreateAssignment } from "@/lib/permissions";

const createSchema = z.object({
  courseSectionId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  instructions: z.string().max(5000).optional(),
  points: z.coerce.number().min(0).max(1000),
  submissionType: z.enum(["FILE", "TEXT", "LINK", "MULTIPLE"]),
  dueDate: z.string().min(1),
  categoryId: z.string().optional(),
  estimatedMinutes: z.coerce.number().min(0).max(600).optional(),
});

export type CreateAssignmentState = { error: string | null };

export async function createAssignmentAction(
  _prevState: CreateAssignmentState,
  formData: FormData,
): Promise<CreateAssignmentState> {
  const session = await requireRole("TEACHER", "ADMIN");
  const parsed = createSchema.safeParse({
    courseSectionId: formData.get("courseSectionId"),
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    instructions: formData.get("instructions") ?? undefined,
    points: formData.get("points"),
    submissionType: formData.get("submissionType"),
    dueDate: formData.get("dueDate"),
    categoryId: formData.get("categoryId") || undefined,
    estimatedMinutes: formData.get("estimatedMinutes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }
  const data = parsed.data;
  const dueDate = new Date(data.dueDate);
  if (Number.isNaN(dueDate.getTime())) return { error: "Enter a valid due date." };

  const criterionDescriptions = formData.getAll("criterion_description").map(String).filter((s) => s.trim());
  const criterionPoints = formData.getAll("criterion_points").map(Number);
  const rubricTitle = String(formData.get("rubricTitle") ?? "").trim();

  try {
    await withTenant(session.schoolId, async (tx) => {
      const section = await tx.courseSection.findUniqueOrThrow({
        where: { id: data.courseSectionId },
        include: { teacher: true },
      });
      if (!canCreateAssignment(session, { teacherUserId: section.teacher.userId, schoolId: session.schoolId })) {
        throw new Error("You don't have permission to create an assignment in this class.");
      }

      const assignment = await tx.assignment.create({
        data: {
          schoolId: session.schoolId,
          courseSectionId: data.courseSectionId,
          categoryId: data.categoryId || null,
          title: data.title,
          description: data.description ?? "",
          instructions: data.instructions ?? "",
          points: data.points,
          submissionType: data.submissionType,
          dueDate,
          estimatedMinutes: data.estimatedMinutes ?? null,
        },
      });

      if (rubricTitle && criterionDescriptions.length > 0) {
        const rubric = await tx.rubric.create({ data: { assignmentId: assignment.id, title: rubricTitle } });
        for (let i = 0; i < criterionDescriptions.length; i++) {
          await tx.rubricCriterion.create({
            data: {
              rubricId: rubric.id,
              description: criterionDescriptions[i],
              points: criterionPoints[i] || 0,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          schoolId: session.schoolId,
          actorUserId: session.userId,
          action: "assignment.create",
          entityType: "Assignment",
          entityId: assignment.id,
          after: { title: data.title, points: data.points, dueDate: dueDate.toISOString() },
        },
      });

    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't create the assignment." };
  }

  revalidatePath(`/teacher/classes/${data.courseSectionId}`);
  redirect(`/teacher/classes/${data.courseSectionId}?tab=assignments`);
}
