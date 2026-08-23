# SENTINEL — Voice-First AI Operations Shell

An original, JARVIS-inspired AI assistant: a voice-first HUD that listens, reasons with an
OpenAI-compatible LLM, speaks out loud, and can act through a small set of confirmable tools
(weather, web search, calculator, timers, notes, opening sites).

**Runs entirely for free** by default: voice uses the browser's built-in speech synthesis (no
signup), and the brain works with Google's free Gemini API tier (no credit card) as well as paid
OpenAI. See [Free setup](#free-setup) below.

The assistant's display name, personality, and voice are all configuration, not hard-coded strings —
see `server/src/assistant/persona.ts` and `.env`.

## Architecture

```
client/                React + TypeScript + Vite + Tailwind v4 — the HUD UI
  src/components/       Header, AIVisualizer (canvas), MicrophoneButton, panels, Settings, modals
  src/hooks/             useAssistant (state machine), useSpeechRecognition, useMicLevel,
                         useAudioPlayer, useSimulatedTelemetry, usePersistentState
  src/services/         api.ts (SSE chat + speech fetch), audioPlayback.ts (MediaSource streaming),
                         browserVoice.ts (free built-in TTS), speechRecognition.ts (Web Speech API)
  src/types/, src/config/

server/                Express + TypeScript — the only place that touches your API keys
  src/routes/            chat.ts (SSE), speech.ts (ElevenLabs streaming proxy, optional), meta.ts
  src/services/          openai.ts (streaming + tool-calling loop, OpenAI-compatible), elevenlabs.ts
  src/tools/             get_weather, calculate, web_search, set_timer, open_website, create_note
  src/assistant/persona.ts
```

API keys live only in `server/.env` (loaded from the repo root) and are never sent to the browser.
The client talks to `/api/chat` and `/api/speech` on your own backend, which then calls the LLM
and (optionally) ElevenLabs server-side.

## Free setup

```bash
cp .env.example .env
npm run install:all
npm run dev   # client on :5173, server on :8787
```

In `.env`, get a free Gemini key (no credit card) at https://aistudio.google.com/apikey, then set:

```env
OPENAI_API_KEY=<your Gemini key>
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.0-flash
```

Leave `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` blank — voice already defaults to the free
browser voice (confirmed in Settings → Voice Provider). That's it; nothing costs money.

Prefer paid OpenAI instead? Set `OPENAI_API_KEY` to a real OpenAI key, leave `OPENAI_BASE_URL`
blank, and pick any OpenAI chat model for `OPENAI_MODEL`. Want the premium ElevenLabs voice
instead of the browser one? Fill in `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` and switch the
provider in Settings.

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to the backend on `:8787`.

### Production build

```bash
npm run build   # builds client, then server
npm start       # serves the built client + API from a single Express process on $PORT
```

## Environment variables (`.env`, never committed)

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Reasoning layer key — an OpenAI key, or a free Gemini key when paired with `OPENAI_BASE_URL` |
| `OPENAI_BASE_URL` | Optional. Point this at any OpenAI-compatible endpoint (e.g. Gemini's). Leave blank for real OpenAI |
| `OPENAI_MODEL` | Chat model name (default `gpt-4o-mini`; use `gemini-2.0-flash` for Gemini) |
| `ELEVENLABS_API_KEY` | Optional. Only needed for the premium ElevenLabs voice |
| `ELEVENLABS_VOICE_ID` | Optional. Voice ID for ElevenLabs, if used |
| `PORT` | Backend port (default `8787`) |

## What's real vs. decorative

- **Assistant state machine** (`IDLE / LISTENING / PROCESSING / THINKING / SPEAKING / ERROR`),
  **speech recognition**, **streaming chat**, **TTS playback** (browser voice or streamed
  ElevenLabs audio), **tool calls** (weather via Open-Meteo, search via DuckDuckGo, calculator via
  mathjs, timers, notes, site-open confirmation), and the **subsystem roster** are all wired to
  real application/browser state — no `setTimeout`-driven fake progress.
- The **Environment** and **Perimeter** panels are intentionally stylized "ops shell" flavor
  telemetry (there's no building sensor behind them) that drifts on a slow random walk, matching
  the reference HUD's aesthetic. Everything else reflects genuine state.

## Security

- API keys are read only in `server/src/config.ts` and used only inside `server/src/services/`.
- `.env` is git-ignored; `.env.example` ships with empty values.
- The client bundle contains no secrets (verified by grepping the production build output).
- The only destructive-ish action (opening a website) requires explicit user confirmation before
  anything happens.
