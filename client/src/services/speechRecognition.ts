export function getSpeechRecognitionCtor(): SpeechRecognitionStatic | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export interface RecognitionCallbacks {
  onInterim: (transcript: string) => void;
  onFinal: (transcript: string) => void;
  onEnd: () => void;
  onError: (error: string) => void;
}

/** Creates a one-shot recognizer: listens, emits interim + final transcript, then stops. */
export function createOneShotRecognizer(callbacks: RecognitionCallbacks): SpeechRecognition | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognizer = new Ctor();
  recognizer.lang = "en-US";
  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;

  let finalTranscript = "";

  recognizer.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? "";
      if (result.isFinal) {
        finalTranscript += text;
      } else {
        interim += text;
      }
    }
    if (interim) callbacks.onInterim(interim);
    if (finalTranscript) callbacks.onFinal(finalTranscript.trim());
  };

  recognizer.onerror = (event) => {
    callbacks.onError(event.error || "unknown-error");
  };

  recognizer.onend = () => {
    callbacks.onEnd();
  };

  return recognizer;
}

/** Creates a continuous, restart-on-end recognizer used to listen for the wake word. */
export function createWakeWordRecognizer(
  wakeWord: string,
  onWake: () => void,
  onError: (error: string) => void
): SpeechRecognition | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognizer = new Ctor();
  recognizer.lang = "en-US";
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;

  const needle = wakeWord.trim().toLowerCase();

  recognizer.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = (event.results[i][0]?.transcript ?? "").toLowerCase();
      if (needle && text.includes(needle)) {
        onWake();
        return;
      }
    }
  };

  recognizer.onerror = (event) => {
    if (event.error !== "no-speech" && event.error !== "aborted") {
      onError(event.error || "unknown-error");
    }
  };

  return recognizer;
}
