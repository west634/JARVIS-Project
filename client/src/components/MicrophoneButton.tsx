import type { AssistantState } from "../types/assistant";

const LABEL: Record<AssistantState, string> = {
  IDLE: "Tap to Speak",
  LISTENING: "Listening — Tap to Stop",
  PROCESSING: "Preparing…",
  THINKING: "Thinking… Tap to Cancel",
  SPEAKING: "Tap to Interrupt",
  ERROR: "Tap to Retry",
};

export function MicrophoneButton({
  state,
  onToggle,
}: {
  state: AssistantState;
  onToggle: () => void;
}) {
  const busy = state === "PROCESSING";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      className={`group relative mx-auto flex items-center gap-2.5 rounded-sm border px-6 py-2.5 text-[12px] font-semibold tracking-[0.18em] uppercase transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
        state === "LISTENING"
          ? "border-teal text-teal bg-teal/10"
          : state === "SPEAKING"
          ? "border-amber text-amber bg-amber/10"
          : state === "ERROR"
          ? "border-red text-red bg-red/10"
          : "border-panel-border text-ink hover:border-teal-dim hover:text-teal"
      }`}
    >
      <MicIcon active={state === "LISTENING"} />
      {LABEL[state]}
    </button>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" className={active ? "animate-pulse" : ""} />
      <path d="M5 10v2a7 7 0 0014 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
