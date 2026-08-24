import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getTeacherClassDetail } from "@/lib/services/teacherClass";
import { getGradebookGrid } from "@/lib/services/gradebook";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { formatDueDate } from "@/lib/format";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "assignments", label: "Assignments" },
  { key: "gradebook", label: "Gradebook" },
  { key: "resources", label: "Resources" },
];

export default async function TeacherClassPage({
  params,
  searchParams,
}: PageProps<"/teacher/classes/[sectionId]">) {
  const { sectionId } = await params;
  const sp = await searchParams;
  const activeTab = typeof sp.tab === "string" ? sp.tab : "overview";

  const session = await requireRole("TEACHER", "ADMIN");
  const cls = await getTeacherClassDetail(session.schoolId, session.userId, sectionId);
  const grid = activeTab === "gradebook" ? await getGradebookGrid(session.schoolId, session.userId, sectionId) : null;

  const upcoming = cls.assignments.filter((a) => a.dueDate > new Date()).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const totalUngraded = cls.assignments.reduce((sum, a) => sum + a.ungradedCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cls.courseName}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {cls.sectionName} · {cls.roster.length} students{cls.room ? ` · Room ${cls.room}` : ""}
          </p>
        </div>
        <Link
          href={`/teacher/classes/${sectionId}/assignments/new`}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          + New assignment
        </Link>
      </div>

      <Tabs basePath={`/teacher/classes/${sectionId}`} active={activeTab} tabs={TABS} />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader title="Students" />
            <p className="text-3xl font-semibold">{cls.roster.length}</p>
          </Card>
          <Card>
            <CardHeader title="To grade" />
            <p className="text-3xl font-semibold">{totalUngraded}</p>
          </Card>
          <Card>
            <CardHeader title="Upcoming" />
            <p className="text-3xl font-semibold">{upcoming.length}</p>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Upcoming assignments" />
            {upcoming.length === 0 ? (
              <EmptyState message="Nothing scheduled." />
            ) : (
              <ul className="divide-y divide-black/6 dark:divide-white/8">
                {upcoming.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">{a.title}</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{formatDueDate(a.dueDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Roster" />
            <ul className="flex flex-col gap-1.5 text-sm">
              {cls.roster.map((s) => (
                <li key={s.studentProfileId}>{s.name}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {activeTab === "assignments" && (
        <Card>
          {cls.assignments.length === 0 ? (
            <EmptyState message="No assignments yet." />
          ) : (
            <ul className="divide-y divide-black/6 dark:divide-white/8">
              {cls.assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Due {formatDueDate(a.dueDate)} · {a.submittedCount}/{a.totalStudents} submitted
                      {a.missingCount > 0 ? ` · ${a.missingCount} missing` : ""}
                    </p>
                  </div>
                  {a.ungradedCount > 0 ? (
                    <Link
                      href={`/teacher/grade/${a.id}`}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                      Grade {a.ungradedCount}
                    </Link>
                  ) : (
                    <span className="text-sm text-zinc-400">All graded</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {activeTab === "gradebook" && grid && (
        <Card className="overflow-x-auto">
          {grid.assignments.length === 0 ? (
            <EmptyState message="Create an assignment to start the gradebook." />
          ) : (
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 border-b border-black/8 bg-white py-2 pr-4 text-left font-medium dark:border-white/10 dark:bg-zinc-900">
                    Student
                  </th>
                  {grid.assignments.map((a) => (
                    <th key={a.id} className="border-b border-black/8 px-3 py-2 text-left font-medium whitespace-nowrap dark:border-white/10">
                      {a.title}
                      <span className="block font-normal text-zinc-400">/{a.points}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.students.map((s) => (
                  <tr key={s.studentProfileId} className="border-b border-black/6 last:border-0 dark:border-white/8">
                    <td className="sticky left-0 bg-white py-2 pr-4 font-medium whitespace-nowrap dark:bg-zinc-900">{s.name}</td>
                    {grid.assignments.map((a) => {
                      const cell = grid.cells[`${s.studentProfileId}:${a.id}`];
                      return (
                        <td key={a.id} className="px-3 py-2 whitespace-nowrap">
                          {cell?.score !== null && cell?.score !== undefined ? (
                            cell.score
                          ) : cell?.submitted ? (
                            <Link href={`/teacher/grade/${a.id}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
                              Grade
                            </Link>
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-600">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
