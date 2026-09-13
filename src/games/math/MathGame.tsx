// One screen plays every Math Lab game. Reads the game definition, drives
// the round state machine (useMathRound), and wires the two answer paths:
// the camera (A's recognizer, numbers vocabulary, digit by digit) and the
// microphone (C's voice hook). Gemini coaching is on for the whole round.
import { useEffect, useRef } from "react";
import { useVoice } from "../../voice/useVoice";
import { CameraPanel } from "../CameraPanel";
import { ProfileGate } from "../GameLayout";
import { parseSpokenNumber } from "../mathProblems";
import { useGameRecognition } from "../useGameRecognition";
import { AnswerInputs } from "./AnswerInputs";
import { AnswerSlots } from "./AnswerSlots";
import { CoachCard } from "./CoachCard";
import { GameHeader } from "./GameHeader";
import { MathIntro } from "./MathIntro";
import { MathResults } from "./MathResults";
import { NumberSigns } from "./NumberSigns";
import { ProblemView } from "./ProblemView";
import { useMathRound } from "./useMathRound";
import type { MathGameDef } from "./types";

export function MathGame({ game }: { game: MathGameDef }) {
  const round = useMathRound(game);
  const { problem, attempt, expectedDigit, phase } = round;

  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });

  const target = phase === "playing" && expectedDigit !== undefined ? String(expectedDigit) : undefined;
  const recognition = useGameRecognition({
    target,
    vocabulary: "numbers",
    coaching: true,
    onConfirm: (r) => round.acceptDigit(Number(r.label)),
  });

  // Read each new problem aloud; announce the outcome of each attempt.
  useEffect(() => {
    if (phase !== "playing" || !problem) return;
    voiceRef.current.speak(problem.spoken).catch(() => {});
  }, [phase, problem]);
  useEffect(() => {
    if (!attempt || !problem) return;
    voiceRef.current.speak(attempt.outcome === "correct" ? "Correct!" : `The answer was ${problem.answer}.`).catch(() => {});
  }, [attempt, problem]);

  // The <video> mounts with the playing screen, so start the camera right
  // after begin() rather than inside it. `session` re-arms this on replay.
  const autoStart = useRef(false);
  const { status: recognitionStatus, start: startRecognition, stop: stopRecognition } = recognition;
  useEffect(() => {
    if (phase === "playing" && autoStart.current && recognitionStatus === "idle") {
      autoStart.current = false;
      startRecognition();
    }
  }, [phase, round.session, recognitionStatus, startRecognition]);
  useEffect(() => {
    if (phase === "done") stopRecognition();
  }, [phase, stopRecognition]);

  function begin() {
    recognition.reset();
    autoStart.current = true;
    round.begin();
  }

  function handleVoice(transcript: string) {
    const heard = parseSpokenNumber(transcript);
    if (heard === null) {
      // Nothing number-shaped in the transcript — don't burn the attempt.
      voiceRef.current.speak("I didn't catch a number. Try again.").catch(() => {});
      return;
    }
    round.acceptSpoken(heard);
  }

  if (!round.profile) return <ProfileGate />;
  if (phase === "intro") return <MathIntro game={game} onStart={begin} />;

  if (phase === "done" && round.result) {
    return (
      <div className="px-4 py-16">
        <MathResults game={game} result={round.result} stats={round.stats} profile={round.profile} isPersonalBest={round.isPersonalBest} saving={round.saving} onRetry={begin} />
      </div>
    );
  }
  if (!problem) return null;

  const cameraFeedback = attempt
    ? attempt.outcome === "correct"
      ? "Confirmed! Press Continue for the next one."
      : `The answer was ${problem.answer}. Press Continue when you're ready.`
    : round.digits.length > 1
      ? `Sign digit ${round.entered.length + 1} of ${round.digits.length}. Release your hand between digits.`
      : null;

  // One grid, explicit cells on large screens. On phones the DOM order wins,
  // which puts the camera directly under the problem — you need both in view
  // while you sign, and the coaching can sit below the fold.
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <GameHeader game={game} outcomes={round.outcomes} current={round.index} stats={round.stats} />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <section className="rounded-2xl border-2 border-line bg-surface p-6 sm:p-8 lg:col-start-1 lg:row-start-1" aria-label="Problem">
          <div className="flex items-center justify-between text-xs font-extrabold tracking-widest uppercase">
            <span className="text-brand">
              Problem {round.index + 1} of {game.length}
            </span>
            <span className="text-muted">{round.stats.correct} solved</span>
          </div>

          <div className="my-7 rounded-2xl bg-soft px-4 py-8 sm:px-6">
            <ProblemView display={problem.display} />
          </div>

          <AnswerSlots digitCount={round.digits.length} entered={round.entered} state={attempt ? (attempt.outcome === "correct" ? "success" : "miss") : "open"} tone={attempt?.via === "reveal" ? "taught" : "wrong"} reveal={round.digits} />

          <AnswerInputs voice={voice} onTranscript={handleVoice} onReveal={round.reveal} answering={!attempt} multiDigit={round.digits.length > 1} />
        </section>

        <div className="lg:col-start-2 lg:row-start-1">
          <CameraPanel recognition={recognition} target={target} feedback={cameraFeedback} />
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <CoachCard
            attempt={attempt}
            explanation={problem.explanation}
            hint={problem.hint}
            coachingLine={recognition.coachingLine}
            cameraRunning={recognition.status === "running"}
            onContinue={round.next}
            isLast={round.isLast}
          />
        </div>

        <div className="lg:col-start-2 lg:row-start-2">
          <NumberSigns />
        </div>
      </div>

      <p className="mt-7 text-center text-xs leading-relaxed text-muted">No timers on your learning. Practice at your own pace.</p>
    </div>
  );
}
