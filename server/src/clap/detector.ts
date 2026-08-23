import { spawn } from "node:child_process";
import { openTarget } from "../utils/opener.js";

const SAMPLE_RATE = 16000;
const FRAME_MS = 20;
const FRAME_BYTES = Math.round((SAMPLE_RATE * FRAME_MS) / 1000) * 2; // 16-bit samples

// A clap is a sharp transient well above the ambient noise floor. These
// thresholds are deliberately conservative defaults — a real room's noise
// floor and clap loudness vary a lot, so this will need tuning per setup.
const NOISE_FLOOR_MULTIPLIER = 5;
const ABSOLUTE_MIN_PEAK = 3000; // out of a possible 32767, guards against triggering in near-silence
const CLAP_REFRACTORY_MS = 150; // ignore re-triggers from the same clap's decay
const DOUBLE_CLAP_MIN_GAP_MS = 200; // two claps closer than this are probably one clap
const DOUBLE_CLAP_MAX_GAP_MS = 1200; // two claps further apart than this don't count as a pair
const TRIGGER_COOLDOWN_MS = 4000; // after firing, ignore everything for a bit

export interface ClapDetectorOptions {
  onDoubleClap: () => void;
  onUnavailable?: (reason: string) => void;
}

/**
 * Listens to the system microphone at the OS level (via `sox`, since a
 * browser tab can't run JS while it isn't open — this has to live outside
 * the browser to "open the tab" in the first place) and fires a callback
 * when it hears two claps in quick succession.
 */
export function startClapDetector(options: ClapDetectorOptions): { stop: () => void } {
  const sox = spawn("sox", ["-d", "-t", "raw", "-b", "16", "-e", "signed", "-c", "1", "-r", String(SAMPLE_RATE), "-"]);

  let noiseFloor = 500;
  let lastClapAt = 0;
  let lastTriggerAt = 0;
  let buffer = Buffer.alloc(0);

  sox.on("error", (err) => {
    const reason =
      (err as NodeJS.ErrnoException).code === "ENOENT"
        ? 'Clap-to-open needs "sox" installed (run `brew install sox` on macOS), then restart the server.'
        : `Clap-to-open couldn't start the microphone listener: ${err.message}`;
    options.onUnavailable?.(reason);
  });

  sox.stdout.on("data", (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= FRAME_BYTES) {
      const frame = buffer.subarray(0, FRAME_BYTES);
      buffer = buffer.subarray(FRAME_BYTES);

      let peak = 0;
      for (let i = 0; i < frame.length; i += 2) {
        const sample = Math.abs(frame.readInt16LE(i));
        if (sample > peak) peak = sample;
      }

      const now = Date.now();
      const isClap = peak > Math.max(noiseFloor * NOISE_FLOOR_MULTIPLIER, ABSOLUTE_MIN_PEAK);

      if (isClap) {
        if (now - lastTriggerAt < TRIGGER_COOLDOWN_MS) continue;
        if (now - lastClapAt < CLAP_REFRACTORY_MS) continue;

        const gap = now - lastClapAt;
        if (gap >= DOUBLE_CLAP_MIN_GAP_MS && gap <= DOUBLE_CLAP_MAX_GAP_MS) {
          lastTriggerAt = now;
          lastClapAt = 0;
          options.onDoubleClap();
        } else {
          lastClapAt = now;
        }
      } else {
        // Only let quiet frames drift the noise floor, so a clap's own
        // loudness never teaches the detector to ignore claps.
        noiseFloor = noiseFloor * 0.99 + peak * 0.01;
      }
    }
  });

  sox.stderr.on("data", () => {
    // sox writes device/status chatter to stderr; nothing actionable to surface.
  });

  return {
    stop: () => {
      sox.kill();
    },
  };
}

export async function openOnDoubleClap(url: string): Promise<void> {
  try {
    await openTarget(url);
  } catch {
    // best-effort — if this fails there's no request/response to report it through
  }
}
