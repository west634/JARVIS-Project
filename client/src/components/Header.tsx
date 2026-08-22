import { useClock } from "../hooks/useClock";
import { StatusBadge } from "./StatusBadge";

export function Header({
  assistantName,
  wakeWordArmed,
  onOpenSettings,
}: {
  assistantName: string;
  wakeWordArmed: boolean;
  onOpenSettings: () => void;
}) {
  const clock = useClock();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-panel-border px-5 py-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-[0.32em] text-teal-glow">
          {assistantName}
        </h1>
        <p className="text-[11px] tracking-[0.28em] text-ink-faint uppercase mt-0.5">Voice-First Operations Shell</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <StatusBadge label={wakeWordArmed ? "Wake Word Armed" : "Wake Word Idle"} tone={wakeWordArmed ? "green" : "teal"} dot={wakeWordArmed} />
        <StatusBadge label="Threat · Low" tone="teal" />
        <span className="font-mono text-sm text-ink-dim tabular-nums border border-panel-border rounded-sm px-2.5 py-1 whitespace-nowrap">
          {clock}
        </span>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="rounded-sm border border-panel-border px-2.5 py-1 text-ink-dim hover:text-teal hover:border-teal-dim transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
