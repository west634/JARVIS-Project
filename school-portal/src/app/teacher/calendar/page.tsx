import { requireRole } from "@/lib/auth/guards";
import { getTeacherCalendarItems } from "@/lib/services/calendar";
import { getRangeForView, type CalendarViewMode } from "@/lib/services/calendarLogic";
import { CalendarNav } from "@/components/calendar/CalendarNav";
import { CalendarView } from "@/components/calendar/CalendarView";

const VALID_VIEWS: CalendarViewMode[] = ["day", "week", "month", "agenda"];

export default async function TeacherCalendarPage({ searchParams }: PageProps<"/teacher/calendar">) {
  const session = await requireRole("TEACHER");
  const sp = await searchParams;
  const view = VALID_VIEWS.includes(sp.view as CalendarViewMode) ? (sp.view as CalendarViewMode) : "month";
  const date = typeof sp.date === "string" && !Number.isNaN(Date.parse(sp.date)) ? new Date(sp.date) : new Date();

  const { start, end } = getRangeForView(date, view);
  const items = await getTeacherCalendarItems(session.schoolId, session.userId, start, end);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Classes, assignment due dates, and school events.
        </p>
      </div>
      <CalendarNav basePath="/teacher/calendar" view={view} date={date} />
      <CalendarView items={items} view={view} date={date} />
    </div>
  );
}
