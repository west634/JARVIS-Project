"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/notificationActions";
import type { NotificationItem } from "@/lib/notificationTypes";
import { EmptyState } from "@/components/ui/EmptyState";

const CATEGORY_LABELS: Record<string, string> = {
  ASSIGNMENT: "Assignment",
  GRADE: "Grade",
  MESSAGE: "Message",
  SCHEDULE: "Schedule",
  ANNOUNCEMENT: "Announcement",
  ATHLETICS: "Athletics",
  EMERGENCY: "Emergency",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationList({ notifications, preferencesHref }: { notifications: NotificationItem[]; preferencesHref: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasUnread = notifications.some((n) => !n.isRead);

  function handleOpen(n: NotificationItem) {
    startTransition(async () => {
      if (!n.isRead) await markNotificationReadAction(n.id);
      if (n.linkUrl) router.push(n.linkUrl);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <a href={preferencesHref} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Notification preferences
        </a>
        {hasUnread && (
          <button
            onClick={() => startTransition(() => markAllNotificationsReadAction())}
            disabled={isPending}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="Nothing yet — you're all caught up." />
      ) : (
        <ul className="divide-y divide-black/6 overflow-hidden rounded-2xl border border-black/8 dark:divide-white/8 dark:border-white/10">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => handleOpen(n)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03] ${
                  n.isRead ? "" : "bg-indigo-50/60 dark:bg-indigo-500/[0.06]"
                }`}
              >
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-hidden />}
                {n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                      {CATEGORY_LABELS[n.category] ?? n.category}
                    </span>
                    <span className="text-xs text-zinc-400">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 font-medium">{n.title}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{n.body}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
