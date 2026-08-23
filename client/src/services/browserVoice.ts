/**
 * Free, zero-setup text-to-speech using the browser's built-in
 * SpeechSynthesis API. No network call, no API key. This is the default
 * voice provider; ElevenLabs remains available as an opt-in premium
 * alternative once the server is configured for it.
 */
export function isBrowserVoiceSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakWithBrowserVoice(text: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isBrowserVoiceSupported()) {
      reject(new Error("This browser doesn't support built-in speech synthesis. Try Chrome, Edge, or Safari."));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.min(1.3, Math.max(0.7, rate));
    utterance.pitch = 1;

    utterance.onend = () => {
      if (currentUtterance === utterance) currentUtterance = null;
      resolve();
    };
    utterance.onerror = (event) => {
      if (currentUtterance === utterance) currentUtterance = null;
      if (event.error === "canceled" || event.error === "interrupted") {
        resolve();
        return;
      }
      reject(new Error("Browser speech synthesis failed."));
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stops any speech in progress. Detaches the current utterance's handlers
 * first so a manual stop leaves the caller's pending speak() promise
 * abandoned rather than resolving it — mirroring StreamingAudioPlayer.stop(),
 * so whichever new state the caller sets next (e.g. LISTENING for barge-in)
 * can't be raced by a stale "speech ended" resolution.
 */
export function stopBrowserVoice(): void {
  if (currentUtterance) {
    currentUtterance.onend = null;
    currentUtterance.onerror = null;
  }
  if (isBrowserVoiceSupported()) window.speechSynthesis.cancel();
  currentUtterance = null;
}
