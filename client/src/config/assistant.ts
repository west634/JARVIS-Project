import type { AssistantSettings } from "../types/assistant";

/** Fallback name used until the backend's non-secret /api/config responds. */
export const DEFAULT_ASSISTANT_NAME = "SENTINEL";

export const DEFAULT_SETTINGS: AssistantSettings = {
  assistantName: DEFAULT_ASSISTANT_NAME,
  responseStyle: "balanced",
  speechRate: 1.0,
  wakeWordEnabled: true,
  theme: "abyss",
  voiceOutputEnabled: true,
};

export const SETTINGS_STORAGE_KEY = "sentinel.settings.v1";
export const NOTES_STORAGE_KEY = "sentinel.notes.v1";
export const HISTORY_STORAGE_KEY = "sentinel.history.v1";

export const MIC_SAMPLE_RATE_LABEL = "16 KHZ";
export const MAX_STORED_TURNS = 60;
