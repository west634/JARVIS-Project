import type { ToolExecutionResult } from "./types.js";

export async function createNote(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const content = String(args.content ?? "").trim();
  if (!content) {
    return { contentForModel: "Error: no note content was provided." };
  }

  return {
    contentForModel: `Note saved locally: "${content}"`,
    pendingAction: {
      type: "create_note",
      requiresConfirmation: false,
      payload: { content },
    },
  };
}
