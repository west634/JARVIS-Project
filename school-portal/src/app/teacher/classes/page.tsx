import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { listTeacherClasses } from "@/lib/services/teacherClass";
import { Card } from "@/components/ui/Card";

export default async function TeacherClassesPage() {
  const session = await requireRole("TEACHER");
  const classes = await listTeacherClasses(session.schoolId, session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{classes.length} section{classes.length === 1 ? "" : "s"}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {classes.map((c) => (
          <Link key={c.sectionId} href={`/teacher/classes/${c.sectionId}`}>
            <Card className="h-full transition hover:border-indigo-300 dark:hover:border-indigo-500/40">
              <h2 className="text-lg font-semibold">{c.courseName}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {c.sectionName} · {c.studentCount} students
              </p>
              {c.ungradedCount > 0 && (
                <span className="mt-3 inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
                  {c.ungradedCount} to grade
                </span>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
