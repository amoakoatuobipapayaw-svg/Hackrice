// Large, keyboard-accessible mic trigger for voice answers (Math mode etc).
// Lives in voice/ so it can ship without waiting on a components/ui/ slot
// the team hasn't agreed on yet.
import { useState } from "react";
import type { VoiceApi } from "../lib/contracts";
import type { VoiceAccessibility } from "./useVoice";

type MicButtonProps = Pick<VoiceApi, "listen"> &
  Pick<VoiceAccessibility, "isListening" | "isTranscribing"> & {
    onResult: (transcript: string) => void;
  };

export function MicButton({ listen, isListening, isTranscribing, onResult }: MicButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const busy = isListening || isTranscribing;

  async function handleClick() {
    setError(null);
    try {
      const transcript = await listen();
      onResult(transcript);
    } catch {
      setError("Couldn't hear that — check mic permission and try again.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={busy}
        aria-label={isTranscribing ? "Transcribing" : isListening ? "Listening" : "Tap to answer by voice"}
        className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-red-600 text-2xl text-white shadow-lg transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-brand disabled:opacity-70"
      >
        🎤
      </button>
      {isTranscribing ? (
        <p role="status" className="text-sm text-slate-400">
          Got it — reading that back…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
