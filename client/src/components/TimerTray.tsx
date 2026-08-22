import type { ActiveTimer } from "../types/assistant";

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TimerTray({ timers }: { timers: ActiveTimer[] }) {
  if (timers.length === 0) return null;

  return (
    <div className="fixed bottom-16 right-4 z-20 flex flex-col gap-2">
      {timers.map((timer) => {
        const pct = Math.max(0, Math.min(100, (timer.remainingSeconds / timer.totalSeconds) * 100));
        return (
          <div
            key={timer.id}
            className="animate-rise-in rounded-sm border border-panel-border bg-panel/90 backdrop-blur-sm px-3.5 py-2 min-w-[160px] shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] tracking-wide text-ink uppercase truncate">{timer.label}</span>
              <span className="font-mono text-sm text-teal">{formatRemaining(timer.remainingSeconds)}</span>
            </div>
            <div className="h-0.5 w-full bg-panel-border rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-teal transition-[width] duration-1000 linear" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
