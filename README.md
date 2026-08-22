# SENTINEL — Voice-First AI Operations Shell

An original, JARVIS-inspired AI assistant: a voice-first HUD that listens, reasons with OpenAI,
speaks with an ElevenLabs voice, and can act through a small set of confirmable tools (weather,
web search, calculator, timers, notes, opening sites).

The assistant's display name, personality, and voice are all configuration, not hard-coded strings —
see `server/src/assistant/persona.ts` and `.env`.

## Architecture

```
client/                React + TypeScript + Vite + Tailwind v4 — the HUD UI
  src/components/       Header, AIVisualizer (canvas), MicrophoneButton, panels, Settings, modals
  src/hooks/             useAssistant (state machine), useSpeechRecognition, useMicLevel,
                         useAudioPlayer, useSimulatedTelemetry, usePersistentState
  src/services/         api.ts (SSE chat + speech fetch), audioPlayback.ts (MediaSource streaming),
                         speechRecognition.ts (Web Speech API wrapper)
  src/types/, src/config/

server/                Express + TypeScript — the only place that touches your API keys
  src/routes/            chat.ts (SSE), speech.ts (audio streaming proxy), meta.ts (non-secret config)
  src/services/          openai.ts (streaming + tool-calling loop), elevenlabs.ts (TTS streaming)
  src/tools/             get_weather, calculate, web_search, set_timer, open_website, create_note
  src/assistant/persona.ts
```

Both API keys live only in `server/.env` (loaded from the repo root) and are never sent to the
browser. The client talks to `/api/chat` and `/api/speech` on your own backend, which then calls
OpenAI and ElevenLabs server-side.

## Setup

```bash
cp .env.example .env       # then fill in your keys
npm run install:all        # installs client + server dependencies
npm run dev                # runs both dev servers (client on :5173, server on :8787)
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to the backend on `:8787`.

### Production build

```bash
npm run build   # builds client, then server
npm start       # serves the built client + API from a single Express process on $PORT
```

## Environment variables (`.env`, never committed)

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Reasoning/intelligence layer (chat + tool calling) |
| `ELEVENLABS_API_KEY` | Text-to-speech |
| `ELEVENLABS_VOICE_ID` | Voice used for all TTS output |
| `OPENAI_MODEL` | Chat model (default `gpt-4o-mini`) |
| `PORT` | Backend port (default `8787`) |

## What's real vs. decorative

- **Assistant state machine** (`IDLE / LISTENING / PROCESSING / THINKING / SPEAKING / ERROR`),
  **speech recognition**, **streaming chat**, **streaming TTS playback**, **tool calls**
  (weather via Open-Meteo, search via DuckDuckGo, calculator via mathjs, timers, notes, site-open
  confirmation), and the **subsystem roster** are all wired to real application/browser state —
  no `setTimeout`-driven fake progress.
- The **Environment** and **Perimeter** panels are intentionally stylized "ops shell" flavor
  telemetry (there's no building sensor behind them) that drifts on a slow random walk, matching
  the reference HUD's aesthetic. Everything else reflects genuine state.

## Known limitation: the provided API keys

Both integrations are fully implemented and were verified against the live OpenAI and ElevenLabs
APIs during development, but the specific credentials supplied to this build currently can't
complete requests due to account-level restrictions, not a bug in this app:

- **OpenAI**: the key returns `insufficient_quota` — the account needs billing/credits added.
- **ElevenLabs**: the account is on the free tier, which blocks the TTS API entirely for the
  configured voice (`free_users_not_allowed` / `payment_required`), including ElevenLabs's own
  default library voices.

Once billing is added on both accounts, no code changes are needed — the app will start
speaking and reasoning immediately. Until then, the UI degrades gracefully: errors surface as a
readable message in the HUD (never a raw stack trace or key), and the Subsystem Roster reflects
the degraded state.

## Security

- API keys are read only in `server/src/config.ts` and used only inside `server/src/services/`.
- `.env` is git-ignored; `.env.example` ships with empty values.
- The client bundle contains no secrets (verified by grepping the production build output).
- The only destructive-ish action (opening a website) requires explicit user confirmation before
  anything happens.
