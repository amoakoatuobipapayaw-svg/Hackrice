// Speed Challenge: a timed run of signs. Correct reps score points that
// scale up with an in-round combo streak; no coaching/voice here, this
// mode is about pace. Recognition owns hold-to-confirm internally.
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/ui/Icon";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { RoundResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, pointsForRep, scoreRound, SPEED_CHALLENGE_SECONDS } from "./gameLogic";
import { CameraPanel } from "./CameraPanel";
import { GameLayout, ProfileGate } from "./GameLayout";
import { RoundComplete } from "./RoundComplete";
import { LETTER_CATALOG } from "./signCatalog";

import { SignGuide } from "./SignGuide";

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
    if (!started || timeLeft <= 0 || result) return;
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
    if (!started || timeLeft <= 0 || recognition.status !== "running") return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [started, timeLeft, recognition.status]);

  useEffect(() => {
    if (!started || timeLeft > 0 || !profile || result) return;
    recognitionRef.current.stop();
    const roundResult = scoreRound("speed", matches, matches, score);
    setResult(roundResult);
    void completeRound(profile, roundResult).then(setProfile);
  }, [started, timeLeft, profile, result, matches, score]);

  if (!profile) return <ProfileGate />;

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

  return <GameLayout mode="Speed session" title="30-second practice." description="Thirty seconds of focused practice. Your timer only runs while the camera is ready. Pause whenever you need." progress={timeLeft / SPEED_CHALLENGE_SECONDS} progressLabel={`${timeLeft}s remaining`}>
    <div className="mb-5 grid grid-cols-3 gap-3">{([['Score', score, 'star'], ['Signs confirmed', matches, 'check'], ['Combo', comboStreak, 'flame']] as const).map(([label, value, icon]) => <div key={label} className="rounded-2xl border-2 border-line bg-surface p-4 text-center"><p className="flex items-center justify-center gap-1.5 text-xs font-extrabold tracking-wide text-muted uppercase"><Icon name={icon} size={14} />{label}</p><p className="mt-2 text-3xl font-black text-brand">{value}</p></div>)}</div>
    <div className="grid gap-5 md:grid-cols-2">
      <SignGuide target={target} />
      <CameraPanel recognition={recognition} target={target} startLabel={started ? 'Resume session' : 'Start 30-second session'} onStart={() => { setStarted(true); recognition.start(); }} />
    </div>
    <p className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-5 text-sm leading-relaxed text-muted"><span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon name="flame" size={18} /></span>Build a run of confirmed signs to earn more points per sign. Every confirmed sign earns 5 XP.</p>
  </GameLayout>;
}
