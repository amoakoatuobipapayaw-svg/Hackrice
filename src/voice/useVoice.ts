// Real ElevenLabs-backed voice hook. Keeps the VoiceApi shape from
// contracts.ts so games/meta code never has to change now that this
// replaces the mock.
import { useCallback, useRef, useState } from "react";
import type { VoiceApi } from "../lib/contracts";
import { speakText } from "./ttsClient";
import { beginRecording, recordAndTranscribe, type RecordingHandle } from "./sttRecorder";
import { getTtsEnabled } from "./ttsPreference";

// Caption/listening state is additive on top of VoiceApi (structurally a
// superset, so it's still assignable to VoiceApi) — this drives on-screen
// captions without needing a contracts.ts change or team sign-off.
// startListening/stopListening are additive too: they let a press-and-hold
// mic button (see MicButton.tsx) control exactly when recording starts and
// stops, instead of guessing a fixed duration.
export type VoiceAccessibility = {
  caption: string | null;
  isListening: boolean;
  isTranscribing: boolean;
  startListening: () => void;
  stopListening: () => Promise<string>;
};

export function useVoice(): VoiceApi & VoiceAccessibility {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const pendingHandle = useRef<Promise<RecordingHandle> | null>(null);

  const speak = useCallback(async (text: string) => {
    setCaption(text);
    if (!getTtsEnabled()) return;
    setIsSpeaking(true);
    try {
      await speakText(text);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const listen = useCallback(async () => {
    setIsListening(true);
    try {
      const transcript = await recordAndTranscribe((phase) => {
        setIsListening(phase === "recording");
        setIsTranscribing(phase === "transcribing");
      });
      setCaption(transcript);
      return transcript;
    } finally {
      setIsListening(false);
      setIsTranscribing(false);
    }
  }, []);

  const startListening = useCallback(() => {
    setIsListening(true);
    pendingHandle.current = beginRecording().catch((err) => {
      setIsListening(false);
      throw err;
    });
  }, []);

  const stopListening = useCallback(async () => {
    const pending = pendingHandle.current;
    pendingHandle.current = null;
    setIsListening(false);
    if (!pending) return "";
    setIsTranscribing(true);
    try {
      const handle = await pending;
      const transcript = await handle.stopAndTranscribe();
      setCaption(transcript);
      return transcript;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return { speak, listen, isSpeaking, isListening, isTranscribing, caption, startListening, stopListening };
}
