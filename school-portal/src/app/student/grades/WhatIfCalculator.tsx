"use client";

import { useState } from "react";
import { projectWhatIf, type CategoryGrade } from "@/lib/services/grades";

export function WhatIfCalculator({ categoryGrades }: { categoryGrades: CategoryGrade[] }) {
  const gradableCategories = categoryGrades.filter((c) => c.weight > 0);
  const [categoryId, setCategoryId] = useState(gradableCategories[0]?.categoryId ?? "");
  const [hypotheticalScore, setHypotheticalScore] = useState(90);

  if (gradableCategories.length === 0) return null;

  const projected = projectWhatIf(categoryGrades, categoryId, hypotheticalScore);
  const category = categoryGrades.find((c) => c.categoryId === categoryId);

  return (
    <div className="rounded-xl border border-black/8 p-4 dark:border-white/10">
      <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        What if…
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>Your next</span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-white/5"
        >
          {gradableCategories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.name}
            </option>
          ))}
        </select>
        <span>scores</span>
        <input
          type="number"
          min={0}
          max={100}
          value={hypotheticalScore}
          onChange={(e) => setHypotheticalScore(Number(e.target.value))}
          className="w-20 rounded-lg border border-black/10 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-white/5"
        />
        <span>%</span>
      </div>
      <p className="mt-3 text-sm">
        Your grade would become approximately{" "}
        <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
          {projected === null ? "—" : `${projected.toFixed(1)}%`}
        </span>
        {category && projected !== null && (
          <span className="text-zinc-500 dark:text-zinc-400">
            {" "}
            (currently {category.percentage === null ? "ungraded" : `${category.percentage.toFixed(1)}%`} in {category.name})
          </span>
        )}
      </p>
    </div>
  );
}
