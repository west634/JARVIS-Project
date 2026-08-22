import { PanelShell } from "../PanelShell";
import type { SubsystemStatus } from "../../types/assistant";

const TONE: Record<string, string> = {
  ONLINE: "text-green",
  ARMED: "text-green",
  IDLE: "text-ink-dim",
  OFFLINE: "text-red",
  DEGRADED: "text-amber",
  UNAVAILABLE: "text-ink-faint",
};

function Row({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-panel-border/60 last:border-0">
      <span className="text-[12px] text-ink">{label}</span>
      <span className={`text-[11px] font-mono tracking-wide uppercase ${TONE[status] ?? "text-ink-dim"}`}>{status}</span>
    </div>
  );
}

export function SubsystemRosterPanel({ subsystems }: { subsystems: SubsystemStatus }) {
  return (
    <PanelShell title="Subsystem Roster">
      <Row label="Speech recognition" status={subsystems.speechRecognition} />
      <Row label="Wake word engine" status={subsystems.wakeWordEngine} />
      <Row label="Voice synthesis" status={subsystems.voiceSynthesis} />
    </PanelShell>
  );
}
