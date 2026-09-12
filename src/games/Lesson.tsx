// Lesson mode: sign 5 targets in a row. Recognition owns hold-to-confirm and
// Gemini coaching internally (see src/recognition/README.md); this screen
// just supplies the target, speaks prompts/results aloud, and scores the
// round once all five are confirmed.
import { useEffect, useMemo, useRef, useState } from "react";
import { Caption } from "../voice/Caption";
import { useVoice } from "../voice/useVoice";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { RoundResult, SignResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, LESSON_LENGTH, scoreRound } from "./gameLogic";
import { CameraPanel } from "./CameraPanel";
import { GameLayout, ProfileGate } from "./GameLayout";
import { RoundComplete } from "./RoundComplete";
import { LETTER_CATALOG, pickSigns } from "./signCatalog";

import { SignGuide } from "./SignGuide";

export function Lesson() {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const targets = useMemo(() => pickSigns(LESSON_LENGTH, LETTER_CATALOG), []);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);

  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });

  const target = targets[index] as string | undefined;

  function handleConfirm(confirmedResult: SignResult) {
    if (!target || result) return;
    voiceRef.current.speak(confirmedResult.label).catch(() => {});
    setIndex((i) => i + 1);
  }

  const recognition = useSignRecognition({ target, vocabulary: "letters", coaching: true, onConfirm: handleConfirm });

  const recognitionRef = useRef(recognition);
  useEffect(() => { recognitionRef.current = recognition; });

  useEffect(() => {
    if (!target) return;
    voiceRef.current.speak(`Sign ${target}`).catch(() => {});
  }, [target]);

  useEffect(() => {
    if (index < LESSON_LENGTH || !profile || result) return;
    recognitionRef.current.stop();
    const roundResult = scoreRound("lesson", index, LESSON_LENGTH);
    setResult(roundResult);
    void completeRound(profile, roundResult).then(setProfile);
  }, [index, profile, result]);

  if (!profile) return <ProfileGate />;

  if (result) {
    return (
      <div className="px-4 py-16">
        <RoundComplete
          result={result}
          profile={profile}
          onRetry={() => {
            recognition.reset();
            setIndex(0);
            setResult(null);
          }}
        />
      </div>
    );
  }

  return <GameLayout mode="Guided practice" title="Learn five signs." description="Learn five shapes at your own pace. Follow the guide, sign to your camera, and hold steady to move forward." progress={index / LESSON_LENGTH} progressLabel={`${index} of ${LESSON_LENGTH} complete`}>
    <div className="grid gap-5 md:grid-cols-2">
      <SignGuide target={target ?? 'I'} targets={targets} completed={index} />
      <CameraPanel recognition={recognition} target={target} />
    </div>
    <aside className="mt-5 flex gap-4 rounded-2xl border border-line bg-surface p-5" aria-label="Sign coach">
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft text-xl text-brand">✦</span>
      <div><h2 className="text-sm font-bold text-brand">Practice tip</h2><p role="status" className="mt-1 text-sm leading-relaxed text-muted">{recognition.coachingLine ?? 'Keep your wrist relaxed and your whole hand visible. There’s no timer here—take your time.'}</p><p className="mt-2 text-xs text-muted">AI coaching uses a hand-landmark summary while you practice.</p></div>
    </aside>
    <div className="mt-4"><Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} isTranscribing={voice.isTranscribing} /></div>
  </GameLayout>;
}
