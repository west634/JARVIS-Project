import type { ToolDefinition, ToolExecutor, ToolName } from "./types.js";
import { getWeather } from "./weather.js";
import { calculate } from "./calculate.js";
import { webSearch } from "./webSearch.js";
import { setTimer } from "./timer.js";
import { openWebsite } from "./website.js";
import { createNote } from "./notes.js";

export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_weather" satisfies ToolName,
      description: "Get current live weather conditions for a named city or place.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City and, if known, country, e.g. 'Austin, TX'." },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate" satisfies ToolName,
      description: "Evaluate a mathematical expression precisely, e.g. '145 * 27' or 'sqrt(2)^3'.",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "The math expression to evaluate." },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search" satisfies ToolName,
      description: "Search the web for a brief factual summary on a topic or current event.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_timer" satisfies ToolName,
      description: "Start a countdown timer in the operator's interface.",
      parameters: {
        type: "object",
        properties: {
          duration_seconds: { type: "number", description: "Timer duration in seconds." },
          label: { type: "string", description: "Short label for what the timer is for." },
        },
        required: ["duration_seconds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_website" satisfies ToolName,
      description:
        "Propose opening a website or web app for the operator (e.g. YouTube, GitHub, a URL). Requires explicit operator confirmation before it actually opens.",
      parameters: {
        type: "object",
        properties: {
          site: { type: "string", description: "Site name (e.g. 'youtube') or full URL." },
        },
        required: ["site"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_note" satisfies ToolName,
      description: "Save a short note locally for the operator to reference later.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The note text to save." },
        },
        required: ["content"],
      },
    },
  },
];

export const toolExecutors: Record<ToolName, ToolExecutor> = {
  get_weather: getWeather,
  calculate,
  web_search: webSearch,
  set_timer: setTimer,
  open_website: openWebsite,
  create_note: createNote,
};

export function isToolName(name: string): name is ToolName {
  return name in toolExecutors;
}
