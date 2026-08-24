import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getStudentClassDetail } from "@/lib/services/studentClass";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, PriorityDot } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { formatDueDate } from "@/lib/format";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "assignments", label: "Assignments" },
  { key: "grades", label: "Grades" },
  { key: "resources", label: "Resources" },
];

export default async function StudentClassPage({
  params,
  searchParams,
}: PageProps<"/student/classes/[sectionId]">) {
  const { sectionId } = await params;
  const sp = await searchParams;
  const activeTab = typeof sp.tab === "string" ? sp.tab : "overview";

  const session = await requireRole("STUDENT");
  const cls = await getStudentClassDetail(session.schoolId, session.userId, sectionId);

  const upcoming = cls.assignments.filter((a) => a.status === "UPCOMING" || a.status === "IN_PROGRESS");
  const recentGraded = cls.assignments
    .filter((a) => a.status === "GRADED")
    .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())
    .slice(0, 4);
  const nextAssignment = [...upcoming].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{cls.courseName}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {cls.teacherName} · {cls.sectionName}
          {cls.room ? ` · Room ${cls.room}` : ""}
        </p>
      </div>

      <Tabs basePath={`/student/classes/${sectionId}`} active={activeTab} tabs={TABS} />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader title="Next assignment" />
            {nextAssignment ? (
              <>
                <p className="font-medium">{nextAssignment.title}</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">Due {formatDueDate(nextAssignment.dueDate)}</p>
              </>
            ) : (
              <EmptyState message="Nothing upcoming." />
            )}
          </Card>
          <Card>
            <CardHeader title="Grade" />
            <p className="text-3xl font-semibold">{cls.currentGrade === null ? "—" : `${Math.round(cls.currentGrade)}%`}</p>
          </Card>
          <Card>
            <CardHeader title="Upcoming" />
            <p className="text-3xl font-semibold">{upcoming.length}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">assignment{upcoming.length === 1 ? "" : "s"}</p>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Recent" />
            {recentGraded.length === 0 ? (
              <EmptyState message="No graded work yet." />
            ) : (
              <ul className="divide-y divide-black/6 dark:divide-white/8">
                {recentGraded.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">{a.title}</span>
                    <span className="text-sm font-medium">
                      {a.score}/{a.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Resources" />
            {cls.resources.length === 0 ? (
              <EmptyState message="Nothing posted yet." />
            ) : (
              <ul className="flex flex-col gap-1.5">
                {cls.resources.map((r) => (
                  <li key={r.id}>
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                      {r.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {cls.announcements.length > 0 && (
            <Card className="lg:col-span-3">
              <CardHeader title="Class announcements" />
              <ul className="flex flex-col gap-3">
                {cls.announcements.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{a.body}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {activeTab === "assignments" && (
        <Card>
          {cls.assignments.length === 0 ? (
            <EmptyState message="No assignments yet." />
          ) : (
            <ul className="divide-y divide-black/6 dark:divide-white/8">
              {cls.assignments.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/student/assignments/${a.id}`}
                    className="flex items-center justify-between gap-4 py-3 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <PriorityDot priority={a.priority} />
                      <span className="font-medium">{a.title}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {a.score !== null ? `${a.score}/${a.points}` : formatDueDate(a.dueDate)}
                      </p>
                      <StatusBadge status={a.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {activeTab === "grades" && (
        <Card>
          <CardHeader title="Current grade" />
          <p className="mb-4 text-4xl font-semibold">{cls.currentGrade === null ? "—" : `${cls.currentGrade.toFixed(1)}%`}</p>
          {cls.categoryGrades.length === 0 ? (
            <EmptyState message="No grade categories set up yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Weight</th>
                  <th className="pb-2 text-right font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {cls.categoryGrades.map((c) => (
                  <tr key={c.categoryId} className="border-b border-black/6 last:border-0 dark:border-white/8">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2 text-zinc-500 dark:text-zinc-400">{c.weight}%</td>
                    <td className="py-2 text-right font-medium">
                      {c.percentage === null ? "—" : `${c.percentage.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            See <Link href="/student/grades" className="text-indigo-600 hover:underline dark:text-indigo-400">Grades</Link> for a
            what-if projection.
          </p>
        </Card>
      )}

      {activeTab === "resources" && (
        <Card>
          {cls.resources.length === 0 ? (
            <EmptyState message="Nothing posted yet." />
          ) : (
            <ul className="flex flex-col gap-2">
              {cls.resources.map((r) => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
