// Large, keyboard-accessible mic trigger for voice answers (Math mode etc).
// Lives in voice/ so it can ship without waiting on a components/ui/ slot
// the team hasn't agreed on yet.
import { useState } from "react";
import { Icon } from "../components/ui/Icon";
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
        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-b-4 text-white transition-colors active:translate-y-0.5 active:border-b-2 focus-visible:outline focus-visible:outline-4 focus-visible:outline-brand disabled:active:translate-y-0 ${
          isListening ? "animate-pulse border-danger bg-danger" : "border-brand-hover bg-brand hover:bg-brand-hover disabled:opacity-70"
        }`}
      >
        <Icon name="mic" size={28} />
      </button>
      {isTranscribing ? (
        <p role="status" className="text-sm text-muted">
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
