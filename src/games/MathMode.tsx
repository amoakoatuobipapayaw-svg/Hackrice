// Math mode: solve single-digit arithmetic by signing the number (A's
// recognizer, numbers vocabulary) or saying it (C's ElevenLabs STT via
// MicButton). Each problem has its own clock; a timeout or a wrong spoken
// answer is a miss. Signing a wrong digit never confirms — the camera panel
// just shows what it's seeing so the player can correct.
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Caption } from "../voice/Caption";
import { MicButton } from "../voice/MicButton";
import { useVoice } from "../voice/useVoice";
import { CameraPanel } from "./CameraPanel";
import { MATH_PROBLEM_SECONDS, MATH_ROUND_LENGTH } from "./gameLogic";
import { MathProblemCard, type MathFeedback } from "./MathProblemCard";
import { generateMathProblem, parseSpokenNumber, type MathProblem } from "./mathProblems";
import { ProgressDots, type StepOutcome } from "./ProgressDots";
import { RequireProfile } from "./RequireProfile";
import { RoundComplete } from "./RoundComplete";
import { ScoreHud } from "./ScoreHud";
import { useCountdown } from "./useCountdown";
import { useGameRecognition } from "./useGameRecognition";
import { useRound } from "./useRound";

const FEEDBACK_MS = 1400;

export function MathMode() {
  const round = useRound("math");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [problem, setProblem] = useState<MathProblem>(() => generateMathProblem(0));
  const [outcomes, setOutcomes] = useState<StepOutcome[]>([]);
  const [feedback, setFeedback] = useState<MathFeedback | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const shownAt = useRef(0);

  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });

  const open = started && !feedback && !round.result;
  const target = open ? String(problem.answer) : undefined;

  const recognition = useGameRecognition({ target, vocabulary: "numbers", onConfirm: () => settle(true, "Signed it!") });
  const recognitionRef = useRef(recognition);
  useEffect(() => {
    recognitionRef.current = recognition;
  });

  const clock = useCountdown(MATH_PROBLEM_SECONDS, () => settle(false, "Time's up"));

  function settle(wasCorrect: boolean, note: string) {
    if (!open) return;
    clock.stop();
    setHint(null);
    const elapsed = performance.now() - shownAt.current;
    const nextStats = round.record(wasCorrect, wasCorrect ? elapsed : undefined);
    const outcome: StepOutcome = wasCorrect ? "correct" : "miss";
    const nextOutcomes = [...outcomes, outcome];
    setOutcomes(nextOutcomes);
    const text = wasCorrect ? `${note} ${problem.prompt} = ${problem.answer}` : `${note} — the answer was ${problem.answer}.`;
    setFeedback({ kind: outcome === "correct" ? "success" : "miss", text });
    voiceRef.current.speak(wasCorrect ? "Correct!" : `The answer was ${problem.answer}`).catch(() => {});
    setTimeout(() => {
      setFeedback(null);
      if (nextOutcomes.length >= MATH_ROUND_LENGTH) {
        recognitionRef.current.stop();
        round.finish(nextStats);
      } else {
        const nextIndex = nextOutcomes.length;
        setIndex(nextIndex);
        setProblem(generateMathProblem(nextIndex));
      }
    }, FEEDBACK_MS);
  }

  function handleVoiceAnswer(transcript: string) {
    const heard = parseSpokenNumber(transcript);
    if (heard === null) {
      // Not an answer, so the clock keeps running — just nudge them to retry.
      setHint(`Heard "${transcript || "nothing"}" — no number in that. Try again.`);
      return;
    }
    settle(heard === problem.answer, `You said ${heard}.`);
  }

  // Each newly opened problem: restart its clock, note the start time, read it aloud.
  const { start: startClock } = clock;
  useEffect(() => {
    if (!open) return;
    shownAt.current = performance.now();
    startClock();
    voiceRef.current.speak(`What is ${problem.prompt}?`).catch(() => {});
  }, [open, problem, startClock]);

  // `session` bumps on every begin() so this re-runs on "Play again" even
  // though status is already idle and the mode is already started.
  const autoStart = useRef(false);
  const [session, setSession] = useState(0);
  const { status: recognitionStatus, start: startRecognition } = recognition;
  useEffect(() => {
    if (started && autoStart.current && recognitionStatus === "idle") {
      autoStart.current = false;
      startRecognition();
    }
  }, [started, session, recognitionStatus, startRecognition]);

  function begin() {
    round.restart();
    recognition.reset();
    setIndex(0);
    setProblem(generateMathProblem(0));
    setOutcomes([]);
    setFeedback(null);
    setHint(null);
    autoStart.current = true;
    setSession((n) => n + 1);
    setStarted(true);
  }

  if (!round.profile) return <RequireProfile mode="Math mode" />;

  if (round.result) {
    return (
      <div className="px-4 py-16">
        <RoundComplete result={round.result} stats={round.stats} profile={round.profile} saving={round.saving} onRetry={begin} />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="text-3xl font-black">Math Mode</h1>
        <p className="mt-2 text-slate-400">
          {MATH_ROUND_LENGTH} problems, {MATH_PROBLEM_SECONDS} seconds each. Answer by signing the number in ASL, or tap the
          mic and say it. Fast answers score more.
        </p>
        <Button onClick={begin} className="mt-8 py-5 text-lg">
          Start
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <ProgressDots total={MATH_ROUND_LENGTH} current={index} outcomes={outcomes} />

      <MathProblemCard problem={problem} index={index} total={MATH_ROUND_LENGTH} feedback={feedback} hint={hint} />

      <ScoreHud stats={round.stats} secondsLeft={open ? clock.secondsLeft : MATH_PROBLEM_SECONDS} />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <CameraPanel recognition={recognition} target={target} flash={feedback?.kind ?? null} />
        <div className="flex flex-col items-center gap-2 sm:pt-6">
          <MicButton listen={voice.listen} isListening={voice.isListening} onResult={handleVoiceAnswer} />
          <span className="text-xs text-slate-400">Say it</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} />
        <Button variant="ghost" onClick={() => settle(false, "Skipped")} disabled={!open} className="text-sm">
          Skip
        </Button>
      </div>
    </div>
  );
}
