import { requireRole } from "@/lib/auth/guards";
import { getTeacherWeeklySchedule } from "@/lib/services/schedule";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { CancelClassForm } from "./CancelClassForm";
import { formatMinuteOfDay } from "@/lib/format";

export default async function TeacherSchedulePage() {
  const session = await requireRole("TEACHER");
  const entries = await getTeacherWeeklySchedule(session.schoolId, session.userId);

  const now = new Date();
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const today = entries.filter((e) => e.dayOfWeek === now.getDay() && !e.isCancelledToday);
  const current = today.find((e) => e.startMinute <= nowMinute && nowMinute < e.endMinute);
  const next = today.filter((e) => e.startMinute > nowMinute).sort((a, b) => a.startMinute - b.startMinute)[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Your weekly teaching timetable.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Right now" />
          {current ? (
            <>
              <p className="text-lg font-semibold">{current.courseName}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatMinuteOfDay(current.startMinute)}–{formatMinuteOfDay(current.endMinute)} · {current.withWhom}
                {current.room ? ` · Room ${current.room}` : ""}
              </p>
            </>
          ) : (
            <EmptyState message="No class right now." />
          )}
        </Card>
        <Card>
          <CardHeader title="Next up" />
          {next ? (
            <>
              <p className="text-lg font-semibold">{next.courseName}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatMinuteOfDay(next.startMinute)} · {next.withWhom}
                {next.room ? ` · Room ${next.room}` : ""}
              </p>
            </>
          ) : (
            <EmptyState message="Nothing else scheduled today." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Weekly timetable" />
        <ScheduleGrid entries={entries} />
      </Card>

      <Card>
        <CardHeader title="Cancel a class" subtitle="Students are notified immediately." />
        <CancelClassForm entries={entries} />
      </Card>
    </div>
  );
}
