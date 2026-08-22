import { PanelShell } from "../PanelShell";
import type { PerimeterTelemetry } from "../../hooks/useSimulatedTelemetry";

function Diamond({ tone }: { tone: "ok" | "warn" }) {
  return <span className={`inline-block h-1.5 w-1.5 rotate-45 mr-2 ${tone === "ok" ? "bg-teal" : "bg-amber"}`} />;
}

export function PerimeterPanel({ perimeter }: { perimeter: PerimeterTelemetry }) {
  return (
    <PanelShell title="Perimeter">
      <div className="flex items-center justify-between py-1">
        <span className="text-[12px] text-ink flex items-center">
          <Diamond tone={perimeter.northApproach === "CLEAR" ? "ok" : "warn"} />
          North approach
        </span>
        <span className="text-[11px] font-mono text-ink-dim">{perimeter.northApproach}</span>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="text-[12px] text-ink flex items-center">
          <Diamond tone={perimeter.serviceEntry === "LOCKED" ? "ok" : "warn"} />
          Service entry
        </span>
        <span className="text-[11px] font-mono text-ink-dim">{perimeter.serviceEntry}</span>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="text-[12px] text-ink flex items-center">
          <Diamond tone="ok" />
          Transient contact
        </span>
        <span className="text-[11px] font-mono text-ink-dim">{perimeter.transientContactM} m</span>
      </div>
    </PanelShell>
  );
}
