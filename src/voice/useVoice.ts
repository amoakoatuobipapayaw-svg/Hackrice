// Real hook C is building. Re-exports the mock for now so every other
// workstream can import a stable path — swap the body for real
// /api/tts + /api/stt calls, keep the same signature.
import type { VoiceApi } from "../lib/contracts";
import { useMockVoice } from "./mock";

export function useVoice(): VoiceApi {
  return useMockVoice();
}
