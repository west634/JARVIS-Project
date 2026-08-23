import type OpenAI from "openai";

export type ToolName =
  | "get_weather"
  | "calculate"
  | "web_search"
  | "set_timer"
  | "open_website"
  | "create_note"
  | "list_directory"
  | "read_file"
  | "open_file"
  | "search_email";

export interface PendingAction {
  type: "open_website" | "set_timer" | "create_note" | "open_file";
  requiresConfirmation: boolean;
  payload: Record<string, unknown>;
}

export interface ToolExecutionResult {
  /** Text fed back to the model so it can produce a grounded natural-language reply. */
  contentForModel: string;
  /** Optional structured action the client UI must actually carry out (timer, note, navigation, file open). */
  pendingAction?: PendingAction;
}

export type ToolExecutor = (args: Record<string, unknown>) => Promise<ToolExecutionResult>;

export type ToolDefinition = OpenAI.Chat.Completions.ChatCompletionTool;
