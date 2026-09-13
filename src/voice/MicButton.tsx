// Large, keyboard-accessible press-and-hold mic trigger for voice answers
// (Math mode etc). Press-and-hold instead of tap-once: the user decides
// exactly when to start and stop talking, like a walkie-talkie — no fixed
// duration to guess, so it never cuts off a longer word or leaves dead air
// for background noise to fill in.
// Lives in voice/ so it can ship without waiting on a components/ui/ slot
// the team hasn't agreed on yet.
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../components/ui/Icon";
import type { VoiceAccessibility } from "./useVoice";

type MicButtonProps = Pick<VoiceAccessibility, "isListening" | "isTranscribing" | "startListening" | "stopListening"> & {
  onResult: (transcript: string) => void;
};

export function MicButton({ isListening, isTranscribing, startListening, stopListening, onResult }: MicButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const pressActiveRef = useRef(false);

  const handlePressStart = useCallback(() => {
    if (pressActiveRef.current) return;
    pressActiveRef.current = true;
    setError(null);
    startListening();
  }, [startListening]);

  const handlePressEnd = useCallback(async () => {
    if (!pressActiveRef.current) return;
    pressActiveRef.current = false;
    try {
      const transcript = await stopListening();
      onResult(transcript);
    } catch (err) {
      // Surface the real browser error (permission denied vs. no mic found
      // vs. something else) instead of one generic message — this is the
      // difference between "try again" actually being possible or not.
      const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      setError(`Couldn't use the mic (${detail}).`);
    }
  }, [stopListening, onResult]);

  // Releasing anywhere on the page ends the recording — not just releasing
  // over the button. A mouseleave-based version cut off the instant the
  // cursor drifted off a 64px target while still held down, which happens
  // on basically every real press (hands aren't perfectly still); this is
  // the standard, robust way to implement a press-and-hold control.
  useEffect(() => {
    function onRelease() {
      void handlePressEnd();
    }
    window.addEventListener("mouseup", onRelease);
    window.addEventListener("touchend", onRelease);
    window.addEventListener("touchcancel", onRelease);
    return () => {
      window.removeEventListener("mouseup", onRelease);
      window.removeEventListener("touchend", onRelease);
      window.removeEventListener("touchcancel", onRelease);
    };
  }, [handlePressEnd]);

  const busy = isListening || isTranscribing;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onMouseDown={handlePressStart}
        onTouchStart={(e) => {
          e.preventDefault();
          handlePressStart();
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
