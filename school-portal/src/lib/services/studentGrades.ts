import "server-only";
import { withTenant } from "@/lib/db";
import { computeCategoryGrades, computeWeightedGrade, type CategoryGrade } from "@/lib/services/grades";

export type ClassGradeSummary = {
  sectionId: string;
  courseName: string;
  currentGrade: number | null;
  categoryGrades: CategoryGrade[];
};

export async function getStudentGradesOverview(schoolId: string, userId: string): Promise<ClassGradeSummary[]> {
  return withTenant(schoolId, async (tx) => {
    const profile = await tx.studentProfile.findUniqueOrThrow({ where: { userId } });
    const enrollments = await tx.enrollment.findMany({
      where: { studentProfileId: profile.id },
      include: {
        courseSection: {
          include: {
            course: true,
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
      return {
        sectionId: section.id,
        courseName: section.course.name,
        currentGrade: computeWeightedGrade(categoryGrades),
        categoryGrades,
      };
    });
  });
}
