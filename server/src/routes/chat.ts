import { Router } from "express";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { streamChat } from "../services/openai.js";
import type { ResponseStyle } from "../assistant/persona.js";

export const chatRouter = Router();

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;
const VALID_STYLES: ResponseStyle[] = ["concise", "balanced", "detailed"];

function sseWrite(res: import("express").Response, event: object) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

chatRouter.post("/chat", async (req, res) => {
  const body = req.body as { messages?: ChatMessageInput[]; responseStyle?: string };
  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];

  const messages = rawMessages
    .filter(
      (m): m is ChatMessageInput =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    res.status(400).json({ error: "Request must include at least one non-empty user message." });
    return;
  }

  const responseStyle: ResponseStyle = VALID_STYLES.includes(body?.responseStyle as ResponseStyle)
    ? (body!.responseStyle as ResponseStyle)
    : "balanced";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const history: ChatCompletionMessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));

  try {
    const result = await streamChat(history, responseStyle, {
      onDelta: (text) => sseWrite(res, { type: "delta", text }),
      onToolStart: (toolName) => sseWrite(res, { type: "tool_start", tool: toolName }),
    });

    sseWrite(res, {
      type: "done",
      fullText: result.fullText,
      toolsUsed: result.toolsUsed,
      pendingActions: result.pendingActions,
    });
  } catch (err) {
    console.error("Chat error:", err instanceof Error ? err.message : err);
    const message =
      err instanceof Error && /api key|401|authentication/i.test(err.message)
        ? "The AI service rejected the configured credentials. Check the server's OpenAI API key."
        : err instanceof Error && /rate limit|429/i.test(err.message)
        ? "The AI service is rate-limited right now. Try again in a moment."
        : "The AI service could not complete this request.";
    sseWrite(res, { type: "error", message });
  } finally {
    res.end();
  }
});
