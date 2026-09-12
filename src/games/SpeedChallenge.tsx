// Speed Challenge: a timed run of signs. Correct reps score points that
// scale up with an in-round combo streak; no coaching/voice here, this
// mode is about pace.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { RoundResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, pointsForRep, scoreRound, SPEED_CHALLENGE_SECONDS } from "./gameLogic";
import { RoundComplete } from "./RoundComplete";
import { SIGN_CATALOG } from "./signCatalog";
import { useHoldToConfirm } from "./useHoldToConfirm";
import { useRecognitionLifecycle } from "./useRecognitionLifecycle";

export function SpeedChallenge() {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SPEED_CHALLENGE_SECONDS);
  const [counter, setCounter] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [matches, setMatches] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
  const advancedForCounterRef = useRef(-1);

  const recognition = useSignRecognition();
  const target = SIGN_CATALOG[counter % SIGN_CATALOG.length];
  const confirmed = useHoldToConfirm(recognition.current, started ? target : "");

  useRecognitionLifecycle(recognition, started);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [started, timeLeft]);

  useEffect(() => {
    if (!confirmed || !started || advancedForCounterRef.current === counter) return;
    advancedForCounterRef.current = counter;
    setMatches((m) => m + 1);
    setScore((s) => s + pointsForRep(comboStreak));
    setComboStreak((c) => c + 1);
    setCounter((c) => c + 1);
  }, [confirmed, started, counter, comboStreak]);

  useEffect(() => {
    if (!started || timeLeft > 0 || !profile || result) return;
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
            setStarted(false);
            setTimeLeft(SPEED_CHALLENGE_SECONDS);
            setCounter(0);
            setComboStreak(0);
            setMatches(0);
            setScore(0);
            setResult(null);
            advancedForCounterRef.current = -1;
          }}
        />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Card>
          <h1 className="text-2xl font-bold">Speed Challenge</h1>
          <p className="mt-2 text-slate-400">
            Sign as many prompts as you can in {SPEED_CHALLENGE_SECONDS} seconds. Combos
            of 3+ and 5+ score more per rep.
          </p>
          <Button className="mt-6" onClick={() => setStarted(true)}>
            Start
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <p className="text-sm font-medium text-slate-400">{timeLeft}s left</p>
      <h1 className="mt-2 text-4xl font-bold">{target}</h1>
      <p className="mt-4 text-slate-300">
        Recognized: <span className="font-mono">{recognition.current?.label ?? "—"}</span>
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Combo: {comboStreak} · Score: {score}
      </p>
    </div>
  );
}
