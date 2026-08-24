import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { listAllStudentAssignments } from "@/lib/services/studentAssignments";
import { Card } from "@/components/ui/Card";
import { StatusBadge, PriorityDot } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDueDate } from "@/lib/format";
import type { AssignmentStatus } from "@/lib/services/assignments";

const FILTERS: { key: string; label: string; statuses: AssignmentStatus[] | null }[] = [
  { key: "all", label: "All", statuses: null },
  { key: "missing", label: "Missing", statuses: ["MISSING"] },
  { key: "upcoming", label: "Upcoming", statuses: ["UPCOMING", "IN_PROGRESS"] },
  { key: "submitted", label: "Submitted", statuses: ["SUBMITTED", "LATE"] },
  { key: "graded", label: "Graded", statuses: ["GRADED"] },
];

export default async function StudentAssignmentsPage({
  searchParams,
}: PageProps<"/student/assignments">) {
  const session = await requireRole("STUDENT");
  const params = await searchParams;
  const activeKey = typeof params.status === "string" ? params.status : "all";
  const active = FILTERS.find((f) => f.key === activeKey) ?? FILTERS[0];

  const all = await listAllStudentAssignments(session.schoolId, session.userId);
  const filtered = active.statuses ? all.filter((a) => active.statuses!.includes(a.status)) : all;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Everything across all your classes.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/student/assignments" : `/student/assignments?status=${f.key}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              f.key === active.key
                ? "bg-indigo-600 text-white"
                : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="Nothing here." />
        ) : (
          <ul className="divide-y divide-black/6 dark:divide-white/8">
            {filtered.map((a) => (
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
    </div>
  );
}
