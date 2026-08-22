import { PanelShell, StatRow } from "../PanelShell";
import type { EnvironmentTelemetry } from "../../hooks/useSimulatedTelemetry";

export function EnvironmentPanel({ environment }: { environment: EnvironmentTelemetry }) {
  return (
    <PanelShell title="Environment">
      <div className="grid grid-cols-2 gap-x-4">
        <StatRow label="Ambient" value={`${environment.ambientC.toFixed(1)}°C`} />
        <StatRow label="Pressure" value={`${environment.pressureHpa} hPa`} />
        <StatRow label={`Wind ${environment.windDir}`} value={`${environment.windKmh} km/h`} />
        <StatRow label="Core Reserve" value={`${environment.coreReservePct.toFixed(1)}%`} />
        <StatRow label="Grid Draw" value={`${environment.gridDrawKw.toFixed(1)} kW`} />
        <StatRow label="Occupancy" value={`${environment.occupancy} Person${environment.occupancy === 1 ? "" : "s"}`} />
      </div>
    </PanelShell>
  );
}
