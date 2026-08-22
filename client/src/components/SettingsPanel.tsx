import type { ReactNode } from "react";
import type { AssistantSettings, ResponseStyle } from "../types/assistant";

const STYLES: ResponseStyle[] = ["concise", "balanced", "detailed"];

export function SettingsPanel({
  open,
  settings,
  onChange,
  onClearHistory,
  onClose,
  notesCount,
}: {
  open: boolean;
  settings: AssistantSettings;
  onChange: (next: AssistantSettings) => void;
  onClearHistory: () => void;
  onClose: () => void;
  notesCount: number;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-void/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm bg-panel border-l border-panel-border px-5 py-5 overflow-y-auto animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-teal uppercase">Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close settings" className="text-ink-faint hover:text-ink cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <Field label="Assistant Name">
          <input
            type="text"
            value={settings.assistantName}
            onChange={(e) => onChange({ ...settings, assistantName: e.target.value.slice(0, 24) || "SENTINEL" })}
            className="w-full bg-void border border-panel-border rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-teal-dim"
          />
        </Field>

        <Field label="Response Style">
          <div className="flex gap-2">
            {STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => onChange({ ...settings, responseStyle: style })}
                className={`flex-1 rounded-sm border px-2 py-1.5 text-[11px] uppercase tracking-wide cursor-pointer ${
                  settings.responseStyle === style
                    ? "border-teal text-teal bg-teal/10"
                    : "border-panel-border text-ink-dim hover:border-teal-dim"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`Speech Rate — ${settings.speechRate.toFixed(2)}x`}>
          <input
            type="range"
            min={0.7}
            max={1.2}
            step={0.05}
            value={settings.speechRate}
            onChange={(e) => onChange({ ...settings, speechRate: Number(e.target.value) })}
            className="w-full accent-teal"
          />
        </Field>

        <Field label="Voice Output">
          <Toggle checked={settings.voiceOutputEnabled} onChange={(v) => onChange({ ...settings, voiceOutputEnabled: v })} />
        </Field>

        <Field label="Wake Word">
          <Toggle checked={settings.wakeWordEnabled} onChange={(v) => onChange({ ...settings, wakeWordEnabled: v })} />
        </Field>

        <Field label="Theme">
          <div className="flex gap-2">
            {(["abyss", "daylight"] as const).map((theme) => (
              <button
                key={theme}
                type="button"
                disabled={theme === "daylight"}
                onClick={() => onChange({ ...settings, theme })}
                title={theme === "daylight" ? "Daylight theme coming soon" : undefined}
                className={`flex-1 rounded-sm border px-2 py-1.5 text-[11px] uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                  settings.theme === theme ? "border-teal text-teal bg-teal/10" : "border-panel-border text-ink-dim"
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Conversation History">
          <p className="text-[12px] text-ink-faint mb-2">
            Stored locally in this browser only. {notesCount} note{notesCount === 1 ? "" : "s"} saved.
          </p>
          <button
            type="button"
            onClick={onClearHistory}
            className="w-full rounded-sm border border-red/40 text-red py-2 text-[11px] font-semibold tracking-widest uppercase hover:bg-red/10 cursor-pointer"
          >
            Clear History
          </button>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-[11px] tracking-[0.14em] text-ink-dim uppercase mb-2">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${checked ? "bg-teal-dim" : "bg-panel-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}
