// Lesson mode: 5 signs in a row. Show the target (label + handshape), the
// player holds it to the camera, recognition confirms it, we flash success,
// speak it aloud, and advance. Gemini coaching runs inside recognition
// (coaching: true) and we surface its line. Skip is always available so a
// sign the classifier won't confirm can never dead-end the lesson.
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Caption } from "../voice/Caption";
import { useVoice } from "../voice/useVoice";
import type { SignResult } from "../lib/contracts";
import { CameraPanel } from "./CameraPanel";
import { CoachLine } from "./CoachLine";
import { LESSON_LENGTH } from "./gameLogic";
import { ProgressDots, type StepOutcome } from "./ProgressDots";
import { RequireProfile } from "./RequireProfile";
import { RoundComplete } from "./RoundComplete";
import { ScoreHud } from "./ScoreHud";
import { LETTER_CATALOG, NUMBER_CATALOG, pickSigns } from "./signCatalog";
import { TargetCard } from "./TargetCard";
import { useGameRecognition } from "./useGameRecognition";
import { useRound } from "./useRound";

type SignSet = "letters" | "numbers";
const ADVANCE_DELAY_MS = 900;

export function Lesson() {
  const round = useRound("lesson");
  const [signSet, setSignSet] = useState<SignSet>("letters");
  const [targets, setTargets] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<StepOutcome[]>([]);
  const [flash, setFlash] = useState<"success" | "miss" | null>(null);

  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });

  const started = targets !== null;
  const target = started && !flash && !round.result ? targets[index] : undefined;

  function settle(outcome: StepOutcome) {
    if (flash || !targets) return;
    setFlash(outcome === "correct" ? "success" : "miss");
    const nextStats = round.record(outcome === "correct");
    const nextOutcomes = [...outcomes, outcome];
    setOutcomes(nextOutcomes);
    setTimeout(() => {
      setFlash(null);
      if (nextOutcomes.length >= LESSON_LENGTH) {
        recognitionRef.current.stop(); // camera off while the results screen is up
        round.finish(nextStats);
      } else {
        setIndex((i) => i + 1);
      }
    }, ADVANCE_DELAY_MS);
  }

  function handleConfirm(confirmed: SignResult) {
    voiceRef.current.speak(confirmed.label).catch(() => {});
    settle("correct");
  }

  const recognition = useGameRecognition({
    target,
    vocabulary: signSet,
    coaching: true,
    onConfirm: handleConfirm,
  });
  const recognitionRef = useRef(recognition);
  useEffect(() => {
    recognitionRef.current = recognition;
  });

  // Read each new prompt aloud (and caption it) — the voice bridge is part of the a11y story.
  useEffect(() => {
    if (!target) return;
    voiceRef.current.speak(`Sign ${target}`).catch(() => {});
  }, [target]);

  // The <video> only exists once the lesson screen renders, so start the
  // camera right after begin() instead of inside it.
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

  function begin(set: SignSet) {
    setSignSet(set);
    setTargets(pickSigns(LESSON_LENGTH, set === "letters" ? LETTER_CATALOG : NUMBER_CATALOG));
    setIndex(0);
    setOutcomes([]);
    setFlash(null);
    round.restart();
    recognition.reset();
    autoStart.current = true;
    setSession((n) => n + 1);
  }

  if (!round.profile) return <RequireProfile mode="a lesson" />;

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

  if (!started) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="text-3xl font-black">Lesson</h1>
        <p className="mt-2 text-slate-400">
          Five signs, one at a time. Hold each shape steady for a second and the camera will confirm it.
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
      <ProgressDots total={LESSON_LENGTH} current={index} outcomes={outcomes} />
      <TargetCard label={targets[index]} eyebrow={`Sign ${index + 1} of ${LESSON_LENGTH}`} celebrate={flash === "success"} />
      <ScoreHud stats={round.stats} />
      <CameraPanel recognition={recognition} target={target} flash={flash} />
      <CoachLine line={recognition.coachingLine} active={recognition.status === "running"} />
      <div className="flex items-center justify-between">
        <Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} />
        <Button variant="ghost" onClick={() => settle("miss")} disabled={!!flash} className="text-sm">
          Skip this sign
        </Button>
      </div>
    </div>
  );
}
