// Whether ElevenLabs TTS should actually play audio aloud. Asked once during
// onboarding (not everyone wants prompts/answers spoken); changeable anytime
// via the nav toggle. Defaults to on until the user answers either way.
const STORAGE_KEY = "signly:tts-enabled";

export function getTtsEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setTtsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // localStorage unavailable (private mode etc.) — preference just won't persist
  }
}
