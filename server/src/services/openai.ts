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
  let finishReason: string | null = null;

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
        const idx = tc.index;
        const existing = toolCallAccumulator.get(idx) ?? { id: "", name: "", arguments: "" };
        if (tc.id) existing.id = tc.id;
        if (tc.function?.name) existing.name += tc.function.name;
        if (tc.function?.arguments) existing.arguments += tc.function.arguments;
        toolCallAccumulator.set(idx, existing);
      }
    }

    if (choice.finish_reason) finishReason = choice.finish_reason;
  }

  if (finishReason !== "tool_calls" || toolCallAccumulator.size === 0) {
    return { fullText, toolsUsed, pendingActions };
  }

  // Tool calls requested: execute them, then do a second streaming pass.
  const toolCalls: ChatCompletionMessageFunctionToolCall[] = Array.from(toolCallAccumulator.values()).map((tc) => ({
    id: tc.id,
    type: "function" as const,
    function: { name: tc.name, arguments: tc.arguments || "{}" },
  }));

  messages.push({
    role: "assistant",
    content: fullText || null,
    tool_calls: toolCalls,
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
