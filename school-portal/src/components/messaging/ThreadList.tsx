import Link from "next/link";
import type { ThreadSummary } from "@/lib/services/messaging";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDueDate } from "@/lib/format";

export function ThreadList({ threads, basePath }: { threads: ThreadSummary[]; basePath: string }) {
  if (threads.length === 0) return <EmptyState message="No conversations yet." />;

  return (
    <ul className="divide-y divide-black/6 overflow-hidden rounded-2xl border border-black/8 dark:divide-white/8 dark:border-white/10">
      {threads.map((t) => (
        <li key={t.id}>
          <Link
            href={`${basePath}/${t.id}`}
            className={`flex items-start gap-3 px-4 py-3 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03] ${
              t.isUnread ? "bg-indigo-50/60 dark:bg-indigo-500/[0.06]" : ""
            }`}
          >
            {t.isUnread ? (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-hidden />
            ) : (
              <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`truncate ${t.isUnread ? "font-semibold" : "font-medium"}`}>{t.subject}</p>
                {t.lastMessage && (
                  <span className="shrink-0 text-xs text-zinc-400">{formatDueDate(t.lastMessage.sentAt)}</span>
                )}
              </div>
              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                {t.participants.join(", ")}
                {t.lastMessage ? ` — ${t.lastMessage.senderName}: ${t.lastMessage.body}` : ""}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
