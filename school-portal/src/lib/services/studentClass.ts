import "server-only";
import { withTenant } from "@/lib/db";
import { withNotFoundOn404 } from "@/lib/notFound";
import { computeStatus, computePriority, type AssignmentStatus, type Priority } from "@/lib/services/assignments";
import { computeCategoryGrades, computeWeightedGrade, type CategoryGrade } from "@/lib/services/grades";

export type StudentClassSummary = {
  sectionId: string;
  courseName: string;
  sectionName: string;
  teacherName: string;
  room: string | null;
  currentGrade: number | null;
  nextAssignment: { id: string; title: string; dueDate: Date } | null;
  upcomingCount: number;
};

export async function listStudentClasses(schoolId: string, userId: string): Promise<StudentClassSummary[]> {
  const now = new Date();
  return withTenant(schoolId, async (tx) => {
    const profile = await tx.studentProfile.findUniqueOrThrow({ where: { userId } });
    const enrollments = await tx.enrollment.findMany({
      where: { studentProfileId: profile.id },
      include: {
        courseSection: {
          include: {
            course: true,
            teacher: { include: { user: true } },
            assignmentCategories: true,
            assignments: {
              include: { submissions: { where: { studentProfileId: profile.id }, include: { grade: true } } },
            },
          },
        },
      },
    });

    return enrollments.map((e) => {
      const section = e.courseSection;
      const gradedItems = section.assignments
        .map((a) => {
          const grade = a.submissions[0]?.grade;
          return grade ? { categoryId: a.categoryId, points: a.points, score: grade.score } : null;
        })
        .filter((x): x is { categoryId: string | null; points: number; score: number } => x !== null);
      const categoryGrades = computeCategoryGrades(gradedItems, section.assignmentCategories);
      const currentGrade = computeWeightedGrade(categoryGrades);

      const upcoming = section.assignments
        .filter((a) => {
          const submission = a.submissions[0];
          const status = computeStatus(
            a.dueDate,
            now,
            submission ? { submittedAt: submission.submittedAt, hasDraftContent: Boolean(submission.textContent || submission.linkUrl) } : null,
            submission?.grade ? { score: submission.grade.score } : null,
          );
          return status === "UPCOMING" || status === "IN_PROGRESS";
        })
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      return {
        sectionId: section.id,
        courseName: section.course.name,
        sectionName: section.sectionName,
        teacherName: section.teacher.user.name,
        room: section.room,
        currentGrade,
        nextAssignment: upcoming[0] ? { id: upcoming[0].id, title: upcoming[0].title, dueDate: upcoming[0].dueDate } : null,
        upcomingCount: upcoming.length,
      };
    });
  });
}

export type StudentClassAssignment = {
  id: string;
  title: string;
  dueDate: Date;
  points: number;
  status: AssignmentStatus;
  priority: Priority;
  score: number | null;
};

export type StudentClassDetail = {
  courseName: string;
  sectionName: string;
  teacherName: string;
  room: string | null;
  assignments: StudentClassAssignment[];
  categoryGrades: CategoryGrade[];
  currentGrade: number | null;
  resources: { id: string; title: string; url: string; kind: string }[];
  announcements: { id: string; title: string; body: string; publishAt: Date }[];
};

export async function getStudentClassDetail(
  schoolId: string,
  userId: string,
  sectionId: string,
): Promise<StudentClassDetail> {
  const now = new Date();
  return withNotFoundOn404(() => withTenant(schoolId, async (tx) => {
    const profile = await tx.studentProfile.findUniqueOrThrow({ where: { userId } });
    // Enforces the student is actually enrolled — anyone else's sectionId 404s upstream.
    await tx.enrollment.findFirstOrThrow({ where: { studentProfileId: profile.id, courseSectionId: sectionId } });

    const section = await tx.courseSection.findUniqueOrThrow({
      where: { id: sectionId },
      include: {
        course: true,
        teacher: { include: { user: true } },
        assignmentCategories: true,
        resources: true,
        assignments: {
          include: { submissions: { where: { studentProfileId: profile.id }, include: { grade: true } } },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    const assignments: StudentClassAssignment[] = section.assignments.map((a) => {
      const submission = a.submissions[0] ?? null;
      const grade = submission?.grade ?? null;
      const status = computeStatus(
        a.dueDate,
        now,
        submission ? { submittedAt: submission.submittedAt, hasDraftContent: Boolean(submission.textContent || submission.linkUrl) } : null,
        grade ? { score: grade.score } : null,
      );
      return {
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        points: a.points,
        status,
        priority: computePriority(status, a.dueDate, now, a.estimatedMinutes),
        score: grade?.score ?? null,
      };
    });

    const gradedItems = section.assignments
      .map((a) => {
        const grade = a.submissions[0]?.grade;
        return grade ? { categoryId: a.categoryId, points: a.points, score: grade.score } : null;
      })
      .filter((x): x is { categoryId: string | null; points: number; score: number } => x !== null);
    const categoryGrades = computeCategoryGrades(gradedItems, section.assignmentCategories);

    const announcements = await tx.announcement.findMany({
      where: { publishAt: { lte: now }, audiences: { some: { audienceType: "COURSE_SECTION", courseSectionId: sectionId } } },
      orderBy: { publishAt: "desc" },
      take: 5,
    });

    return {
      courseName: section.course.name,
      sectionName: section.sectionName,
      teacherName: section.teacher.user.name,
      room: section.room,
      assignments,
      categoryGrades,
      currentGrade: computeWeightedGrade(categoryGrades),
      resources: section.resources,
      announcements: announcements.map((a) => ({ id: a.id, title: a.title, body: a.body, publishAt: a.publishAt })),
    };
  }));
}
