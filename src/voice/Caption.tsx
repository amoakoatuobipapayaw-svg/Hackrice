// Visual/screen-reader caption for whatever useVoice() is speaking or
// listening to. Lives in voice/ (not components/ui/) so it can ship without
// waiting on a shared-component slot; games/meta can drop it in wherever
// they render a <useVoice() /> consumer.
import type { VoiceAccessibility } from "./useVoice";

type CaptionProps = VoiceAccessibility & {
  isSpeaking: boolean;
};

export function Caption({ caption, isSpeaking, isListening, isTranscribing }: CaptionProps) {
  if (!caption && !isListening && !isTranscribing) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border-2 border-line bg-surface px-4 py-3 text-lg font-bold text-ink"
    >
      {isListening ? "Listening…" : isTranscribing ? "Reading that back…" : caption}
      {isSpeaking && caption ? <span className="sr-only"> (speaking)</span> : null}
    </div>
  );
}
