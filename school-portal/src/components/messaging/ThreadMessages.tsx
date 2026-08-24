import type { ThreadDetail } from "@/lib/services/messaging";

export function ThreadMessages({ thread, currentUserId }: { thread: ThreadDetail; currentUserId: string }) {
  return (
    <div className="flex flex-col gap-3">
      {thread.messages.map((m) => {
        const mine = m.senderId === currentUserId;
        return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-md rounded-2xl px-4 py-2.5 ${mine ? "bg-indigo-600 text-white" : "bg-black/5 dark:bg-white/10"}`}>
              {!mine && <p className="mb-0.5 text-xs font-semibold opacity-70">{m.senderName}</p>}
              <p className="text-sm whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-1 text-right text-xs ${mine ? "text-indigo-100" : "text-zinc-400"}`}>
                {m.sentAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
