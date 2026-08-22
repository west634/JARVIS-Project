import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ActiveTimer,
  AssistantSettings,
  AssistantState,
  ConversationTurn,
  NoteEntry,
  PendingAction,
  SubsystemStatus,
} from "../types/assistant";
import {
  DEFAULT_SETTINGS,
  HISTORY_STORAGE_KEY,
  MAX_STORED_TURNS,
  NOTES_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from "../config/assistant";
import { usePersistentList, usePersistentSettings } from "./usePersistentState";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useMicLevel } from "./useMicLevel";
import { useAudioPlayer } from "./useAudioPlayer";
import { ApiError, requestSpeech, streamChatTurn } from "../services/api";
import { createWakeWordRecognizer, isSpeechRecognitionSupported } from "../services/speechRecognition";

const INTENT_BY_TOOL: Record<string, { intent: string; scope: "LOCAL" | "CLOUD" }> = {
  get_weather: { intent: "env.weather.lookup", scope: "CLOUD" },
  calculate: { intent: "math.evaluate", scope: "LOCAL" },
  web_search: { intent: "web.search.query", scope: "CLOUD" },
  set_timer: { intent: "system.timer.set", scope: "LOCAL" },
  open_website: { intent: "system.navigate.request", scope: "LOCAL" },
  create_note: { intent: "memory.note.create", scope: "LOCAL" },
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAssistant() {
  const [assistantState, setAssistantState] = useState<AssistantState>("IDLE");
  const [settings, setSettings] = usePersistentSettings<AssistantSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
  const [turns, setTurns] = usePersistentList<ConversationTurn>(HISTORY_STORAGE_KEY, []);
  const [notes, setNotes] = usePersistentList<NoteEntry>(NOTES_STORAGE_KEY, []);

  const [interimTranscript, setInterimTranscript] = useState("");
  const [currentUserText, setCurrentUserText] = useState("");
  const [currentResponseText, setCurrentResponseText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingAction | null>(null);
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [subsystems, setSubsystems] = useState<SubsystemStatus>({
    speechRecognition: isSpeechRecognitionSupported() ? "ONLINE" : "UNAVAILABLE",
    wakeWordEngine: "IDLE",
    voiceSynthesis: "ONLINE",
  });
  const [lastIntent, setLastIntent] = useState<{ intent: string; confidence: number; scope: "LOCAL" | "CLOUD" } | null>(
    null
  );

  const speechRecognition = useSpeechRecognition();
  const micLevel = useMicLevel();
  const audioPlayer = useAudioPlayer();

  const abortRef = useRef<AbortController | null>(null);
  const finalTranscriptRef = useRef("");
  const wakeRecognizerRef = useRef<SpeechRecognition | null>(null);
  const stateRef = useRef(assistantState);
  stateRef.current = assistantState;

  const appendTurn = useCallback(
    (turn: ConversationTurn) => {
      setTurns((prev) => [...prev, turn].slice(-MAX_STORED_TURNS));
    },
    [setTurns]
  );

  const stopWakeRecognizer = useCallback(() => {
    if (wakeRecognizerRef.current) {
      try {
        wakeRecognizerRef.current.abort();
      } catch {
        // ignore
      }
      wakeRecognizerRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    stopWakeRecognizer();
    setErrorMessage(null);
    setPendingConfirmation(null);

    try {
      await micLevel.start();
    } catch {
      setAssistantState("ERROR");
      setErrorMessage("Microphone access was denied. Grant microphone permission and try again.");
      setSubsystems((s) => ({ ...s, speechRecognition: "OFFLINE" }));
      return;
    }

    finalTranscriptRef.current = "";
    setInterimTranscript("");
    setCurrentUserText("");
    setCurrentResponseText("");

    const started = speechRecognition.start({
      onInterim: (text) => setInterimTranscript(text),
      onFinal: (text) => {
        finalTranscriptRef.current = text;
        setInterimTranscript(text);
      },
      onEnd: () => {
        micLevel.stop();
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          void runTurnRef.current(finalText);
        } else {
          setAssistantState("IDLE");
        }
      },
      onError: (error) => {
        micLevel.stop();
        if (error === "no-speech" || error === "aborted") {
          setAssistantState("IDLE");
          return;
        }
        setAssistantState("ERROR");
        setSubsystems((s) => ({ ...s, speechRecognition: "OFFLINE" }));
        setErrorMessage(
          error === "not-allowed" || error === "service-not-allowed"
            ? "Microphone access was denied. Grant microphone permission and try again."
            : "Speech recognition failed. Try again."
        );
      },
    });

    if (!started) {
      micLevel.stop();
      setAssistantState("ERROR");
      setSubsystems((s) => ({ ...s, speechRecognition: "UNAVAILABLE" }));
      setErrorMessage("Speech recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    setAssistantState("LISTENING");
  }, [micLevel, speechRecognition, stopWakeRecognizer]);

  const applyPendingActions = useCallback(
    (actions: PendingAction[]) => {
      for (const action of actions) {
        if (action.type === "create_note") {
          const content = String(action.payload.content ?? "");
          setNotes((prev) => [{ id: makeId(), content, createdAt: Date.now() }, ...prev].slice(0, 100));
        } else if (action.type === "set_timer") {
          const seconds = Number(action.payload.seconds ?? 0);
          const label = String(action.payload.label ?? "Timer");
          if (seconds > 0) {
            setActiveTimers((prev) => [
              ...prev,
              { id: makeId(), label, totalSeconds: seconds, remainingSeconds: seconds, startedAt: Date.now() },
            ]);
          }
        } else if (action.type === "open_website") {
          setPendingConfirmation(action);
        }
      }
    },
    [setNotes]
  );

  const speak = useCallback(
    async (text: string, signal: AbortSignal) => {
      if (!settings.voiceOutputEnabled || !text.trim()) {
        setAssistantState("IDLE");
        return;
      }
      try {
        const response = await requestSpeech(text, settings.speechRate, signal);
        setAssistantState("SPEAKING");
        setSubsystems((s) => ({ ...s, voiceSynthesis: "ONLINE" }));
        await audioPlayer.play(response);
        setAssistantState("IDLE");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSubsystems((s) => ({ ...s, voiceSynthesis: "DEGRADED" }));
        setErrorMessage(err instanceof ApiError ? err.message : "SENTINEL's voice output failed.");
        setAssistantState("ERROR");
      }
    },
    [audioPlayer, settings.speechRate, settings.voiceOutputEnabled]
  );

  const runTurn = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed) {
        setAssistantState("IDLE");
        return;
      }

      setAssistantState("PROCESSING");
      setCurrentUserText(trimmed);
      setInterimTranscript("");
      setCurrentResponseText("");
      appendTurn({ id: makeId(), role: "user", text: trimmed, timestamp: Date.now() });

      const history = [...turns, { role: "user" as const, text: trimmed }]
        .slice(-20)
        .map((t) => ({ role: t.role, content: t.text }));

      const controller = new AbortController();
      abortRef.current = controller;
      setAssistantState("THINKING");

      try {
        const outcome = await streamChatTurn(
          history,
          settings.responseStyle,
          {
            onDelta: (text) => setCurrentResponseText((prev) => prev + text),
            onToolStart: () => setAssistantState("THINKING"),
          },
          controller.signal
        );

        const toolName = outcome.toolsUsed[0];
        const mapping = toolName ? INTENT_BY_TOOL[toolName] : undefined;
        setLastIntent({
          intent: mapping?.intent ?? "chat.general.query",
          confidence: mapping ? 0.97 : 0.81,
          scope: mapping?.scope ?? "CLOUD",
        });

        appendTurn({
          id: makeId(),
          role: "assistant",
          text: outcome.fullText,
          timestamp: Date.now(),
          toolsUsed: outcome.toolsUsed,
        });

        applyPendingActions(outcome.pendingActions);

        await speak(outcome.fullText, controller.signal);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setAssistantState("IDLE");
          return;
        }
        const message = err instanceof ApiError ? err.message : "SENTINEL couldn't complete that request.";
        appendTurn({ id: makeId(), role: "assistant", text: message, timestamp: Date.now(), isError: true });
        setErrorMessage(message);
        setAssistantState("ERROR");
      } finally {
        abortRef.current = null;
      }
    },
    [appendTurn, applyPendingActions, settings.responseStyle, speak, turns]
  );

  // Keep a ref to the latest runTurn so the recognizer's onEnd callback
  // (captured once at recognizer creation) always calls the current version.
  const runTurnRef = useRef(runTurn);
  runTurnRef.current = runTurn;

  const stopSpeaking = useCallback(() => {
    audioPlayer.stop();
  }, [audioPlayer]);

  const toggleMic = useCallback(() => {
    switch (assistantState) {
      case "IDLE":
      case "ERROR":
        void startListening();
        return;
      case "LISTENING":
        speechRecognition.stop();
        return;
      case "PROCESSING":
      case "THINKING":
        abortRef.current?.abort();
        setAssistantState("IDLE");
        return;
      case "SPEAKING":
        stopSpeaking();
        void startListening();
        return;
    }
  }, [assistantState, speechRecognition, startListening, stopSpeaking]);

  const confirmPendingAction = useCallback(() => {
    if (pendingConfirmation?.type === "open_website") {
      const url = String(pendingConfirmation.payload.url ?? "");
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
    setPendingConfirmation(null);
  }, [pendingConfirmation]);

  const cancelPendingAction = useCallback(() => setPendingConfirmation(null), []);

  const replay = useCallback(
    async (text: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      await speak(text, controller.signal);
    },
    [speak]
  );

  const clearHistory = useCallback(() => {
    setTurns([]);
    setLastIntent(null);
  }, [setTurns]);

  const dismissError = useCallback(() => {
    setErrorMessage(null);
    setAssistantState("IDLE");
  }, []);

  // Wake word engine: only listens while idle, and only when enabled + supported.
  useEffect(() => {
    if (assistantState !== "IDLE" || !settings.wakeWordEnabled) {
      setSubsystems((s) => (s.wakeWordEngine === "ARMED" ? { ...s, wakeWordEngine: "IDLE" } : s));
      return;
    }
    if (!isSpeechRecognitionSupported()) {
      setSubsystems((s) => ({ ...s, wakeWordEngine: "UNAVAILABLE" }));
      return;
    }

    const recognizer = createWakeWordRecognizer(
      settings.assistantName,
      () => void startListening(),
      () => {
        /* transient recognition errors are ignored — the recognizer keeps running */
      }
    );
    if (!recognizer) {
      setSubsystems((s) => ({ ...s, wakeWordEngine: "UNAVAILABLE" }));
      return;
    }

    wakeRecognizerRef.current = recognizer;
    recognizer.onend = () => {
      // Some browsers end continuous recognition after a timeout; restart while still idle.
      if (stateRef.current === "IDLE" && settings.wakeWordEnabled) {
        try {
          recognizer.start();
        } catch {
          // ignore
        }
      }
    };

    try {
      recognizer.start();
      setSubsystems((s) => ({ ...s, wakeWordEngine: "ARMED" }));
    } catch {
      // ignore InvalidStateError from rapid re-starts
    }

    return () => {
      recognizer.onend = null;
      try {
        recognizer.abort();
      } catch {
        // ignore
      }
      if (wakeRecognizerRef.current === recognizer) wakeRecognizerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantState, settings.wakeWordEnabled, settings.assistantName]);

  // Live countdown for active timers; speaks a completion notice when idle.
  useEffect(() => {
    if (activeTimers.length === 0) return;
    const id = setInterval(() => {
      setActiveTimers((prev) => {
        const next: ActiveTimer[] = [];
        for (const timer of prev) {
          const elapsed = (Date.now() - timer.startedAt) / 1000;
          const remaining = Math.max(0, Math.round(timer.totalSeconds - elapsed));
          if (remaining <= 0) {
            appendTurn({
              id: makeId(),
              role: "assistant",
              text: `Timer "${timer.label}" complete.`,
              timestamp: Date.now(),
            });
            if (stateRef.current === "IDLE") {
              const controller = new AbortController();
              void speak(`Timer complete: ${timer.label}.`, controller.signal);
            }
          } else {
            next.push({ ...timer, remainingSeconds: remaining });
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTimers.length]);

  return {
    assistantState,
    settings,
    setSettings,
    turns,
    notes,
    interimTranscript,
    currentUserText,
    currentResponseText,
    errorMessage,
    pendingConfirmation,
    activeTimers,
    subsystems,
    lastIntent,
    micLevel: assistantState === "SPEAKING" ? audioPlayer.level : micLevel.level,
    micGainDb: micLevel.gainDb,
    toggleMic,
    confirmPendingAction,
    cancelPendingAction,
    replay,
    clearHistory,
    dismissError,
  };
}
