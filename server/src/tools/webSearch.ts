import { config } from "../config.js";
import type { ToolExecutionResult } from "./types.js";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  answer?: string;
  results?: TavilyResult[];
}

interface DuckDuckGoResponse {
  AbstractText?: string;
  AbstractURL?: string;
  Heading?: string;
  RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
}

async function searchWithTavily(query: string): Promise<ToolExecutionResult> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.tavilyApiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!res.ok) {
    return { contentForModel: `Error: web search service returned status ${res.status}.` };
  }

  const data = (await res.json()) as TavilyResponse;
  const lines: string[] = [];
  if (data.answer) lines.push(data.answer);
  for (const result of data.results ?? []) {
    lines.push(`- ${result.title}: ${result.content.slice(0, 300)} (${result.url})`);
  }

  if (!lines.length) {
    return { contentForModel: `No web results were found for "${query}".` };
  }

  return { contentForModel: `Search results for "${query}":\n${lines.join("\n")}` };
}

/** Free, keyless fallback with much narrower coverage — only returns anything for topics DuckDuckGo has a summary card for. */
async function searchWithDuckDuckGo(query: string): Promise<ToolExecutionResult> {
  const res = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
  );
  if (!res.ok) {
    return { contentForModel: `Error: web search service returned status ${res.status}.` };
  }
  const data = (await res.json()) as DuckDuckGoResponse;

  const lines: string[] = [];
  if (data.AbstractText) {
    lines.push(`${data.Heading ? data.Heading + ": " : ""}${data.AbstractText}`);
    if (data.AbstractURL) lines.push(`Source: ${data.AbstractURL}`);
  }
  const related = (data.RelatedTopics ?? [])
    .filter((t) => t.Text)
    .slice(0, 3)
    .map((t) => `- ${t.Text}`);
  if (related.length) lines.push(...related);

  if (!lines.length) {
    return {
      contentForModel: `No direct summary was found for "${query}" via the fallback search tool (no TAVILY_API_KEY is configured, so coverage is limited to topics with a quick-reference summary). Tell the user to phrase the query more specifically, or add a free Tavily key for full web search.`,
    };
  }

  return { contentForModel: `Search results for "${query}":\n${lines.join("\n")}` };
}

export async function webSearch(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const query = String(args.query ?? "").trim();
  if (!query) {
    return { contentForModel: "Error: no search query was provided." };
  }

  return config.tavilyApiKey ? searchWithTavily(query) : searchWithDuckDuckGo(query);
}
