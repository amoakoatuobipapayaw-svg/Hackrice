// TODO(B): generate a math problem, accept the answer by signing the
// number (recognition) or speaking it (voice's listen()).
import { useVoice } from "../voice/useVoice";

export function MathMode() {
  const voice = useVoice();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Math Mode</h1>
      <p className="mt-2 text-slate-400">
        🚧 Build me — Workstream B. Voice ready: {voice.isSpeaking ? "speaking…" : "idle"}
      </p>
    </div>
  );
}
