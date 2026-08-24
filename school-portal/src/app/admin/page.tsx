import { requireRole } from "@/lib/auth/guards";
import { getAdminDashboard } from "@/lib/services/adminDashboard";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

export default async function AdminHomePage() {
  const session = await requireRole("ADMIN");
  const data = await getAdminDashboard(session.schoolId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.schoolName}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">School-wide overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Students" value={String(data.studentCount)} />
        <StatCard label="Teachers" value={String(data.teacherCount)} />
        <StatCard label="Course sections" value={String(data.courseSectionCount)} />
        <StatCard
          label="Attendance today"
          value={
            data.attendanceTodayPresentRate === null
              ? "—"
              : `${Math.round(data.attendanceTodayPresentRate * 100)}%`
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Assignment completion" subtitle="Last 30 days, across the school" />
          <p className="text-3xl font-semibold">{Math.round(data.assignmentCompletionRate * 100)}%</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {data.missingWorkCount} missing assignment{data.missingWorkCount === 1 ? "" : "s"} outstanding
          </p>
        </Card>

        <Card>
          <CardHeader title="Teacher workload" subtitle="Sections taught & submissions awaiting grading" />
          {data.teacherWorkload.length === 0 ? (
            <EmptyState message="No teachers yet." />
          ) : (
            <ul className="divide-y divide-black/6 dark:divide-white/8">
              {data.teacherWorkload.map((t) => (
                <li key={t.teacherName} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium">{t.teacherName}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t.sectionCount} section{t.sectionCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{t.ungradedCount} ungraded</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent announcements" />
        {data.recentAnnouncements.length === 0 ? (
          <EmptyState message="No announcements yet." />
        ) : (
          <ul className="divide-y divide-black/6 dark:divide-white/8">
            {data.recentAnnouncements.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{a.authorName}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
