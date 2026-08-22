import type { ToolExecutionResult } from "./types.js";

const KNOWN_SITES: Record<string, string> = {
  youtube: "https://www.youtube.com",
  google: "https://www.google.com",
  gmail: "https://mail.google.com",
  maps: "https://maps.google.com",
  github: "https://github.com",
  wikipedia: "https://www.wikipedia.org",
  news: "https://news.google.com",
};

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  if (KNOWN_SITES[trimmed]) return KNOWN_SITES[trimmed];
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export async function openWebsite(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const target = String(args.site ?? "").trim();
  const url = normalizeUrl(target);

  if (!url) {
    return { contentForModel: `Error: "${target}" is not a recognizable site name or URL.` };
  }

  return {
    contentForModel: `Prepared a request to open ${url}. This requires the operator's explicit confirmation before it happens — ask them to confirm.`,
    pendingAction: {
      type: "open_website",
      requiresConfirmation: true,
      payload: { url },
    },
  };
}
