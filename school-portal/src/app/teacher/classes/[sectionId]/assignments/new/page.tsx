import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getAssignmentFormContext } from "@/lib/services/teacherClass";
import { Card } from "@/components/ui/Card";
import { CreateAssignmentForm } from "./CreateAssignmentForm";

export default async function NewAssignmentPage({
  params,
}: PageProps<"/teacher/classes/[sectionId]/assignments/new">) {
  const { sectionId } = await params;
  const session = await requireRole("TEACHER", "ADMIN");
  const ctx = await getAssignmentFormContext(session.schoolId, session.userId, sectionId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/teacher/classes/${sectionId}?tab=assignments`}
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← {ctx.courseName}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New assignment</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{ctx.sectionName}</p>
      </div>

      <Card className="max-w-2xl">
        <CreateAssignmentForm sectionId={sectionId} categories={ctx.categories} />
      </Card>
    </div>
  );
}
