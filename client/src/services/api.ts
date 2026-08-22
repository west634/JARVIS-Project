import type { PendingAction, ResponseStyle } from "../types/assistant";

export interface ChatStreamHandlers {
  onDelta: (text: string) => void;
  onToolStart?: (toolName: string) => void;
}

export interface ChatStreamOutcome {
  fullText: string;
  toolsUsed: string[];
  pendingActions: PendingAction[];
}

export class ApiError extends Error {}

export async function fetchAssistantConfig(): Promise<{ assistantName: string }> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new ApiError("Could not reach the SENTINEL backend.");
  return res.json();
}

/**
 * Streams a chat turn via SSE-over-fetch (POST bodies aren't supported by
 * EventSource), parsing `data: {...}\n\n` frames as they arrive so the UI can
 * render deltas the moment they're generated instead of waiting on the full
 * response.
 */
export async function streamChatTurn(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  responseStyle: ResponseStyle,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
): Promise<ChatStreamOutcome> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, responseStyle }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new ApiError(`SENTINEL's reasoning service is unreachable (status ${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const toolsUsed: string[] = [];
  let pendingActions: PendingAction[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json) continue;

      let event: Record<string, unknown>;
      try {
        event = JSON.parse(json);
      } catch {
        continue;
      }

      if (event.type === "delta" && typeof event.text === "string") {
        fullText += event.text;
        handlers.onDelta(event.text);
      } else if (event.type === "tool_start" && typeof event.tool === "string") {
        toolsUsed.push(event.tool);
        handlers.onToolStart?.(event.tool);
      } else if (event.type === "done") {
        if (typeof event.fullText === "string" && !fullText) fullText = event.fullText;
        if (Array.isArray(event.pendingActions)) pendingActions = event.pendingActions as PendingAction[];
      } else if (event.type === "error" && typeof event.message === "string") {
        throw new ApiError(event.message);
      }
    }
  }

  return { fullText, toolsUsed, pendingActions };
}

/**
 * Requests streaming TTS audio and returns the raw Response so the caller can
 * feed the body into MediaSource for progressive playback.
 */
export async function requestSpeech(text: string, speed: number, signal?: AbortSignal): Promise<Response> {
  const res = await fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, speed }),
    signal,
  });
  if (!res.ok) {
    let message = "SENTINEL's voice service is unavailable.";
    try {
      const body = await res.json();
      if (typeof body.error === "string") message = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(message);
  }
  return res;
}
