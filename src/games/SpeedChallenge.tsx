// Speed Challenge: a timed run of signs at one of three clocks — Easy (60s),
// Medium (30s) or Hard (15s), chosen from the panel at the top of the page
// and carried in the URL as ?mode=. Correct reps score points that scale up
// with an in-round combo streak and again with the mode's multiplier, so a
// shorter clock is still worth playing. No coaching/voice here; this mode is
// about pace. Recognition owns hold-to-confirm internally.
//
// Prompts come from a deck of all 36 signs (A-Z and 0-9) rather than a
// counter over the demo letters, so nothing repeats until every sign has
// been asked for — see speed/deck.ts.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../components/ui/Icon";
import { useGameRecognition } from "./useGameRecognition";
import type { RoundResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, pointsForRep, scoreRound } from "./gameLogic";
import { CameraPanel } from "./CameraPanel";
import { GameLayout, ProfileGate } from "./GameLayout";
import { RoundComplete } from "./RoundComplete";
import { confirmFloor, vocabularyFor } from "./signCatalog";
import { SignGuide } from "./SignGuide";
import { createDeck, signsLeft, SPEED_POOL } from "./speed/deck";
import { findSpeedMode, speedPoints, type SpeedMode } from "./speed/modes";
import { SpeedModePanel } from "./speed/SpeedModePanel";
import { recordSpeedBest } from "./speed/speedBests";

export function SpeedChallenge() {
  const [searchParams] = useSearchParams();
  const mode = findSpeedMode(searchParams.get("mode"));
  // Keyed so switching clocks starts a genuinely fresh round.
  return <SpeedRound key={mode.id} mode={mode} />;
}

function SpeedRound({ mode }: { mode: SpeedMode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mode.seconds);
  const [deck, setDeck] = useState<string[]>(() => createDeck());
  const [cursor, setCursor] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [matches, setMatches] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [celebrate, setCelebrate] = useState(0);

  const target = deck[cursor];
  const remaining = signsLeft(deck, cursor);

  /** Next card. Reshuffles only once the deck is spent, never repeating across the seam. */
  function drawNext() {
    if (cursor + 1 < deck.length) {
      setCursor(cursor + 1);
    } else {
      setDeck(createDeck(deck[deck.length - 1]));
      setCursor(0);
    }
  }

  function handleConfirm() {
    if (!started || timeLeft <= 0 || result) return;
    setMatches((m) => m + 1);
    setScore((s) => s + speedPoints(pointsForRep(comboStreak), mode));
    setComboStreak((c) => c + 1);
    setCelebrate((c) => c + 1);
    drawNext();
  }

  const recognition = useGameRecognition({
    target: started ? target : undefined,
    vocabulary: vocabularyFor(target),
    minConfidence: confirmFloor(target),
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
    recordSpeedBest(mode.id, score, matches);
    void completeRound(profile, roundResult).then(setProfile);
  }, [started, timeLeft, profile, result, matches, score, mode.id]);

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
            setTimeLeft(mode.seconds);
            setDeck(createDeck(target));
            setCursor(0);
            setComboStreak(0);
            setMatches(0);
            setScore(0);
            setResult(null);
          }}
        />
      </div>
    );
  }

  const running = started && timeLeft > 0;

  return (
    <GameLayout
      mode={`Speed session · ${mode.label}`}
      title={`${mode.seconds}-second practice.`}
      description={mode.description}
      progress={timeLeft / mode.seconds}
      progressLabel={`${timeLeft}s remaining`}
      progressClass={mode.theme.bar}
      headerAside={<SpeedModePanel active={mode} />}
      footnote="Your clock pauses with your camera. Stop any time — your XP is already counted."
    >
      <div className="mt-5 mb-3 grid grid-cols-3 gap-3">
        {([["Score", score, "star"], ["Signs confirmed", matches, "check"], ["Combo", comboStreak, "flame"]] as const).map(([label, value, icon]) => (
          <div key={label} className={`rounded-2xl border-2 bg-surface p-4 text-center ${mode.theme.border}`}>
            <p className="flex items-center justify-center gap-1.5 text-xs font-extrabold tracking-wide text-muted uppercase">
              <Icon name={icon} size={14} />
              {label}
            </p>
            <p className={`mt-2 text-3xl font-black ${mode.theme.value}`}>{value}</p>
          </div>
        ))}
      </div>

      <p className={`mb-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl px-4 py-2.5 text-center text-xs font-bold ${mode.theme.soft}`}>
        <span>Every letter and number appears once before any of them come back.</span>
        <span className="text-muted">{remaining} of {SPEED_POOL.length} left in this deck</span>
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <SignGuide target={target} />
        <CameraPanel
          recognition={recognition}
          target={target}
          startLabel={started ? "Resume session" : `Start ${mode.seconds}-second session`}
          onStart={() => {
            setStarted(true);
            recognition.start();
          }}
          celebrate={celebrate}
        />
      </div>

      <p className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-5 text-sm leading-relaxed text-muted">
        <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${mode.theme.pill}`}>
          <Icon name="flame" size={18} />
        </span>
        Build a run of confirmed signs to earn more points per sign
        {mode.multiplier > 1 ? `, then multiply the lot by ×${mode.multiplier} on ${mode.label}` : ""}.
        Every confirmed sign earns 5 XP{running ? "" : " once the clock starts"}.
      </p>
    </GameLayout>
  );
}
