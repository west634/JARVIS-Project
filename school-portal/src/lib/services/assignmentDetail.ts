import "server-only";
import { withTenant } from "@/lib/db";
import { withNotFoundOn404 } from "@/lib/notFound";
import { computeStatus, computePriority, type AssignmentStatus, type Priority } from "@/lib/services/assignments";

export type AssignmentDetail = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  courseName: string;
  courseSectionId: string;
  teacherName: string;
  points: number;
  submissionType: "FILE" | "TEXT" | "LINK" | "MULTIPLE";
  assignedDate: Date;
  dueDate: Date;
  estimatedMinutes: number | null;
  attachments: { id: string; name: string; url: string; kind: string }[];
  rubric: { title: string; criteria: { id: string; description: string; points: number }[] } | null;
  status: AssignmentStatus;
  priority: Priority;
  submission: {
    id: string;
    textContent: string | null;
    linkUrl: string | null;
    submittedAt: Date | null;
    files: { id: string; fileName: string; mimeType: string; sizeBytes: number }[];
  } | null;
  grade: { score: number; feedback: string; gradedAt: Date } | null;
};

/** Also enforces that the requesting student is actually enrolled in the section. */
export async function getAssignmentDetailForStudent(
  schoolId: string,
  userId: string,
  assignmentId: string,
): Promise<AssignmentDetail> {
  const now = new Date();
  return withNotFoundOn404(() => withTenant(schoolId, async (tx) => {
    const profile = await tx.studentProfile.findUniqueOrThrow({ where: { userId } });

    const assignment = await tx.assignment.findUniqueOrThrow({
      where: { id: assignmentId },
      include: {
        courseSection: { include: { course: true, teacher: { include: { user: true } } } },
        attachments: true,
        rubric: { include: { criteria: true } },
        submissions: {
          where: { studentProfileId: profile.id },
          include: { grade: true, files: true },
        },
      },
    });

    await tx.enrollment.findFirstOrThrow({
      where: { studentProfileId: profile.id, courseSectionId: assignment.courseSectionId },
    });

    const submission = assignment.submissions[0] ?? null;
    const grade = submission?.grade ?? null;
    const status = computeStatus(
      assignment.dueDate,
      now,
      submission ? { submittedAt: submission.submittedAt, hasDraftContent: Boolean(submission.textContent || submission.linkUrl) } : null,
      grade ? { score: grade.score } : null,
    );

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      courseName: assignment.courseSection.course.name,
      courseSectionId: assignment.courseSectionId,
      teacherName: assignment.courseSection.teacher.user.name,
      points: assignment.points,
      submissionType: assignment.submissionType,
      assignedDate: assignment.assignedDate,
      dueDate: assignment.dueDate,
      estimatedMinutes: assignment.estimatedMinutes,
      attachments: assignment.attachments,
      rubric: assignment.rubric
        ? { title: assignment.rubric.title, criteria: assignment.rubric.criteria }
        : null,
      status,
      priority: computePriority(status, assignment.dueDate, now, assignment.estimatedMinutes),
      submission: submission
        ? {
            id: submission.id,
            textContent: submission.textContent,
            linkUrl: submission.linkUrl,
            submittedAt: submission.submittedAt,
            files: submission.files.map((f) => ({ id: f.id, fileName: f.fileName, mimeType: f.mimeType, sizeBytes: f.sizeBytes })),
          }
        : null,
      grade: grade ? { score: grade.score, feedback: grade.feedback, gradedAt: grade.gradedAt } : null,
    };
  }));
}
