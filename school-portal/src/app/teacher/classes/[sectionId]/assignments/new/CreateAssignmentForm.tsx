"use client";

import { useActionState } from "react";
import { createAssignmentAction, type CreateAssignmentState } from "@/lib/actions/assignmentActions";
import { RubricBuilder } from "./RubricBuilder";

const initialState: CreateAssignmentState = { error: null };

export function CreateAssignmentForm({
  sectionId,
  categories,
}: {
  sectionId: string;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createAssignmentAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="courseSectionId" value={sectionId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
          placeholder="e.g. Lab Report: Photosynthesis"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dueDate" className="text-sm font-medium">
            Due date
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="datetime-local"
            required
            className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="points" className="text-sm font-medium">
            Points
          </label>
          <input
            id="points"
            name="points"
            type="number"
            min={0}
            defaultValue={100}
            className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="submissionType" className="text-sm font-medium">
            Submission type
          </label>
          <select
            id="submissionType"
            name="submissionType"
            defaultValue="FILE"
            className="rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
          >
            <option value="FILE">File upload</option>
            <option value="TEXT">Written response</option>
            <option value="LINK">Link</option>
            <option value="MULTIPLE">Multiple (file, text, or link)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoryId" className="text-sm font-medium">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={categories[0]?.id ?? ""}
            className="rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="estimatedMinutes" className="text-sm font-medium">
          Estimated time (minutes)
        </label>
        <input
          id="estimatedMinutes"
          name="estimatedMinutes"
          type="number"
          min={0}
          defaultValue={30}
          className="w-32 rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="rounded-xl border border-black/10 p-3.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="instructions" className="text-sm font-medium">
          Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={4}
          className="rounded-xl border border-black/10 p-3.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <RubricBuilder />

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create assignment"}
      </button>
    </form>
  );
}
