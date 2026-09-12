// Real ElevenLabs-backed voice hook. Keeps the VoiceApi shape from
// contracts.ts so games/meta code never has to change now that this
// replaces the mock.
import { useCallback, useState } from "react";
import type { VoiceApi } from "../lib/contracts";
import { speakText } from "./ttsClient";
import { recordAndTranscribe } from "./sttRecorder";

// Caption/listening state is additive on top of VoiceApi (structurally a
// superset, so it's still assignable to VoiceApi) — this drives on-screen
// captions without needing a contracts.ts change or team sign-off.
export type VoiceAccessibility = {
  caption: string | null;
  isListening: boolean;
};

export function useVoice(): VoiceApi & VoiceAccessibility {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);

  const speak = useCallback(async (text: string) => {
    setCaption(text);
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
      const transcript = await recordAndTranscribe();
      setCaption(transcript);
      return transcript;
    } finally {
      setIsListening(false);
    }
  }, []);

  return { speak, listen, isSpeaking, isListening, caption };
}
