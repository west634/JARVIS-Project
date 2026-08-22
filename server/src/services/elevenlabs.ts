import { config } from "../config.js";

export interface SpeakOptions {
  text: string;
  speed?: number; // 0.7 - 1.2, ElevenLabs voice_settings range
}

export class ElevenLabsError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ElevenLabsError";
  }
}

/**
 * Requests streaming TTS audio from ElevenLabs and returns the raw response
 * body stream so the caller can pipe it straight through to the client —
 * audio starts reaching the browser before ElevenLabs finishes generating it.
 */
export async function synthesizeSpeechStream(options: SpeakOptions): Promise<Response> {
  const text = options.text.trim();
  if (!text) {
    throw new ElevenLabsError("No text provided for speech synthesis.");
  }

  const speed = options.speed ? Math.min(1.2, Math.max(0.7, options.speed)) : 1.0;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabsVoiceId}/stream?optimize_streaming_latency=3`,
    {
      method: "POST",
      headers: {
        "xi-api-key": config.elevenLabsApiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
          speed,
        },
      }),
    }
  );

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new ElevenLabsError(
      `ElevenLabs request failed with status ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      res.status
    );
  }

  return res;
}
