"use client";

import { useState } from "react";
import Link from "next/link";
import type { CalendarItem } from "@/lib/services/calendar";
import { getMonthGridDates, getWeekDates, groupByDateKey, dateKey, isSameDay } from "@/lib/services/calendarLogic";

const KIND_STYLES: Record<string, string> = {
  CLASS: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300",
  ASSIGNMENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  TEST: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  EVENT: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  ATHLETICS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  CLUB: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  HOLIDAY: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  MEETING: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
};

function timeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ItemChip({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium ${KIND_STYLES[item.kind] ?? KIND_STYLES.EVENT} ${item.isCancelled ? "line-through opacity-60" : ""}`}
      title={item.title}
    >
      {item.allDay ? item.title : `${timeLabel(item.start)} ${item.title}`}
    </button>
  );
}

function DetailPanel({ item, onClose }: { item: CalendarItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-black/8 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${KIND_STYLES[item.kind] ?? KIND_STYLES.EVENT}`}>
          {item.kind}
        </span>
        <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {item.allDay
            ? item.start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
            : `${item.start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · ${timeLabel(item.start)}–${timeLabel(item.end)}`}
        </p>
        {item.location && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">📍 {item.location}</p>}
        {item.detail && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.detail}</p>}
        {item.isCancelled && (
          <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
            Cancelled{item.substituteName ? ` · Substitute: ${item.substituteName}` : ""}
          </p>
        )}
        <div className="mt-4 flex justify-between">
          {item.href ? (
            <Link href={item.href} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Open →
            </Link>
          ) : (
            <span />
          )}
          <button onClick={onClose} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DayList({ items, onSelect }: { items: CalendarItem[]; onSelect: (i: CalendarItem) => void }) {
  if (items.length === 0) return <p className="text-xs text-zinc-400">Nothing scheduled.</p>;
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <ItemChip key={item.id} item={item} onClick={() => onSelect(item)} />
      ))}
    </div>
  );
}

export function CalendarView({
  items,
  view,
  date,
}: {
  items: CalendarItem[];
  view: "month" | "week" | "day" | "agenda";
  date: Date;
}) {
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const grouped = groupByDateKey(items);
  const today = new Date();

  return (
    <div>
      {view === "month" && (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-black/8 bg-black/8 dark:border-white/10 dark:bg-white/10">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-zinc-50 px-2 py-1.5 text-center text-xs font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              {d}
            </div>
          ))}
          {getMonthGridDates(date.getFullYear(), date.getMonth()).map((d) => {
            const dayItems = grouped.get(dateKey(d)) ?? [];
            const inMonth = d.getMonth() === date.getMonth();
            return (
              <div
                key={dateKey(d)}
                className={`min-h-24 bg-white p-1.5 dark:bg-zinc-950 ${inMonth ? "" : "opacity-40"}`}
              >
                <p className={`mb-1 text-xs ${isSameDay(d, today) ? "font-bold text-indigo-600 dark:text-indigo-400" : "text-zinc-500"}`}>
                  {d.getDate()}
                </p>
                <div className="flex flex-col gap-0.5">
                  {dayItems.slice(0, 3).map((item) => (
                    <ItemChip key={item.id} item={item} onClick={() => setSelected(item)} />
                  ))}
                  {dayItems.length > 3 && (
                    <span className="text-xs text-zinc-400">+{dayItems.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "week" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
          {getWeekDates(date).map((d) => (
            <div key={dateKey(d)} className="rounded-xl border border-black/8 p-2 dark:border-white/10">
              <p className={`mb-2 text-sm font-semibold ${isSameDay(d, today) ? "text-indigo-600 dark:text-indigo-400" : ""}`}>
                {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
              </p>
              <DayList items={grouped.get(dateKey(d)) ?? []} onSelect={setSelected} />
            </div>
          ))}
        </div>
      )}

      {view === "day" && (
        <div className="rounded-xl border border-black/8 p-4 dark:border-white/10">
          <p className="mb-3 font-semibold">{date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <DayList items={grouped.get(dateKey(date)) ?? []} onSelect={setSelected} />
        </div>
      )}

      {view === "agenda" && (
        <div className="flex flex-col gap-4">
          {items.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing in the next 30 days.</p>}
          {Array.from(grouped.entries()).map(([key, dayItems]) => (
            <div key={key} className="rounded-xl border border-black/8 p-3 dark:border-white/10">
              <p className="mb-2 text-sm font-semibold">
                {dayItems[0].start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <DayList items={dayItems} onSelect={setSelected} />
            </div>
          ))}
        </div>
      )}

      {selected && <DetailPanel item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
