import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { listThreads } from "@/lib/services/messaging";
import { ThreadList } from "@/components/messaging/ThreadList";

export default async function ParentMessagesPage() {
  const session = await requireRole("PARENT");
  const threads = await listThreads(session.schoolId, session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <Link href="/parent/messages/new" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          + New message
        </Link>
      </div>
      <ThreadList threads={threads} basePath="/parent/messages" />
    </div>
  );
}
