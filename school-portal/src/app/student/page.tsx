import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getStudentDashboard } from "@/lib/services/studentDashboard";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, PriorityDot } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMinuteOfDay, formatDueDate, greeting, firstName } from "@/lib/format";

export default async function StudentHomePage() {
  const session = await requireRole("STUDENT");
  const data = await getStudentDashboard(session.schoolId, session.userId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {firstName(data.studentName)}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Here&apos;s what matters today.
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
                      <p className="font-medium">{p.courseName}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {p.teacherName}
                        {p.room ? ` · Room ${p.room}` : ""}
                      </p>
                    </div>
                  </div>
                  {p.isCancelled && (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
                      Cancelled{p.substituteName ? ` · Sub: ${p.substituteName}` : ""}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Up next" />
          {data.upNext ? (
            <Link href={`/student/assignments/${data.upNext.id}`} className="block">
              <p className="font-medium hover:underline">{data.upNext.title}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{data.upNext.courseName}</p>
              <p className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Due {formatDueDate(data.upNext.dueDate)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <PriorityDot priority={data.upNext.priority} />
                <StatusBadge status={data.upNext.status} />
              </div>
            </Link>
          ) : (
            <EmptyState message="Nothing due soon — you're caught up." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Missing"
          subtitle={data.missing.length > 0 ? `${data.missing.length} assignment${data.missing.length === 1 ? "" : "s"} need attention` : undefined}
        />
        {data.missing.length === 0 ? (
          <EmptyState message="Nothing missing. Great work." />
        ) : (
          <ul className="divide-y divide-black/6 dark:divide-white/8">
            {data.missing.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/student/assignments/${a.id}`}
                  className="flex items-center justify-between gap-4 py-3 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-3">
                    <PriorityDot priority={a.priority} />
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{a.courseName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Was due {formatDueDate(a.dueDate)}
                    </p>
                    <StatusBadge status={a.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recently graded" />
          {data.recentlyGraded.length === 0 ? (
            <EmptyState message="No grades posted recently." />
          ) : (
            <ul className="divide-y divide-black/6 dark:divide-white/8">
              {data.recentlyGraded.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/student/assignments/${a.id}`}
                    className="flex items-center justify-between py-3 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{a.courseName}</p>
                    </div>
                    <p className="font-semibold">
                      {a.score}/{a.points}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="School announcements" />
          {data.announcements.length === 0 ? (
            <EmptyState message="No announcements right now." />
          ) : (
            <ul className="flex flex-col gap-4">
              {data.announcements.map((a) => (
                <li key={a.id}>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
