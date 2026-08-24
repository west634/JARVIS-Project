/**
 * Pure, DB-agnostic grade math — see prisma/schema.prisma's Grade/GradeHistory
 * comment and SECURITY.md for why grades are never hand-edited in place.
 *
 * The rule this implements (spec §14): a student's grade is a weighted
 * average across assignment categories, where only categories that actually
 * have graded work count — their weights are re-normalized against each
 * other, rather than penalizing a student for a category the teacher simply
 * hasn't graded anything in yet.
 */

export type Category = { id: string; name: string; weight: number };
export type GradedItem = { categoryId: string | null; points: number; score: number };

export type CategoryGrade = {
  categoryId: string;
  name: string;
  weight: number;
  earnedPoints: number;
  possiblePoints: number;
  /** 0-100, or null if nothing in this category has been graded yet. */
  percentage: number | null;
};

export function computeCategoryGrades(
  gradedItems: readonly GradedItem[],
  categories: readonly Category[],
): CategoryGrade[] {
  return categories.map((category) => {
    const items = gradedItems.filter((i) => i.categoryId === category.id);
    const earnedPoints = items.reduce((sum, i) => sum + i.score, 0);
    const possiblePoints = items.reduce((sum, i) => sum + i.points, 0);
    return {
      categoryId: category.id,
      name: category.name,
      weight: category.weight,
      earnedPoints,
      possiblePoints,
      percentage: possiblePoints > 0 ? (earnedPoints / possiblePoints) * 100 : null,
    };
  });
}

/**
 * Weighted average across categories with at least one graded item. Returns
 * null if nothing anywhere has been graded yet — an ungraded class has no
 * grade, not a 0%.
 */
export function computeWeightedGrade(categoryGrades: readonly CategoryGrade[]): number | null {
  const graded = categoryGrades.filter((c) => c.percentage !== null && c.weight > 0);
  const totalWeight = graded.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return null;
  const weightedSum = graded.reduce((sum, c) => sum + (c.percentage as number) * c.weight, 0);
  return weightedSum / totalWeight;
}

/**
 * "Your grade would become approximately X% if your next project scored Y%"
 * (spec §14) — recomputes the weighted grade with one hypothetical item
 * added to the given category, without mutating any input.
 */
export function projectWhatIf(
  categoryGrades: readonly CategoryGrade[],
  categoryId: string,
  hypotheticalScorePercent: number,
  hypotheticalPoints = 100,
): number | null {
  const hypotheticalEarned = (hypotheticalScorePercent / 100) * hypotheticalPoints;
  const projected = categoryGrades.map((c) => {
    if (c.categoryId !== categoryId) return c;
    const earnedPoints = c.earnedPoints + hypotheticalEarned;
    const possiblePoints = c.possiblePoints + hypotheticalPoints;
    return { ...c, earnedPoints, possiblePoints, percentage: (earnedPoints / possiblePoints) * 100 };
  });
  return computeWeightedGrade(projected);
}
