import { AIVisualizer } from "./AIVisualizer";
import { MicrophoneButton } from "./MicrophoneButton";
import type { AssistantState } from "../types/assistant";

const BIG_LABEL: Record<AssistantState, string> = {
  IDLE: "",
  LISTENING: "Listening",
  PROCESSING: "Processing",
  THINKING: "Thinking",
  SPEAKING: "Responding",
  ERROR: "System Error",
};

const LABEL_COLOR: Record<AssistantState, string> = {
  IDLE: "text-teal",
  LISTENING: "text-teal",
  PROCESSING: "text-teal",
  THINKING: "text-teal-glow",
  SPEAKING: "text-amber",
  ERROR: "text-red",
};

export function AssistantCore({
  state,
  level,
  assistantName,
  interimTranscript,
  currentUserText,
  currentResponseText,
  errorMessage,
  onToggleMic,
  onDismissError,
}: {
  state: AssistantState;
  level: number;
  assistantName: string;
  interimTranscript: string;
  currentUserText: string;
  currentResponseText: string;
  errorMessage: string | null;
  onToggleMic: () => void;
  onDismissError: () => void;
}) {
  const displayedQuery = state === "LISTENING" ? interimTranscript || currentUserText : currentUserText;

  return (
    <div className="flex flex-col items-center px-4">
      <div className="h-6 mb-1">
        {BIG_LABEL[state] && (
          <p className={`text-sm font-semibold tracking-[0.3em] uppercase animate-rise-in ${LABEL_COLOR[state]}`}>
            {BIG_LABEL[state]}
          </p>
        )}
      </div>

      <div className="relative w-full flex items-center justify-center gap-6">
        <div className="hidden lg:block w-40 text-right text-[11px] tracking-wide text-ink-faint uppercase leading-relaxed">
          {state === "IDLE" && (
            <p>
              Idle · Say &ldquo;{assistantName}&rdquo;
              <br />
              to wake
            </p>
          )}
        </div>

        <AIVisualizer state={state} level={level} />

        <div className="hidden lg:block w-40 text-[11px] tracking-wide text-ink-faint uppercase leading-relaxed">
          <p>
            ASR stream 16kHz
            <br />
            Endpoint ~380ms
          </p>
          <p className="mt-2">
            TTS streaming
            <br />
            Barge-in on
          </p>
        </div>
      </div>

      <div className="mt-2 w-full max-w-xl text-center min-h-[7.5rem]">
        {errorMessage ? (
          <div className="animate-rise-in">
            <p className="text-[11px] tracking-[0.2em] text-red uppercase mb-1.5">Error</p>
            <p className="text-red/90 text-sm leading-relaxed">{errorMessage}</p>
            <button
              type="button"
              onClick={onDismissError}
              className="mt-2 text-[11px] tracking-widest uppercase text-ink-faint hover:text-teal cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <>
            {displayedQuery && (
              <div className="animate-rise-in">
                <p className="text-[11px] tracking-[0.2em] text-ink-faint uppercase mb-1.5">Transcript</p>
                <p className="text-lg font-medium text-ink">{displayedQuery}</p>
              </div>
            )}
            {currentResponseText && (
              <p className="mt-3 text-sm leading-relaxed text-ink-dim animate-rise-in">{currentResponseText}</p>
            )}
          </>
        )}
      </div>

      <div className="mt-4">
        <MicrophoneButton state={state} onToggle={onToggleMic} />
      </div>
      <p className="mt-3 text-[11px] tracking-[0.2em] text-ink-faint uppercase">Spacebar to talk · Barge-in enabled</p>
    </div>
  );
}
