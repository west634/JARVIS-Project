import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { listStudentClasses } from "@/lib/services/studentClass";
import { Card } from "@/components/ui/Card";
import { formatDueDate } from "@/lib/format";

export default async function StudentClassesPage() {
  const session = await requireRole("STUDENT");
  const classes = await listStudentClasses(session.schoolId, session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{classes.length} enrolled</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {classes.map((c) => (
          <Link key={c.sectionId} href={`/student/classes/${c.sectionId}`}>
            <Card className="h-full transition hover:border-indigo-300 dark:hover:border-indigo-500/40">
              <h2 className="text-lg font-semibold">{c.courseName}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {c.teacherName}
                {c.room ? ` · Room ${c.room}` : ""}
              </p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">Grade</p>
                  <p className="text-2xl font-semibold">
                    {c.currentGrade === null ? "—" : `${Math.round(c.currentGrade)}%`}
                  </p>
                </div>
                {c.nextAssignment && (
                  <div className="text-right">
                    <p className="text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">Next</p>
                    <p className="text-sm font-medium">{c.nextAssignment.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDueDate(c.nextAssignment.dueDate)}</p>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
