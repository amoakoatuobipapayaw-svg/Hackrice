// Speed Challenge: a timed run of signs. Correct reps score points that
// scale up with an in-round combo streak; no coaching/voice here, this
// mode is about pace. Recognition owns hold-to-confirm internally.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { RoundResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, pointsForRep, scoreRound, SPEED_CHALLENGE_SECONDS } from "./gameLogic";
import { RecognitionCamera } from "./RecognitionCamera";
import { RoundComplete } from "./RoundComplete";
import { LETTER_CATALOG } from "./signCatalog";

export function SpeedChallenge() {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SPEED_CHALLENGE_SECONDS);
  const [counter, setCounter] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [matches, setMatches] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);

  const target = LETTER_CATALOG[counter % LETTER_CATALOG.length];

  function handleConfirm() {
    setMatches((m) => m + 1);
    setScore((s) => s + pointsForRep(comboStreak));
    setComboStreak((c) => c + 1);
    setCounter((c) => c + 1);
  }

  const recognition = useSignRecognition({
    target: started ? target : undefined,
    vocabulary: "letters",
    onConfirm: handleConfirm,
  });
  const recognitionRef = useRef(recognition);
  useEffect(() => {
    recognitionRef.current = recognition;
  });

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [started, timeLeft]);

  useEffect(() => {
    if (!started || timeLeft > 0 || !profile || result) return;
    recognitionRef.current.stop();
    const roundResult = scoreRound("speed", matches, matches, score);
    setResult(roundResult);
    void completeRound(profile, roundResult).then(setProfile);
  }, [started, timeLeft, profile, result, matches, score]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-slate-300">
          <Link to="/onboarding" className="text-violet-400 underline">
            Tell us your name
          </Link>{" "}
          before starting a challenge.
        </p>
      </div>
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
            setTimeLeft(SPEED_CHALLENGE_SECONDS);
            setCounter(0);
            setComboStreak(0);
            setMatches(0);
            setScore(0);
            setResult(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      {started ? (
        <>
          <p className="text-sm font-medium text-slate-400">{timeLeft}s left</p>
          <h1 className="mt-2 text-4xl font-bold">{target}</h1>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Speed Challenge</h1>
          <p className="mt-2 text-slate-400">
            Sign as many prompts as you can in {SPEED_CHALLENGE_SECONDS} seconds. Combos of
            3+ and 5+ score more per rep.
          </p>
        </>
      )}

      <div className="mt-4">
        <RecognitionCamera videoRef={recognition.videoRef} canvasRef={recognition.canvasRef} />
      </div>

      {!started && (
        <Button
          className="mt-4"
          onClick={() => {
            setStarted(true);
            recognition.start();
          }}
        >
          Start
        </Button>
      )}
      {started && recognition.status === "loading" && <p className="mt-4 text-slate-400">Starting camera…</p>}
      {recognition.status === "error" && (
        <p className="mt-4 text-red-400" role="alert">
          {recognition.error}
        </p>
      )}

      {started && (
        <>
          <p className="mt-4 text-slate-300">
            Recognized: <span className="font-mono">{recognition.current?.label ?? "—"}</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Combo: {comboStreak} · Score: {score}
          </p>
        </>
      )}
    </div>
  );
}
