// The two ways to answer, side by side under the problem: the microphone
// (C's ElevenLabs speech-to-text) and an always-available "show me" escape
// hatch so no puzzle can trap a learner. Signing happens in the camera
// panel; this is its counterpart.
import { Icon } from "../../components/ui/Icon";
import { Caption } from "../../voice/Caption";
import { MicButton } from "../../voice/MicButton";
import type { useVoice } from "../../voice/useVoice";

type AnswerInputsProps = {
  voice: ReturnType<typeof useVoice>;
  onTranscript: (t: string) => void;
  onReveal: () => void;
  /** Hidden once the attempt is settled. */
  answering: boolean;
  multiDigit: boolean;
};

export function AnswerInputs({ voice, onTranscript, onReveal, answering, multiDigit }: AnswerInputsProps) {
  const captioning = Boolean(voice.caption) || voice.isListening || voice.isTranscribing;
  return (
    <div className="mt-7 space-y-3">
      <div className="flex items-center gap-4 rounded-2xl border-2 border-line bg-canvas p-4">
        <MicButton listen={voice.listen} isListening={voice.isListening} isTranscribing={voice.isTranscribing} onResult={onTranscript} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">Prefer to say it?</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Tap the mic and speak the whole number{multiDigit ? ' — say "twelve", not "one, two"' : ""}.
          </p>
        </div>
      </div>

      {captioning && (
        <div className="rounded-xl bg-soft px-3 py-2">
          <p className="mb-1 text-[11px] font-extrabold tracking-widest text-muted uppercase">Captions</p>
          <Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} isTranscribing={voice.isTranscribing} />
        </div>
      )}

      {answering && (
        <button
          type="button"
          onClick={onReveal}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-muted hover:bg-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Icon name="lightbulb" size={14} />
          Stuck? Show me the answer
        </button>
      )}
    </div>
  );
}
