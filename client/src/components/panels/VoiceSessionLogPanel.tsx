import { useEffect, useRef } from "react";
import { PanelShell } from "../PanelShell";
import type { ConversationTurn } from "../../types/assistant";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

export function VoiceSessionLogPanel({
  turns,
  onReplay,
}: {
  turns: ConversationTurn[];
  onReplay: (text: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns.length]);

  return (
    <PanelShell title="Voice Session Log">
      <div ref={scrollRef} className="max-h-64 overflow-y-auto pr-1 space-y-2.5">
        {turns.length === 0 && <p className="text-[12px] text-ink-faint">No activity yet this session.</p>}
        {turns.map((turn) => (
          <div key={turn.id} className="group animate-rise-in">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] font-semibold tracking-[0.14em] uppercase ${
                  turn.role === "user" ? "text-teal" : turn.isError ? "text-red" : "text-amber"
                }`}
              >
                {turn.role === "user" ? "Operator · Voice" : turn.isError ? "System · Error" : "SENTINEL · Voice"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] text-ink-faint font-mono">{formatTime(turn.timestamp)}</span>
                {turn.role === "assistant" && !turn.isError && (
                  <button
                    type="button"
                    onClick={() => onReplay(turn.text)}
                    aria-label="Replay this response"
                    className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-teal transition-opacity cursor-pointer"
                    title="Replay"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                    </svg>
                  </button>
                )}
              </span>
            </div>
            <p className="text-[13px] text-ink leading-snug mt-0.5">{turn.text}</p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
