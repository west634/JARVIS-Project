import Link from "next/link";
import { shiftAnchorDate, dateKey, type CalendarViewMode } from "@/lib/services/calendarLogic";

const VIEWS: { key: CalendarViewMode; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "agenda", label: "Agenda" },
];

function viewLabel(date: Date, view: CalendarViewMode): string {
  if (view === "month") return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (view === "day") return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  if (view === "agenda") return `Next 30 days from ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  return `Week of ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export function CalendarNav({ basePath, view, date }: { basePath: string; view: CalendarViewMode; date: Date }) {
  const prev = shiftAnchorDate(date, view, -1);
  const next = shiftAnchorDate(date, view, 1);
  const href = (v: CalendarViewMode, d: Date) => `${basePath}?view=${v}&date=${dateKey(d)}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link
          href={href(view, prev)}
          aria-label="Previous"
          className="rounded-lg border border-black/10 px-2.5 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          ←
        </Link>
        <Link
          href={href(view, new Date())}
          className="rounded-lg border border-black/10 px-2.5 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          Today
        </Link>
        <Link
          href={href(view, next)}
          aria-label="Next"
          className="rounded-lg border border-black/10 px-2.5 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          →
        </Link>
        <span className="ml-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">{viewLabel(date, view)}</span>
      </div>
      <div className="flex gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/10">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={href(v.key, date)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
              v.key === view ? "bg-white shadow-sm dark:bg-zinc-800" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
