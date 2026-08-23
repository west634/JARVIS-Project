import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageFunctionToolCall,
} from "openai/resources/chat/completions";
import { config } from "../config.js";
import { toolDefinitions, toolExecutors, isToolName } from "../tools/index.js";
import type { PendingAction } from "../tools/types.js";
import { buildSystemPrompt, type ResponseStyle } from "../assistant/persona.js";

const client = new OpenAI({
  apiKey: config.openaiApiKey,
  ...(config.openaiBaseUrl ? { baseURL: config.openaiBaseUrl } : {}),
});

export interface ChatStreamCallbacks {
  onDelta: (text: string) => void;
  onToolStart: (toolName: string) => void;
}

export interface ChatStreamResult {
  fullText: string;
  toolsUsed: string[];
  pendingActions: PendingAction[];
}

interface AccumulatedToolCall {
  id: string;
  name: string;
  arguments: string;
  /**
   * Vendor extension data some OpenAI-compatible providers attach to a tool
   * call delta (e.g. Gemini's `extra_content.google.thought_signature`,
   * which it requires to be echoed back verbatim on the follow-up request
   * or it rejects it — not part of the OpenAI SDK's types, so it's carried
   * through opaquely here instead of being modeled explicitly).
   */
  extra?: Record<string, unknown>;
}

/**
 * Streams a chat completion. If the model requests tool calls, executes them
 * server-side, feeds results back, and streams the follow-up completion —
 * so the client only ever sees natural-language deltas plus final metadata.
 */
export async function streamChat(
  history: ChatCompletionMessageParam[],
  responseStyle: ResponseStyle,
  callbacks: ChatStreamCallbacks
): Promise<ChatStreamResult> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(responseStyle) },
    ...history,
  ];

  const toolsUsed: string[] = [];
  const pendingActions: PendingAction[] = [];

  // First pass: stream, but watch for tool_call deltas.
  const first = await client.chat.completions.create({
    model: config.openaiModel,
    messages,
    tools: toolDefinitions,
    tool_choice: "auto",
    stream: true,
    temperature: 0.6,
  });

  let fullText = "";
  const toolCallAccumulator = new Map<number, AccumulatedToolCall>();

  for await (const chunk of first) {
    const choice = chunk.choices[0];
    if (!choice) continue;
    const delta = choice.delta;

    if (delta?.content) {
      fullText += delta.content;
      callbacks.onDelta(delta.content);
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        // Some OpenAI-compatible providers (e.g. Gemini) omit `index` on
        // single tool calls; fall back to 0 rather than accumulating under
        // an `undefined` key.
        const idx = tc.index ?? 0;
        const existing = toolCallAccumulator.get(idx) ?? { id: "", name: "", arguments: "" };
        if (tc.id) existing.id = tc.id;
        if (tc.function?.name) existing.name += tc.function.name;
        if (tc.function?.arguments) existing.arguments += tc.function.arguments;
        const extra = (tc as unknown as { extra_content?: Record<string, unknown> }).extra_content;
        if (extra) existing.extra = extra;
        toolCallAccumulator.set(idx, existing);
      }
    }
  }

  // Some providers report finish_reason "tool_calls" (OpenAI); others
  // (Gemini's compat layer) report "stop" even when a tool was called. The
  // presence of accumulated tool calls is the reliable signal either way.
  if (toolCallAccumulator.size === 0) {
    return { fullText, toolsUsed, pendingActions };
  }

  // Tool calls requested: execute them, then do a second streaming pass.
  const toolCalls = Array.from(toolCallAccumulator.values()).map((tc) => ({
    id: tc.id,
    type: "function" as const,
    function: { name: tc.name, arguments: tc.arguments || "{}" },
    ...(tc.extra ? { extra_content: tc.extra } : {}),
  }));

  messages.push({
    role: "assistant",
    content: fullText || null,
    tool_calls: toolCalls as ChatCompletionMessageFunctionToolCall[],
  });

  for (const call of toolCalls) {
    const name = call.function.name;
    callbacks.onToolStart(name);
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(call.function.arguments || "{}");
    } catch {
      args = {};
    }

    let resultText: string;
    if (isToolName(name)) {
      try {
        const result = await toolExecutors[name](args);
        resultText = result.contentForModel;
        if (result.pendingAction) pendingActions.push(result.pendingAction);
        toolsUsed.push(name);
      } catch (err) {
        resultText = `Error: tool "${name}" failed to execute (${err instanceof Error ? err.message : "unknown error"}).`;
      }
    } else {
      resultText = `Error: unknown tool "${name}".`;
    }

    messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: resultText,
    });
  }

  const second = await client.chat.completions.create({
    model: config.openaiModel,
    messages,
    stream: true,
    temperature: 0.6,
  });

  let secondText = "";
  for await (const chunk of second) {
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      secondText += delta.content;
      callbacks.onDelta(delta.content);
    }
  }

  return { fullText: secondText, toolsUsed, pendingActions };
}
