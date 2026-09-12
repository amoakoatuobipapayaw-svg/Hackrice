// Fake voice API so B and D can build against a stable shape before C's
// real ElevenLabs integration exists. Owned by C — replace the internals,
// keep the VoiceApi shape from contracts.ts.
import { useState } from "react";
import type { VoiceApi } from "../lib/contracts";

export function useMockVoice(): VoiceApi {
  const [isSpeaking, setIsSpeaking] = useState(false);

  async function speak(text: string) {
    console.log("[voice mock] speak:", text);
    setIsSpeaking(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsSpeaking(false);
  }

  async function listen(): Promise<string> {
    console.log("[voice mock] listen -> returning fixed transcript");
    return "five";
  }

  return { speak, listen, isSpeaking };
}
