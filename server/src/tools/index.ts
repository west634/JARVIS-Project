import type { ToolDefinition, ToolExecutor, ToolName } from "./types.js";
import { getWeather } from "./weather.js";
import { calculate } from "./calculate.js";
import { webSearch } from "./webSearch.js";
import { setTimer } from "./timer.js";
import { openWebsite } from "./website.js";
import { createNote } from "./notes.js";
import { listDirectory, readFile, openFile } from "./files.js";
import { searchEmail } from "./email.js";

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
  {
    type: "function",
    function: {
      name: "list_directory" satisfies ToolName,
      description:
        "List the files and folders inside a directory on the operator's computer. Accepts '~' for the home directory.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path to list, e.g. '~/Desktop' or '~'." },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file" satisfies ToolName,
      description: "Read the text contents of a file on the operator's computer.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Full or '~'-relative path to the file to read." },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_file" satisfies ToolName,
      description:
        "Propose opening a file on the operator's computer in its default application. Requires explicit operator confirmation before it actually opens.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Full or '~'-relative path to the file to open." },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_email" satisfies ToolName,
      description:
        "Search the operator's email inbox for messages matching a query (matches subject, sender, and body) and return the most relevant results.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search terms, e.g. a sender, subject keyword, or topic." },
          max_results: { type: "number", description: "Maximum number of emails to return (default 5, max 15)." },
        },
        required: ["query"],
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
  list_directory: listDirectory,
  read_file: readFile,
  open_file: openFile,
  search_email: searchEmail,
};

export function isToolName(name: string): name is ToolName {
  return name in toolExecutors;
}
