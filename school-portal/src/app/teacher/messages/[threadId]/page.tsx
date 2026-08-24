import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getThreadDetail } from "@/lib/services/messaging";
import { Card } from "@/components/ui/Card";
import { ThreadMessages } from "@/components/messaging/ThreadMessages";
import { ReplyForm } from "@/components/messaging/ReplyForm";

export default async function TeacherThreadPage({ params }: PageProps<"/teacher/messages/[threadId]">) {
  const { threadId } = await params;
  const session = await requireRole("TEACHER");
  const thread = await getThreadDetail(session.schoolId, session.userId, threadId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/teacher/messages" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          ← Messages
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{thread.subject}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          With {thread.participants.filter((p) => p.userId !== session.userId).map((p) => p.name).join(", ")}
        </p>
      </div>
      <Card className="max-w-2xl">
        <ThreadMessages thread={thread} currentUserId={session.userId} />
      </Card>
      <div className="max-w-2xl">
        <ReplyForm threadId={thread.id} />
      </div>
    </div>
  );
}
