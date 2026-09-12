// Lesson mode: sign 5 targets in a row. Recognition owns hold-to-confirm and
// Gemini coaching internally (see src/recognition/README.md); this screen
// just supplies the target, speaks prompts/results aloud, and scores the
// round once all five are confirmed.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Caption } from "../voice/Caption";
import { useVoice } from "../voice/useVoice";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { RoundResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, LESSON_LENGTH, scoreRound } from "./gameLogic";
import { CameraPanel } from "./CameraPanel";
import { GameLayout, ProfileGate } from "./GameLayout";
import { RoundComplete } from "./RoundComplete";
import { findUnit, isUnitUnlocked, LETTER_CATALOG, pickSigns, speakableLetter } from "./signCatalog";

import { SignGuide } from "./SignGuide";

export function Lesson() {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [searchParams] = useSearchParams();
  const unit = findUnit(searchParams.get("unit"));
  const unitCatalog = unit && unit.kind !== "content" && unit.vocabulary === "letters" && isUnitUnlocked(unit) ? unit.signs : LETTER_CATALOG;
  const [started, setStarted] = useState(false);
  const targets = useMemo(() => pickSigns(LESSON_LENGTH, unitCatalog), [unitCatalog]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);

  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });

  const target = targets[index] as string | undefined;

  function handleConfirm() {
    if (!target || result) return;
    setIndex((i) => i + 1);
  }

  const recognition = useSignRecognition({
    target: started ? target : undefined,
    vocabulary: "letters",
    coaching: true,
    onConfirm: handleConfirm,
  });

  const recognitionRef = useRef(recognition);
  useEffect(() => { recognitionRef.current = recognition; });

  useEffect(() => {
    if (!started || !target) return;
    voiceRef.current.speak(`Sign ${speakableLetter(target)}`).catch(() => {});
  }, [started, target]);

  useEffect(() => {
    if (index < LESSON_LENGTH || !profile || result) return;
    recognitionRef.current.stop();
    const roundResult = scoreRound("lesson", index, LESSON_LENGTH);
    setResult(roundResult);
    void completeRound(profile, roundResult).then(setProfile);
  }, [index, profile, result]);

  if (!profile) return <ProfileGate />;

  if (!started) {
    return (
      <GameLayout
        mode="Guided practice"
        title={unit ? unit.title : "Learn five signs."}
        description="Learn five shapes at your own pace. Follow the guide, sign to your camera, and hold steady to move forward."
        progress={0}
        progressLabel="Ready when you are"
      >
        <div className="rounded-2xl border-2 border-line bg-surface p-8 text-center sm:p-14">
          <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="hand" size={32} />
          </span>
          <h2 className="mt-5 text-2xl font-bold">Take a moment to get ready.</h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
            Once you start, we'll speak each prompt aloud and turn on your camera. Find good
            lighting and make sure your whole hand will be in view.
          </p>
          <Button className="mt-7 inline-flex items-center gap-2" onClick={() => setStarted(true)}>
            Start practice
            <Icon name="arrowRight" size={18} />
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
            setIndex(0);
            setResult(null);
          }}
        />
      </div>
    );
  }

  return <GameLayout mode="Guided practice" title={unit ? unit.title : "Learn five signs."} description="Learn five shapes at your own pace. Follow the guide, sign to your camera, and hold steady to move forward." progress={index / LESSON_LENGTH} progressLabel={`${index} of ${LESSON_LENGTH} complete`}>
    <div className="grid gap-5 md:grid-cols-2">
      <SignGuide target={target ?? 'I'} targets={targets} completed={index} />
      <CameraPanel recognition={recognition} target={target} />
    </div>
    <aside className="mt-5 flex gap-4 rounded-2xl border-2 border-line bg-surface p-5" aria-label="Sign coach">
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon name="lightbulb" size={22} /></span>
      <div><h2 className="text-sm font-extrabold text-brand">Practice tip</h2><p role="status" className="mt-1 text-sm leading-relaxed text-muted">{recognition.coachingLine ?? 'Keep your wrist relaxed and your whole hand visible. There’s no timer here—take your time.'}</p><p className="mt-2 text-xs text-muted">AI coaching uses a hand-landmark summary while you practice.</p></div>
    </aside>
    <div className="mt-4"><Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} isTranscribing={voice.isTranscribing} /></div>
  </GameLayout>;
}
