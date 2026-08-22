import type { ToolExecutionResult } from "./types.js";

interface DuckDuckGoResponse {
  AbstractText?: string;
  AbstractURL?: string;
  Heading?: string;
  RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
}

export async function webSearch(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const query = String(args.query ?? "").trim();
  if (!query) {
    return { contentForModel: "Error: no search query was provided." };
  }

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
      contentForModel: `No direct summary was found for "${query}". Tell the user to phrase the query more specifically or that this quick-search tool has limited coverage.`,
    };
  }

  return { contentForModel: `Search results for "${query}":\n${lines.join("\n")}` };
}
