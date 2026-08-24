import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getTeacherDashboard } from "@/lib/services/teacherDashboard";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMinuteOfDay, formatDueDate, greeting, firstName } from "@/lib/format";

export default async function TeacherHomePage() {
  const session = await requireRole("TEACHER");
  const data = await getTeacherDashboard(session.schoolId, session.userId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {firstName(data.teacherName)}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {data.today.length} class{data.today.length === 1 ? "" : "es"} today · {data.ungradedCount} submission
          {data.ungradedCount === 1 ? "" : "s"} to grade
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Today" />
          {data.today.length === 0 ? (
            <EmptyState message="No classes scheduled today." />
          ) : (
            <ul className="divide-y divide-black/6 dark:divide-white/8">
              {data.today.map((p) => (
                <li key={`${p.courseSectionId}-${p.startMinute}`} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-4">
                    <span className="w-20 shrink-0 font-mono text-sm text-zinc-500 dark:text-zinc-400">
                      {formatMinuteOfDay(p.startMinute)}
                    </span>
                    <div>
                      <p className="font-medium">
                        {p.courseName} <span className="text-zinc-400">· {p.sectionName}</span>
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {p.studentCount} students{p.room ? ` · Room ${p.room}` : ""}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Needs attention" />
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Submissions to grade</span>
              <span className="text-2xl font-semibold">{data.ungradedCount}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Students to check on</span>
              <span className="text-2xl font-semibold">{data.studentsToCheckOn.length}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Waiting to be graded" />
          {data.ungradedSubmissions.length === 0 ? (
            <EmptyState message="Nothing waiting on you. Nice." />
          ) : (
            <ul className="divide-y divide-black/6 dark:divide-white/8">
              {data.ungradedSubmissions.map((s) => (
                <li key={s.submissionId}>
                  <Link
                    href={`/teacher/grade/${s.assignmentId}`}
                    className="block py-3 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <p className="font-medium">{s.assignmentTitle}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {s.studentName} · {s.courseName} · submitted {formatDueDate(s.submittedAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Students to check on"
            subtitle="3 or more missing assignments"
          />
          {data.studentsToCheckOn.length === 0 ? (
            <EmptyState message="No students with repeated missing work right now." />
          ) : (
            <ul className="divide-y divide-black/6 dark:divide-white/8">
              {data.studentsToCheckOn.map((s) => (
                <li key={s.studentProfileId} className="flex items-center justify-between py-3">
                  <p className="font-medium">{s.studentName}</p>
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
                    {s.missingCount} missing
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Upcoming" subtitle="Next 7 days" />
        {data.upcomingAssignments.length === 0 ? (
          <EmptyState message="Nothing due in the next week." />
        ) : (
          <ul className="divide-y divide-black/6 dark:divide-white/8">
            {data.upcomingAssignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{a.courseName}</p>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDueDate(a.dueDate)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
