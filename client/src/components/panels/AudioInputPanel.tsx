import { PanelShell, StatRow } from "../PanelShell";

function GainBar({ pct }: { pct: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-panel-border overflow-hidden mt-1 mb-2">
      <div className="h-full bg-teal transition-[width] duration-150 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function AudioInputPanel({ gainDb, listening }: { gainDb: number | null; listening: boolean }) {
  const effectiveDb = listening && gainDb !== null ? gainDb : -58;
  const pct = Math.min(100, Math.max(0, ((effectiveDb + 60) / 60) * 100));

  return (
    <PanelShell title="Audio Input">
      <StatRow label="Mic Gain" value={listening && gainDb !== null ? `${gainDb} dB` : "—"} />
      <GainBar pct={pct} />
      <StatRow label="Noise Floor" value="-58 dB" />
      <StatRow label="Speaker Match" value="Operator 01" />
    </PanelShell>
  );
}
