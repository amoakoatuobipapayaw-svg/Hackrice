// Large, keyboard-accessible press-and-hold mic trigger for voice answers
// (Math mode etc). Press-and-hold instead of tap-once: the user decides
// exactly when to start and stop talking, like a walkie-talkie — no fixed
// duration to guess, so it never cuts off a longer word or leaves dead air
// for background noise to fill in.
// Lives in voice/ so it can ship without waiting on a components/ui/ slot
// the team hasn't agreed on yet.
import { useRef, useState } from "react";
import { Icon } from "../components/ui/Icon";
import type { VoiceAccessibility } from "./useVoice";

type MicButtonProps = Pick<VoiceAccessibility, "isListening" | "isTranscribing" | "startListening" | "stopListening"> & {
  onResult: (transcript: string) => void;
};

export function MicButton({ isListening, isTranscribing, startListening, stopListening, onResult }: MicButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const pressActiveRef = useRef(false);

  function handlePressStart() {
    if (pressActiveRef.current) return;
    pressActiveRef.current = true;
    setError(null);
    startListening();
  }

  async function handlePressEnd() {
    if (!pressActiveRef.current) return;
    pressActiveRef.current = false;
    try {
      const transcript = await stopListening();
      onResult(transcript);
    } catch {
      setError("Couldn't reach the mic — check permission and try again.");
    }
  }

  const busy = isListening || isTranscribing;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={(e) => {
          e.preventDefault();
          handlePressStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          void handlePressEnd();
        }}
        disabled={isTranscribing}
        aria-pressed={busy}
        aria-label={isTranscribing ? "Transcribing" : isListening ? "Recording — release when done" : "Press and hold to answer by voice"}
        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-b-4 text-white transition-colors active:translate-y-0.5 active:border-b-2 focus-visible:outline focus-visible:outline-4 focus-visible:outline-brand disabled:active:translate-y-0 ${
          isListening ? "animate-pulse border-danger bg-danger" : "border-brand-hover bg-brand hover:bg-brand-hover disabled:opacity-70"
        }`}
      >
        <Icon name="mic" size={28} />
      </button>
      <p className="text-sm text-muted" role="status">
        {isTranscribing ? "Got it — reading that back…" : isListening ? "Listening… release when done" : "Press and hold, then speak"}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
