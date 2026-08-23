import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the repo-root .env regardless of where the process is started from.
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env at the project root and fill in your keys.`
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

const elevenLabsApiKey = optional("ELEVENLABS_API_KEY");
const elevenLabsVoiceId = optional("ELEVENLABS_VOICE_ID");
const emailAddress = optional("EMAIL_ADDRESS");
const emailAppPassword = optional("EMAIL_APP_PASSWORD");
const tavilyApiKey = optional("TAVILY_API_KEY");

export const config = {
  port: Number(process.env.PORT) || 8787,
  // "OPENAI_API_KEY" also accepts a free Google Gemini key when OPENAI_BASE_URL
  // is pointed at Gemini's OpenAI-compatible endpoint — see .env.example.
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiBaseUrl: optional("OPENAI_BASE_URL"),
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  // ElevenLabs is optional: the client defaults to the browser's free built-in
  // voice and only calls /api/speech if the operator switches to ElevenLabs
  // in Settings, so the server shouldn't refuse to start without it.
  elevenLabsApiKey,
  elevenLabsVoiceId,
  ttsConfigured: Boolean(elevenLabsApiKey && elevenLabsVoiceId),
  // Email search is entirely optional — the search_email tool reports a
  // clear "not configured" error until these are set.
  emailAddress,
  emailAppPassword,
  emailImapHost: process.env.EMAIL_IMAP_HOST || "imap.gmail.com",
  emailImapPort: Number(process.env.EMAIL_IMAP_PORT) || 993,
  emailConfigured: Boolean(emailAddress && emailAppPassword),
  // web_search falls back to a much weaker keyless search when this is unset.
  tavilyApiKey,
  // Clap-to-open: opt-in OS-level double-clap listener (see clap/detector.ts).
  clapToOpenEnabled: (process.env.CLAP_TO_OPEN_ENABLED || "").toLowerCase() === "true",
  clapOpenUrl: optional("CLAP_OPEN_URL"),
};

export function describeConfigError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown configuration error.";
}
