import { requireRole } from "@/lib/auth/guards";
import { getGradingQueue } from "@/lib/services/gradebook";
import { GradingQueueClient } from "./GradingQueueClient";

export default async function GradeSubmissionsPage({
  params,
}: PageProps<"/teacher/grade/[assignmentId]">) {
  const { assignmentId } = await params;
  const session = await requireRole("TEACHER", "ADMIN");
  const queue = await getGradingQueue(session.schoolId, session.userId, assignmentId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{queue.title}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{queue.courseName} · Grade submissions</p>
      </div>
      <GradingQueueClient queue={queue} sectionId={queue.courseSectionId} />
    </div>
  );
}
