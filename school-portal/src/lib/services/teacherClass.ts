import "server-only";
import { withTenant } from "@/lib/db";
import { withNotFoundOn404 } from "@/lib/notFound";
import { computeStatus, isMissing, type AssignmentStatus } from "@/lib/services/assignments";

export type TeacherClassSummary = {
  sectionId: string;
  courseName: string;
  sectionName: string;
  studentCount: number;
  ungradedCount: number;
};

export async function listTeacherClasses(schoolId: string, userId: string): Promise<TeacherClassSummary[]> {
  return withTenant(schoolId, async (tx) => {
    const profile = await tx.teacherProfile.findUniqueOrThrow({ where: { userId } });
    const sections = await tx.courseSection.findMany({
      where: { teacherProfileId: profile.id },
      include: {
        course: true,
        enrollments: true,
        assignments: { include: { submissions: { include: { grade: true } } } },
      },
    });
    return sections.map((s) => ({
      sectionId: s.id,
      courseName: s.course.name,
      sectionName: s.sectionName,
      studentCount: s.enrollments.length,
      ungradedCount: s.assignments.reduce(
        (sum, a) => sum + a.submissions.filter((sub) => sub.submittedAt && !sub.grade).length,
        0,
      ),
    }));
  });
}

export type TeacherClassAssignment = {
  id: string;
  title: string;
  dueDate: Date;
  points: number;
  submittedCount: number;
  ungradedCount: number;
  missingCount: number;
  totalStudents: number;
};

export type AssignmentFormContext = {
  courseName: string;
  sectionName: string;
  categories: { id: string; name: string }[];
};

/** Also enforces the requesting teacher actually teaches this section. */
export async function getAssignmentFormContext(
  schoolId: string,
  userId: string,
  sectionId: string,
): Promise<AssignmentFormContext> {
  return withNotFoundOn404(() => withTenant(schoolId, async (tx) => {
    const profile = await tx.teacherProfile.findUniqueOrThrow({ where: { userId } });
    const section = await tx.courseSection.findFirstOrThrow({
      where: { id: sectionId, teacherProfileId: profile.id },
      include: { course: true, assignmentCategories: true },
    });
    return {
      courseName: section.course.name,
      sectionName: section.sectionName,
      categories: section.assignmentCategories.map((c) => ({ id: c.id, name: c.name })),
    };
  }));
}

export type TeacherClassDetail = {
  courseName: string;
  sectionName: string;
  room: string | null;
  roster: { studentProfileId: string; name: string }[];
  assignments: TeacherClassAssignment[];
  resources: { id: string; title: string; url: string; kind: string }[];
};

/** Also enforces that the requesting teacher actually teaches this section. */
export async function getTeacherClassDetail(
  schoolId: string,
  userId: string,
  sectionId: string,
): Promise<TeacherClassDetail> {
  const now = new Date();
  return withNotFoundOn404(() => withTenant(schoolId, async (tx) => {
    const profile = await tx.teacherProfile.findUniqueOrThrow({ where: { userId } });
    const section = await tx.courseSection.findFirstOrThrow({
      where: { id: sectionId, teacherProfileId: profile.id },
      include: {
        course: true,
        resources: true,
        enrollments: { include: { studentProfile: { include: { user: true } } } },
        assignments: {
          include: { submissions: { include: { grade: true } } },
          orderBy: { dueDate: "desc" },
        },
      },
    });

    const totalStudents = section.enrollments.length;
    const assignments: TeacherClassAssignment[] = section.assignments.map((a) => {
      const submittedCount = a.submissions.filter((s) => s.submittedAt).length;
      const ungradedCount = a.submissions.filter((s) => s.submittedAt && !s.grade).length;
      const submittedIds = new Set(a.submissions.filter((s) => s.submittedAt).map((s) => s.studentProfileId));
      const missingCount = section.enrollments.filter((e) => {
        if (submittedIds.has(e.studentProfileId)) return false;
        const status: AssignmentStatus = computeStatus(a.dueDate, now, null, null);
        return isMissing(status);
      }).length;
      return {
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        points: a.points,
        submittedCount,
        ungradedCount,
        missingCount,
        totalStudents,
      };
    });

    return {
      courseName: section.course.name,
      sectionName: section.sectionName,
      room: section.room,
      roster: section.enrollments.map((e) => ({ studentProfileId: e.studentProfileId, name: e.studentProfile.user.name })),
      assignments,
      resources: section.resources,
    };
  }));
}
