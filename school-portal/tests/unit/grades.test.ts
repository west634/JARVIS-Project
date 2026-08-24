import { describe, it, expect } from "vitest";
import { computeCategoryGrades, computeWeightedGrade, projectWhatIf } from "@/lib/services/grades";

const categories = [
  { id: "tests", name: "Tests", weight: 40 },
  { id: "homework", name: "Homework", weight: 30 },
  { id: "projects", name: "Projects", weight: 30 },
];

describe("computeCategoryGrades", () => {
  it("computes a percentage per category from earned/possible points", () => {
    const items = [
      { categoryId: "tests", points: 100, score: 91 },
      { categoryId: "homework", points: 20, score: 17.6 }, // 88%
      { categoryId: "projects", points: 100, score: 82 },
    ];
    const result = computeCategoryGrades(items, categories);
    expect(result.find((c) => c.categoryId === "tests")?.percentage).toBeCloseTo(91);
    expect(result.find((c) => c.categoryId === "homework")?.percentage).toBeCloseTo(88);
    expect(result.find((c) => c.categoryId === "projects")?.percentage).toBeCloseTo(82);
  });

  it("leaves percentage null for a category with no graded items", () => {
    const result = computeCategoryGrades([], categories);
    expect(result.every((c) => c.percentage === null)).toBe(true);
  });
});

describe("computeWeightedGrade", () => {
  it("matches the spec §14 worked example", () => {
    // Tests 40% @ 91, Homework 30% @ 88, Projects 30% @ 82
    const items = [
      { categoryId: "tests", points: 100, score: 91 },
      { categoryId: "homework", points: 100, score: 88 },
      { categoryId: "projects", points: 100, score: 82 },
    ];
    const grades = computeCategoryGrades(items, categories);
    const weighted = computeWeightedGrade(grades);
    // 91*0.4 + 88*0.3 + 82*0.3 = 36.4 + 26.4 + 24.6 = 87.4
    expect(weighted).toBeCloseTo(87.4, 5);
  });

  it("is null when nothing has been graded", () => {
    const grades = computeCategoryGrades([], categories);
    expect(computeWeightedGrade(grades)).toBeNull();
  });

  it("re-normalizes weights when a category has no graded work yet", () => {
    // Only Tests (40%) graded — should be 100% of the grade, not scaled
    // down to 40% of some phantom total.
    const items = [{ categoryId: "tests", points: 100, score: 91 }];
    const grades = computeCategoryGrades(items, categories);
    expect(computeWeightedGrade(grades)).toBeCloseTo(91, 5);
  });
});

describe("projectWhatIf", () => {
  it("projects a hypothetical next assignment's effect on the weighted grade", () => {
    // Same starting point as the computeWeightedGrade example (87.4%).
    // Adding a 95%-scored 100-point project moves the Projects category
    // from 82% (100/100) to 88.5% (177/200): 82+95=177 earned, 100+100=200
    // possible. Recomputing the weighted average with that one category
    // updated: 91*0.4 + 88*0.3 + 88.5*0.3 = 89.35.
    const items = [
      { categoryId: "tests", points: 100, score: 91 },
      { categoryId: "homework", points: 100, score: 88 },
      { categoryId: "projects", points: 100, score: 82 },
    ];
    const grades = computeCategoryGrades(items, categories);
    const projected = projectWhatIf(grades, "projects", 95);
    expect(projected).toBeCloseTo(89.35, 5);
  });

  it("does not mutate the input category grades", () => {
    const items = [{ categoryId: "tests", points: 100, score: 91 }];
    const grades = computeCategoryGrades(items, categories);
    const before = JSON.stringify(grades);
    projectWhatIf(grades, "tests", 100);
    expect(JSON.stringify(grades)).toBe(before);
  });
});
