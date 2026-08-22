import { useCallback, useRef } from "react";
import { createOneShotRecognizer, isSpeechRecognitionSupported } from "../services/speechRecognition";

export interface SpeechRecognitionHandlers {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onEnd: () => void;
  onError: (error: string) => void;
}

export function useSpeechRecognition() {
  const recognizerRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback((handlers: SpeechRecognitionHandlers) => {
    const recognizer = createOneShotRecognizer(handlers);
    if (!recognizer) return false;
    recognizerRef.current = recognizer;
    recognizer.start();
    return true;
  }, []);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
  }, []);

  const abort = useCallback(() => {
    recognizerRef.current?.abort();
    recognizerRef.current = null;
  }, []);

  return { start, stop, abort, isSupported: isSpeechRecognitionSupported() };
}
