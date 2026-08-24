"use client";

import { useState } from "react";

export function RubricBuilder() {
  const [rows, setRows] = useState<{ description: string; points: string }[]>([]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Rubric (optional)</span>
        <button
          type="button"
          onClick={() => setRows((r) => [...r, { description: "", points: "10" }])}
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          + Add criterion
        </button>
      </div>

      {rows.length > 0 && (
        <input
          name="rubricTitle"
          placeholder="Rubric title (e.g. Lab Report Rubric)"
          className="rounded-xl border border-black/10 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        />
      )}

      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            name="criterion_description"
            value={row.description}
            onChange={(e) =>
              setRows((r) => r.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))
            }
            placeholder="Criterion description"
            className="flex-1 rounded-xl border border-black/10 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
          />
          <input
            name="criterion_points"
            type="number"
            min={0}
            value={row.points}
            onChange={(e) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, points: e.target.value } : x)))}
            className="w-24 rounded-xl border border-black/10 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
          />
          <button
            type="button"
            onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
            aria-label="Remove criterion"
            className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
