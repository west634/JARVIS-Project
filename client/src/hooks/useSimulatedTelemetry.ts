import { useEffect, useState } from "react";

/**
 * Ambient "ops shell" flavor telemetry (environment + perimeter panels).
 * There is no real building sensor behind this — it exists to give the HUD
 * the same living-dashboard feel as the reference design. It drifts on a
 * slow random walk rather than sitting static or faking urgency with fast
 * jitter.
 */
export interface EnvironmentTelemetry {
  ambientC: number;
  pressureHpa: number;
  windKmh: number;
  windDir: string;
  coreReservePct: number;
  gridDrawKw: number;
  occupancy: number;
}

export interface PerimeterTelemetry {
  northApproach: "CLEAR" | "CONTACT";
  serviceEntry: "LOCKED" | "OPEN";
  transientContactM: number;
}

function drift(value: number, step: number, min: number, max: number): number {
  const next = value + (Math.random() - 0.5) * step;
  return Math.min(max, Math.max(min, next));
}

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function useSimulatedTelemetry(intervalMs = 4000) {
  const [environment, setEnvironment] = useState<EnvironmentTelemetry>({
    ambientC: 11,
    pressureHpa: 1013,
    windKmh: 19,
    windDir: "NW",
    coreReservePct: 94,
    gridDrawKw: 4.7,
    occupancy: 1,
  });
  const [perimeter, setPerimeter] = useState<PerimeterTelemetry>({
    northApproach: "CLEAR",
    serviceEntry: "LOCKED",
    transientContactM: 410,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setEnvironment((prev) => ({
        ambientC: Math.round(drift(prev.ambientC, 0.4, 4, 22) * 10) / 10,
        pressureHpa: Math.round(drift(prev.pressureHpa, 0.6, 995, 1030)),
        windKmh: Math.round(drift(prev.windKmh, 1.2, 2, 38)),
        windDir: Math.random() < 0.08 ? DIRS[Math.floor(Math.random() * DIRS.length)] : prev.windDir,
        coreReservePct: Math.round(drift(prev.coreReservePct, 0.3, 70, 100) * 10) / 10,
        gridDrawKw: Math.round(drift(prev.gridDrawKw, 0.2, 2.5, 7.5) * 10) / 10,
        occupancy: prev.occupancy,
      }));
      setPerimeter((prev) => ({
        northApproach: prev.northApproach,
        serviceEntry: prev.serviceEntry,
        transientContactM: Math.round(drift(prev.transientContactM, 15, 60, 600)),
      }));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { environment, perimeter };
}
