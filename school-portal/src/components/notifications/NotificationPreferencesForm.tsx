"use client";

import { useActionState } from "react";
import { updateNotificationPreferencesAction, type PreferencesActionState } from "@/lib/actions/notificationActions";
import { NOTIFICATION_CATEGORIES, type PreferenceState } from "@/lib/notificationTypes";

const CATEGORY_LABELS: Record<string, string> = {
  ASSIGNMENT: "New and updated assignments",
  GRADE: "Grades returned",
  MESSAGE: "New messages",
  SCHEDULE: "Schedule changes and cancellations",
  ANNOUNCEMENT: "School announcements",
  ATHLETICS: "Athletics and activities",
  EMERGENCY: "Emergency alerts",
};

const initialState: PreferencesActionState = { error: null, success: false };

export function NotificationPreferencesForm({ initial }: { initial: PreferenceState }) {
  const [state, action, pending] = useActionState(updateNotificationPreferencesAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <ul className="divide-y divide-black/6 rounded-2xl border border-black/8 dark:divide-white/8 dark:border-white/10">
        {NOTIFICATION_CATEGORIES.map((category) => (
          <li key={category} className="flex items-center justify-between gap-4 px-4 py-3">
            <label htmlFor={`category_${category}`} className="text-sm">
              {CATEGORY_LABELS[category] ?? category}
            </label>
            <input
              id={`category_${category}`}
              name={`category_${category}`}
              type="checkbox"
              defaultChecked={initial[category]}
              className="h-4 w-4 accent-indigo-600"
            />
          </li>
        ))}
      </ul>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Emergency alerts are always sent regardless of this setting once SMS/push delivery is
        connected — today, every category shown here controls in-app notifications only.
      </p>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
