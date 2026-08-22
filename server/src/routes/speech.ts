import { Router } from "express";
import { synthesizeSpeechStream, ElevenLabsError } from "../services/elevenlabs.js";

export const speechRouter = Router();

const MAX_SPEECH_LENGTH = 2000;

speechRouter.post("/speech", async (req, res) => {
  const body = req.body as { text?: string; speed?: number };
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    res.status(400).json({ error: "No text provided to speak." });
    return;
  }
  if (text.length > MAX_SPEECH_LENGTH) {
    res.status(400).json({ error: `Text too long to speak (max ${MAX_SPEECH_LENGTH} characters).` });
    return;
  }

  try {
    const upstream = await synthesizeSpeechStream({ text, speed: body.speed });
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");

    const reader = upstream.body!.getReader();
    req.on("close", () => {
      reader.cancel().catch(() => {});
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise((resolve) => res.once("drain", resolve));
      }
    }
    res.end();
  } catch (err) {
    if (err instanceof ElevenLabsError) {
      const status = err.status === 401 ? 502 : 502;
      res.status(status).json({ error: "The voice service could not synthesize speech right now." });
      return;
    }
    res.status(500).json({ error: "Unexpected error while synthesizing speech." });
  }
});
