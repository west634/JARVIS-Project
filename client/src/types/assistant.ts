export type AssistantState = "IDLE" | "LISTENING" | "PROCESSING" | "THINKING" | "SPEAKING" | "ERROR";

export type ResponseStyle = "concise" | "balanced" | "detailed";

export interface ConversationTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  toolsUsed?: string[];
  intent?: string;
  confidence?: number;
  isError?: boolean;
}

export type PendingActionType = "open_website" | "set_timer" | "create_note";

export interface PendingAction {
  type: PendingActionType;
  requiresConfirmation: boolean;
  payload: Record<string, unknown>;
}

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  startedAt: number;
}

export interface NoteEntry {
  id: string;
  content: string;
  createdAt: number;
}

export interface AssistantSettings {
  assistantName: string;
  responseStyle: ResponseStyle;
  speechRate: number; // 0.7 - 1.2
  wakeWordEnabled: boolean;
  theme: "abyss" | "daylight";
  voiceOutputEnabled: boolean;
}

export interface SubsystemStatus {
  speechRecognition: "ONLINE" | "OFFLINE" | "UNAVAILABLE";
  wakeWordEngine: "ARMED" | "IDLE" | "UNAVAILABLE";
  voiceSynthesis: "ONLINE" | "DEGRADED" | "OFFLINE";
}
