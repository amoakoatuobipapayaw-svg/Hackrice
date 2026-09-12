// Speed Challenge: sign as many prompts as you can before the clock runs
// out. Each rep scores (base + speed bonus) × combo multiplier — see
// scoring.ts. A skip breaks the combo. No coaching or voice here: it's about
// pace, and the camera loop is already the hot path.
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { CameraPanel } from "./CameraPanel";
import { SPEED_BONUS_MAX, SPEED_BONUS_WINDOW_MS, SPEED_CHALLENGE_SECONDS } from "./gameLogic";
import { RequireProfile } from "./RequireProfile";
import { RoundComplete } from "./RoundComplete";
import { ScoreHud } from "./ScoreHud";
import { LETTER_CATALOG, NUMBER_CATALOG, pickSigns } from "./signCatalog";
import { TargetCard } from "./TargetCard";
import { useCountdown } from "./useCountdown";
import { useGameRecognition } from "./useGameRecognition";
import { useRound } from "./useRound";

type SignSet = "letters" | "numbers";
type Phase = "setup" | "ready" | "playing";
const READY_SECONDS = 3;
const QUEUE_LENGTH = 80; // more prompts than anyone can clear in one round

export function SpeedChallenge() {
  const round = useRound("speed");
  const [signSet, setSignSet] = useState<SignSet>("letters");
  const [phase, setPhase] = useState<Phase>("setup");
  const [queue, setQueue] = useState<string[]>([]);
  const [position, setPosition] = useState(0);
  const [flash, setFlash] = useState<"success" | "miss" | null>(null);
  const promptShownAt = useRef(0);

  const playing = phase === "playing" && !round.result;
  const target = playing ? queue[position] : undefined;

  const recognition = useGameRecognition({ target, vocabulary: signSet, onConfirm: () => settle(true) });
  const recognitionRef = useRef(recognition);
  useEffect(() => {
    recognitionRef.current = recognition;
  });

  const clock = useCountdown(SPEED_CHALLENGE_SECONDS, () => {
    recognitionRef.current.stop();
    round.finish();
  });
  const ready = useCountdown(READY_SECONDS, () => {
    promptShownAt.current = performance.now();
    setPhase("playing");
    clock.start();
  });

  function settle(wasCorrect: boolean) {
    if (!playing) return;
    const elapsed = performance.now() - promptShownAt.current;
    round.record(wasCorrect, wasCorrect ? elapsed : undefined);
    setFlash(wasCorrect ? "success" : "miss");
    setTimeout(() => setFlash(null), 350);
    promptShownAt.current = performance.now();
    setPosition((p) => p + 1);
  }

  // Warm up camera + model during the 3-2-1 so the first prompt is instantly scorable.
  // `session` bumps on every begin() so this re-runs on "Play again" even
  // though status is already idle and the mode is already started.
  const autoStart = useRef(false);
  const [session, setSession] = useState(0);
  const { status: recognitionStatus, start: startRecognition } = recognition;
  useEffect(() => {
    if (phase === "ready" && autoStart.current && recognitionStatus === "idle") {
      autoStart.current = false;
      startRecognition();
    }
  }, [phase, session, recognitionStatus, startRecognition]);

  function begin(set: SignSet) {
    setSignSet(set);
    setQueue(pickSigns(QUEUE_LENGTH, set === "letters" ? LETTER_CATALOG : NUMBER_CATALOG));
    setPosition(0);
    setFlash(null);
    round.restart();
    recognition.reset();
    clock.reset();
    autoStart.current = true;
    setSession((n) => n + 1);
    setPhase("ready");
    ready.start();
  }

  if (!round.profile) return <RequireProfile mode="a challenge" />;

  if (round.result) {
    return (
      <div className="px-4 py-16">
        <RoundComplete
          result={round.result}
          stats={round.stats}
          profile={round.profile}
          saving={round.saving}
          onRetry={() => begin(signSet)}
        />
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="text-3xl font-black">Speed Challenge</h1>
        <p className="mt-2 text-slate-400">
          {SPEED_CHALLENGE_SECONDS} seconds on the clock. Every rep is worth 10, plus up to +{SPEED_BONUS_MAX} if you
          land it within {SPEED_BONUS_WINDOW_MS / 1000}s. Chain 3, 5, and 10 in a row for x1.5, x2, and x3.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button onClick={() => begin("letters")} className="py-5 text-lg">
            Letters
            <span className="block text-xs font-normal opacity-80">{LETTER_CATALOG.join(" · ")}</span>
          </Button>
          <Button variant="secondary" onClick={() => begin("numbers")} className="py-5 text-lg">
            Numbers
            <span className="block text-xs font-normal opacity-80">1 – 9</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
      {phase === "ready" ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-6 text-center" role="status" aria-live="assertive">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Get ready</p>
          <p className="text-7xl font-black tabular-nums">{ready.secondsLeft || "Go!"}</p>
        </div>
      ) : (
        <TargetCard label={queue[position]} eyebrow={`Prompt ${position + 1}`} compact celebrate={flash === "success"} />
      )}
      <ScoreHud stats={round.stats} secondsLeft={phase === "ready" ? SPEED_CHALLENGE_SECONDS : clock.secondsLeft} />
      <CameraPanel recognition={recognition} target={target} flash={flash} />
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Release your hand between reps so the next one can confirm.</span>
        <Button variant="ghost" onClick={() => settle(false)} disabled={!playing} className="text-sm">
          Skip (breaks combo)
        </Button>
      </div>
    </div>
  );
}
