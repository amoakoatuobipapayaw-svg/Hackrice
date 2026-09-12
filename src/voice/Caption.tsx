// Visual/screen-reader caption for whatever useVoice() is speaking or
// listening to. Lives in voice/ (not components/ui/) so it can ship without
// waiting on a shared-component slot; games/meta can drop it in wherever
// they render a <useVoice() /> consumer.
import type { VoiceAccessibility } from "./useVoice";

type CaptionProps = VoiceAccessibility & {
  isSpeaking: boolean;
};

export function Caption({ caption, isSpeaking, isListening }: CaptionProps) {
  if (!caption && !isListening) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-3 text-lg font-medium text-white shadow-lg"
    >
      {isListening ? "Listening…" : caption}
      {isSpeaking && caption ? <span className="sr-only"> (speaking)</span> : null}
    </div>
  );
}
