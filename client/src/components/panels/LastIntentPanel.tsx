import { PanelShell } from "../PanelShell";

export function LastIntentPanel({
  intent,
}: {
  intent: { intent: string; confidence: number; scope: "LOCAL" | "CLOUD" } | null;
}) {
  return (
    <PanelShell title="Last Intent">
      <p className="font-mono text-base text-ink break-all">{intent?.intent ?? "—"}</p>
      <div className="flex gap-2 mt-2.5">
        <span className="rounded-sm border border-teal-dim/60 text-teal px-2 py-0.5 text-[11px] font-mono">
          conf {intent ? intent.confidence.toFixed(2) : "—"}
        </span>
        <span className="rounded-sm border border-panel-border text-ink-dim px-2 py-0.5 text-[11px] tracking-wide">
          {intent?.scope ?? "—"}
        </span>
      </div>
    </PanelShell>
  );
}
