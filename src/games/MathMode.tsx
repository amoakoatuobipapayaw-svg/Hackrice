// TODO(B): generate a math problem, accept the answer by signing the
// number (recognition) or speaking it (voice's listen(), wired below).
import { useVoice } from "../voice/useVoice";
import { Caption } from "../voice/Caption";
import { MicButton } from "../voice/MicButton";

export function MathMode() {
  const voice = useVoice();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Math Mode</h1>
      <p className="mt-2 text-slate-400">
        🚧 Build me — Workstream B. Voice answer path is wired: tap the mic,
        speak a number, see it transcribed below.
      </p>

      <div className="mt-8 flex flex-col items-center gap-4">
        <MicButton
          listen={voice.listen}
          isListening={voice.isListening}
          onResult={(transcript) => console.log("[MathMode TODO] check answer:", transcript)}
        />
        <Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} />
      </div>
    </div>
  );
}
