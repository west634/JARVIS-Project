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

export const config = {
  port: Number(process.env.PORT) || 8787,
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  elevenLabsApiKey: required("ELEVENLABS_API_KEY"),
  elevenLabsVoiceId: required("ELEVENLABS_VOICE_ID"),
};

export function describeConfigError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown configuration error.";
}
