"use client";

import { useActionState } from "react";
import { cancelClassAction, type CancelClassState } from "@/lib/actions/scheduleActions";
import { formatMinuteOfDay } from "@/lib/format";
import type { ScheduleEntry } from "@/lib/services/schedule";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const initialState: CancelClassState = { error: null, success: false };

export function CancelClassForm({ entries }: { entries: ScheduleEntry[] }) {
  const [state, action, pending] = useActionState(cancelClassAction, initialState);

  if (entries.length === 0) return null;

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="scheduleBlockId" className="text-sm font-medium">
          Class
        </label>
        <select
          id="scheduleBlockId"
          name="scheduleBlockId"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        >
          {entries.map((e) => (
            <option key={e.scheduleBlockId} value={e.scheduleBlockId}>
              {e.courseName} — {DAY_NAMES[e.dayOfWeek]} {formatMinuteOfDay(e.startMinute)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="date" className="text-sm font-medium">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="substituteName" className="text-sm font-medium">
          Substitute (optional)
        </label>
        <input
          id="substituteName"
          name="substituteName"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Cancelling…" : "Cancel this class"}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-sm font-medium text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.success && <p className="w-full text-sm font-medium text-emerald-600 dark:text-emerald-400">Class cancelled and students notified.</p>}
    </form>
  );
}
