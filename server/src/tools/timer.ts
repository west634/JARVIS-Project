import type { ToolExecutionResult } from "./types.js";

export async function setTimer(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const seconds = Number(args.duration_seconds);
  const label = args.label ? String(args.label).slice(0, 80) : "Timer";

  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 24 * 60 * 60) {
    return { contentForModel: "Error: duration_seconds must be a positive number of seconds, at most 24 hours." };
  }

  return {
    contentForModel: `Timer started: "${label}" for ${seconds} seconds. Confirm this to the user naturally.`,
    pendingAction: {
      type: "set_timer",
      requiresConfirmation: false,
      payload: { seconds, label },
    },
  };
}
