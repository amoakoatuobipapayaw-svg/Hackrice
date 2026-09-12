// Math mode: solve arithmetic by signing the number or speaking it. Reuses
// voice/MicButton.tsx + voice/Caption.tsx for the speech path and
// recognition/useSignRecognition() (numbers vocabulary) for the sign path;
// recognition owns hold-to-confirm internally.
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Caption } from "../voice/Caption";
import { MicButton } from "../voice/MicButton";
import { useVoice } from "../voice/useVoice";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { RoundResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, MATH_ROUND_LENGTH, scoreRound } from "./gameLogic";
import { generateMathProblem, parseSpokenNumber } from "./mathProblems";
import { CameraPanel } from "./CameraPanel";
import { GameLayout, ProfileGate } from "./GameLayout";
import { RoundComplete } from "./RoundComplete";

export function MathMode() {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [started, setStarted] = useState(false);
  const [problemIndex, setProblemIndex] = useState(0);
  const [problem, setProblem] = useState(generateMathProblem);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const advancedForIndexRef = useRef(-1);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });

  useEffect(() => {
    if (!started || result) return;
    voiceRef.current.speak(`What is ${problem.prompt}?`).catch(() => {});
  }, [started, problem, result]);

  const advance = useCallback(
    (wasCorrect: boolean) => {
      if (advancedForIndexRef.current === problemIndex) return;
      advancedForIndexRef.current = problemIndex;
      if (wasCorrect) setCorrect((c) => c + 1);
      setFeedback(wasCorrect ? "Correct!" : `The answer was ${problem.answer}.`);
      advanceTimer.current = setTimeout(() => {
        setFeedback(null);
        setProblemIndex((i) => i + 1);
        setProblem(generateMathProblem());
      }, 1200);
    },
    [problemIndex, problem],
  );

  const recognition = useSignRecognition({
    target: started && !result ? String(problem.answer) : undefined,
    vocabulary: "numbers",
    onConfirm: () => advance(true),
  });
  const recognitionRef = useRef(recognition);
  useEffect(() => {
    recognitionRef.current = recognition;
  });

  useEffect(() => {
    if (problemIndex < MATH_ROUND_LENGTH || !profile || result) return;
    recognitionRef.current.stop();
    const roundResult = scoreRound("math", correct, MATH_ROUND_LENGTH);
    setResult(roundResult);
    void completeRound(profile, roundResult).then(setProfile);
  }, [problemIndex, profile, result, correct]);

  function handleVoiceAnswer(transcript: string) {
    advance(parseSpokenNumber(transcript) === problem.answer);
  }

  if (!profile) return <ProfileGate />;

  if (!started) {
    return (
      <GameLayout
        mode="Math lab"
        title="Solve and sign."
        description="Solve a little puzzle, then answer with your hand or your voice. Every answer is a number from 1 to 9."
        progress={0}
        progressLabel="Ready when you are"
      >
        <div className="rounded-2xl border border-line bg-surface p-8 text-center sm:p-14">
          <span aria-hidden="true" className="text-5xl">➕</span>
          <h2 className="mt-5 text-2xl font-bold">Take a moment to get ready.</h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
            Once you start, we'll read each puzzle aloud and turn on your camera. Have your hand
            or your voice ready to answer.
          </p>
          <Button className="mt-7" onClick={() => setStarted(true)}>
            Start puzzles
          </Button>
        </div>
      </GameLayout>
    );
  }

  if (result) {
    return (
      <div className="px-4 py-16">
        <RoundComplete
          result={result}
          profile={profile}
          onRetry={() => {
            recognition.reset();
            setStarted(false);
            setProblemIndex(0);
            setProblem(generateMathProblem());
            setCorrect(0);
            setFeedback(null);
            setResult(null);
            advancedForIndexRef.current = -1;
          }}
        />
      </div>
    );
  }

  return <GameLayout mode="Math lab" title="Solve and sign." description="Solve a little puzzle, then answer with your hand or your voice. Every answer is a number from 1 to 9." progress={problemIndex / MATH_ROUND_LENGTH} progressLabel={`${Math.min(problemIndex + 1, MATH_ROUND_LENGTH)} / ${MATH_ROUND_LENGTH} puzzles`}>
    <div className="grid gap-5 md:grid-cols-2">
      <section className="flex flex-col rounded-2xl border-2 border-line bg-surface p-6 sm:p-8">
        <div className="flex justify-between text-xs font-extrabold tracking-widest uppercase"><span className="text-brand">Your puzzle</span><span className="text-muted">{correct} solved</span></div>
        <div className="my-8 rounded-2xl bg-soft px-4 py-10 text-center"><h2 className="text-5xl font-black tracking-tight sm:text-6xl">{problem.prompt}</h2><p className="mt-5 text-2xl font-bold text-ink">= <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-line">?</span></p></div>
        <h3 className="text-xl font-bold">Two ways to say it</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">Use one hand to sign your answer, then hold for a second. Prefer to speak? Tap the microphone below.</p>
        <div className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-line bg-canvas p-4"><MicButton listen={voice.listen} isListening={voice.isListening} isTranscribing={voice.isTranscribing} onResult={handleVoiceAnswer} /><div><p className="text-sm font-extrabold">Answer by voice</p><p className="mt-1 text-xs text-muted">Say a number from one to nine</p></div></div>
        <div className="mt-4"><Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} isTranscribing={voice.isTranscribing} /></div>
        <p className="mt-auto pt-6 text-xs leading-relaxed text-muted">For 6–9, touch your thumb to your little, ring, middle, or index finger respectively.</p>
      </section>
      <CameraPanel recognition={recognition} target={String(problem.answer)} feedback={feedback} />
    </div>
  </GameLayout>;
}
