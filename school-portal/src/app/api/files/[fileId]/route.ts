import { requireSession } from "@/lib/auth/guards";
import { withTenant } from "@/lib/db";
import { fileStorage } from "@/lib/storage/fileStorage";
import { canAccessSubmissionFile } from "@/lib/permissions";
import { getGuardianStudentUserIds } from "@/lib/services/guardians";

/**
 * Every submission file is served through here, never as a static asset —
 * this is what actually enforces "only the student, their teacher, an
 * admin, or a linked guardian can see this file" (SECURITY.md), since a
 * static /uploads URL would have no way to check that per request.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/files/[fileId]">) {
  const session = await requireSession();
  const { fileId } = await ctx.params;

  const file = await withTenant(session.schoolId, async (tx) => {
    const submissionFile = await tx.submissionFile.findUnique({
      where: { id: fileId },
      include: {
        submission: {
          include: {
            studentProfile: { include: { user: true } },
            assignment: { include: { courseSection: { include: { teacher: { include: { user: true } } } } } },
          },
        },
      },
    });
    if (!submissionFile) return null;

    const guardianStudentIds =
      session.role === "PARENT" ? await getGuardianStudentUserIds(tx, session.userId) : [];

    const allowed = canAccessSubmissionFile(
      session,
      {
        studentUserId: submissionFile.submission.studentProfile.user.id,
        teacherUserId: submissionFile.submission.assignment.courseSection.teacher.user.id,
        schoolId: session.schoolId,
      },
      guardianStudentIds,
    );
    if (!allowed) return null;

    return submissionFile;
  });

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const data = await fileStorage.read(file.storageKey);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
