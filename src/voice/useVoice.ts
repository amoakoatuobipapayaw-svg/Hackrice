// Real ElevenLabs-backed voice hook. Keeps the VoiceApi shape from
// contracts.ts so games/meta code never has to change now that this
// replaces the mock.
import { useCallback, useState } from "react";
import type { VoiceApi } from "../lib/contracts";
import { speakText } from "./ttsClient";
import { recordAndTranscribe } from "./sttRecorder";

export function useVoice(): VoiceApi {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true);
    try {
      await speakText(text);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const listen = useCallback(async () => {
    return recordAndTranscribe();
  }, []);

  return { speak, listen, isSpeaking };
}
