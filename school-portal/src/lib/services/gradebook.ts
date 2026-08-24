import "server-only";
import { withTenant } from "@/lib/db";
import { withNotFoundOn404 } from "@/lib/notFound";

export type GradebookGrid = {
  courseName: string;
  sectionName: string;
  students: { studentProfileId: string; name: string }[];
  assignments: { id: string; title: string; points: number }[];
  // cellKey = `${studentProfileId}:${assignmentId}`
  cells: Record<string, { score: number | null; submitted: boolean; submissionId: string | null }>;
};

/** Also enforces the requesting teacher actually teaches this section. */
export async function getGradebookGrid(schoolId: string, userId: string, sectionId: string): Promise<GradebookGrid> {
  return withNotFoundOn404(() => withTenant(schoolId, async (tx) => {
    const profile = await tx.teacherProfile.findUniqueOrThrow({ where: { userId } });
    const section = await tx.courseSection.findFirstOrThrow({
      where: { id: sectionId, teacherProfileId: profile.id },
      include: {
        course: true,
        enrollments: { include: { studentProfile: { include: { user: true } } } },
        assignments: {
          orderBy: { dueDate: "asc" },
          include: { submissions: { include: { grade: true } } },
        },
      },
    });

    const cells: GradebookGrid["cells"] = {};
    for (const assignment of section.assignments) {
      for (const submission of assignment.submissions) {
        cells[`${submission.studentProfileId}:${assignment.id}`] = {
          score: submission.grade?.score ?? null,
          submitted: Boolean(submission.submittedAt),
          submissionId: submission.id,
        };
      }
    }

    return {
      courseName: section.course.name,
      sectionName: section.sectionName,
      students: section.enrollments.map((e) => ({ studentProfileId: e.studentProfileId, name: e.studentProfile.user.name })),
      assignments: section.assignments.map((a) => ({ id: a.id, title: a.title, points: a.points })),
      cells,
    };
  }));
}

export type GradingQueueItem = {
  submissionId: string;
  studentProfileId: string;
  studentName: string;
  textContent: string | null;
  linkUrl: string | null;
  files: { id: string; fileName: string }[];
  submittedAt: Date; // only submitted work reaches the queue — see filter below
  isLate: boolean;
  currentScore: number | null;
  currentFeedback: string;
};

export type GradingQueue = {
  assignmentId: string;
  courseSectionId: string;
  title: string;
  courseName: string;
  points: number;
  rubric: { criteria: { id: string; description: string; points: number }[] } | null;
  items: GradingQueueItem[];
};

/** Also enforces the requesting teacher owns the section this assignment belongs to. */
export async function getGradingQueue(schoolId: string, userId: string, assignmentId: string): Promise<GradingQueue> {
  return withNotFoundOn404(() => withTenant(schoolId, async (tx) => {
    const profile = await tx.teacherProfile.findUniqueOrThrow({ where: { userId } });
    const assignment = await tx.assignment.findFirstOrThrow({
      where: { id: assignmentId, courseSection: { teacherProfileId: profile.id } },
      include: {
        courseSection: { include: { course: true, enrollments: { include: { studentProfile: { include: { user: true } } } } } },
        submissions: { include: { grade: true, files: true } },
        rubric: { include: { criteria: true } },
      },
    });

    const submissionByStudent = new Map(assignment.submissions.map((s) => [s.studentProfileId, s]));

    const items: GradingQueueItem[] = assignment.courseSection.enrollments
      .map((e) => {
        const submission = submissionByStudent.get(e.studentProfileId);
        if (!submission || !submission.submittedAt) return null;
        return {
          submissionId: submission.id,
          studentProfileId: e.studentProfileId,
          studentName: e.studentProfile.user.name,
          textContent: submission.textContent,
          linkUrl: submission.linkUrl,
          files: submission.files.map((f) => ({ id: f.id, fileName: f.fileName })),
          submittedAt: submission.submittedAt,
          isLate: submission.submittedAt > assignment.dueDate,
          currentScore: submission.grade?.score ?? null,
          currentFeedback: submission.grade?.feedback ?? "",
        };
      })
      .filter((x): x is GradingQueueItem => x !== null)
      // Ungraded first, so opening "Grade submissions" lands on real work to do.
      .sort((a, b) => Number(a.currentScore !== null) - Number(b.currentScore !== null));

    return {
      assignmentId: assignment.id,
      courseSectionId: assignment.courseSectionId,
      title: assignment.title,
      courseName: assignment.courseSection.course.name,
      points: assignment.points,
      rubric: assignment.rubric ? { criteria: assignment.rubric.criteria } : null,
      items,
    };
  }));
}
