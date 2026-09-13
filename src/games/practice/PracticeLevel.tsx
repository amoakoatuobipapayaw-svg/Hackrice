// One Practice level. Same screen the guided lesson always had — sign guide
// on the left, camera on the right, coach underneath — with the level's own
// pool of shapes behind it.
//
// Two things differ from the single-pool original, both because a level can
// now ask for signs beyond the demo five:
//  - vocabulary and the confirm floor are chosen PER TARGET, so a digit and
//    a letter can sit in the same round and a letter the classifier trusts
//    less can still confirm (see signCatalog's confirmFloor).
//  - a shape that won't confirm offers a skip after SKIP_AFTER_MS of trying,
//    so one stubborn hand shape can't dead-end the level.
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { Caption } from "../../voice/Caption";
import { useVoice } from "../../voice/useVoice";
import { useGameRecognition } from "../useGameRecognition";
import type { RoundResult, UserProfile } from "../../lib/contracts";
import { getLocalProfile } from "../../lib/localProfile";
import { completeRound, scoreRound } from "../gameLogic";
import { CameraPanel } from "../CameraPanel";
import { GameLayout, ProfileGate } from "../GameLayout";
import { SignGuide } from "../SignGuide";
import { confirmFloor, speakableLetter, vocabularyFor } from "../signCatalog";
import { LevelCelebration } from "./LevelCelebration";
import { LevelResults } from "./LevelResults";
import { levelTargets, nextLevel, type PracticeLevel as Level } from "./levels";
import { markLevelComplete } from "./practiceProgress";

/** How long a learner may struggle with one shape before a skip is offered. */
const SKIP_AFTER_MS = 10000;

export function PracticeLevel({ level }: { level: Level }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [targets, setTargets] = useState<string[]>(() => levelTargets(level));
  const [index, setIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => { voiceRef.current = voice; });

  const target = targets[index] as string | undefined;
  const next = nextLevel(level);

  function advance() {
    setIndex((i) => i + 1);
    setCanSkip(false);
  }

  function handleConfirm() {
    if (!target || result) return;
    setConfirmed((c) => c + 1);
    advance();
  }

  const recognition = useGameRecognition({
    target: result ? undefined : target,
    vocabulary: target ? vocabularyFor(target) : "letters",
    minConfidence: target ? confirmFloor(target) : undefined,
    coaching: true,
    onConfirm: handleConfirm,
  });

  const recognitionRef = useRef(recognition);
  useEffect(() => { recognitionRef.current = recognition; });

  useEffect(() => {
    if (!target || result) return;
    voiceRef.current.speak(`Sign ${speakableLetter(target)}`).catch(() => {});
  }, [target, result]);

  // The skip offer is measured in camera time, not wall-clock time: a paused
  // camera shouldn't earn a skip the learner never actually tried for. It is
  // cleared by whatever moved the round on (advance/retry), not here.
  useEffect(() => {
    if (!target || result || recognition.status !== "running") return;
    const id = setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);
    return () => clearTimeout(id);
  }, [target, result, recognition.status]);

  useEffect(() => {
    if (index < level.length || !profile || result) return;
    recognitionRef.current.stop();
    const roundResult = scoreRound("lesson", confirmed, level.length);
    setResult(roundResult);
    setCelebrating(true);
    markLevelComplete(level.number);
    void completeRound(profile, roundResult).then(setProfile);
  }, [index, profile, result, confirmed, level]);

  if (!profile) return <ProfileGate />;

  if (result) {
    return (
      <>
        <div className="px-4 py-16">
          <LevelResults
            level={level}
            next={next}
            result={result}
            profile={profile}
            skipped={skipped}
            onRetry={() => {
              recognition.reset();
              setTargets(levelTargets(level));
              setIndex(0);
              setConfirmed(0);
              setSkipped(0);
              setCanSkip(false);
              setResult(null);
              setCelebrating(false);
            }}
          />
        </div>
        {celebrating && (
          <LevelCelebration
            level={level.number}
            title={level.title}
            confirmed={result.correct}
            total={result.total}
            unlockedNext={next ? `Level ${next.number}: ${next.title}` : undefined}
            onDismiss={() => setCelebrating(false)}
          />
        )}
      </>
    );
  }

  return (
    <GameLayout
      mode={`Guided practice · Level ${level.number} of 5`}
      title={level.title}
      description={level.description}
      progress={index / level.length}
      progressLabel={`${index} of ${level.length} complete`}
      backTo="/lesson"
      backLabel="Back to your level map"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <SignGuide target={target ?? level.pool[0]} targets={targets} completed={index} />
        <CameraPanel recognition={recognition} target={target} />
      </div>

      <aside className="mt-5 flex gap-4 rounded-2xl border-2 border-line bg-surface p-5" aria-label="Sign coach">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon name="lightbulb" size={22} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-brand">Practice tip</h2>
          <p role="status" className="mt-1 text-sm leading-relaxed text-muted">
            {recognition.coachingLine ?? "Keep your wrist relaxed and your whole hand visible. There’s no timer here—take your time."}
          </p>
          <p className="mt-2 text-xs text-muted">AI coaching uses a hand-landmark summary while you practice.</p>
          {canSkip && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-line pt-4">
              <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted">
                Still on {target}? Some shapes are harder for the camera than others. Move on and come back to it.
              </p>
              <button
                type="button"
                onClick={() => { setSkipped((s) => s + 1); advance(); }}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-line bg-surface px-4 py-2 text-sm font-extrabold text-brand hover:bg-soft active:translate-y-0.5 active:border-b-2"
              >
                Skip this shape
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="mt-4">
        <Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} isTranscribing={voice.isTranscribing} />
      </div>
    </GameLayout>
  );
}
