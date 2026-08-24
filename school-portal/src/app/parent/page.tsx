import { requireRole } from "@/lib/auth/guards";
import { getParentDashboard } from "@/lib/services/parentDashboard";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { greeting, firstName } from "@/lib/format";

const STANDING_STYLES: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Good standing": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Needs attention": "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
};

export default async function ParentHomePage() {
  const session = await requireRole("PARENT");
  const data = await getParentDashboard(session.schoolId, session.userId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {firstName(data.parentName)}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          An overview of {data.children.length === 1 ? "your child" : "your children"}.
        </p>
      </div>

      {data.children.length === 0 ? (
        <EmptyState message="No students are linked to your account yet." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {data.children.map((child) => (
            <Card key={child.studentProfileId}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{firstName(child.name)}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Grade {child.gradeLevel}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STANDING_STYLES[child.attendanceStanding]}`}
                >
                  {child.attendanceStanding}
                </span>
              </div>

              <CardHeader title="Today" />
              <p className="mb-4 text-sm">{child.todayClassCount} classes</p>

              <CardHeader title="Assignments" />
              <div className="mb-4 flex gap-6 text-sm">
                <span>
                  <strong className="text-base">{child.dueTodayCount}</strong> due today
                </span>
                <span className={child.missingCount > 0 ? "font-semibold text-red-600 dark:text-red-400" : ""}>
                  <strong className="text-base">{child.missingCount}</strong> missing
                </span>
              </div>

              <CardHeader title="Grades" />
              {child.courseGrades.length === 0 ? (
                <EmptyState message="No grades posted yet." />
              ) : (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {child.courseGrades.map((g) => (
                    <li key={g.courseName} className="flex justify-between">
                      <span>{g.courseName}</span>
                      <span className="font-medium">
                        {g.averageScore === null ? "—" : `${Math.round(g.averageScore)}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
