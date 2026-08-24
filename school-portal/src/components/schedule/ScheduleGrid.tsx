import type { ScheduleEntry } from "@/lib/services/schedule";
import { formatMinuteOfDay } from "@/lib/format";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ScheduleGrid({ entries }: { entries: ScheduleEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No weekly schedule set up yet.</p>;
  }

  const days = Array.from(new Set(entries.map((e) => e.dayOfWeek))).sort((a, b) => a - b);
  const startTimes = Array.from(new Set(entries.map((e) => e.startMinute))).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto rounded-xl border border-black/8 dark:border-white/10">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-black/8 bg-zinc-50 px-3 py-2 text-left font-medium dark:border-white/10 dark:bg-zinc-900">
              Time
            </th>
            {days.map((d) => (
              <th key={d} className="border-b border-black/8 bg-zinc-50 px-3 py-2 text-left font-medium dark:border-white/10 dark:bg-zinc-900">
                {DAY_NAMES[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {startTimes.map((time) => (
            <tr key={time} className="border-b border-black/6 last:border-0 dark:border-white/8">
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                {formatMinuteOfDay(time)}
              </td>
              {days.map((d) => {
                const entry = entries.find((e) => e.dayOfWeek === d && e.startMinute === time);
                return (
                  <td key={d} className="min-w-40 px-3 py-2 align-top">
                    {entry &&
                      (entry.isCancelledToday ? (
                        <div className="rounded-lg bg-red-50 p-2 dark:bg-red-500/10">
                          <p className="text-sm font-medium text-red-700 line-through dark:text-red-400">
                            {entry.courseName}
                          </p>
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                            Cancelled{entry.substituteName ? ` · Sub: ${entry.substituteName}` : ""}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{entry.courseName}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {entry.withWhom}
                            {entry.room ? ` · Room ${entry.room}` : ""}
                          </p>
                        </div>
                      ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
