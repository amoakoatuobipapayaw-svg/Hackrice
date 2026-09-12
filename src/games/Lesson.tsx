// Lesson mode: sign 5 targets in a row. Each correct rep is scored, coached
// by Gemini, and spoken aloud by ElevenLabs, then the round posts XP/streak
// to the leaderboard — this is CLAUDE.md's "one demo that has to work."
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Caption } from "../voice/Caption";
import { useVoice } from "../voice/useVoice";
import { geminiCoach } from "../recognition/geminiCoach";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { RoundResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, LESSON_LENGTH, scoreRound } from "./gameLogic";
import { RoundComplete } from "./RoundComplete";
import { pickSigns } from "./signCatalog";
import { useHoldToConfirm } from "./useHoldToConfirm";
import { useRecognitionLifecycle } from "./useRecognitionLifecycle";

const FALLBACK_COACHING = "Nice! Keep your hand steady and try the next one.";
const ADVANCE_DELAY_MS = 1200;

export function Lesson() {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const targets = useMemo(() => pickSigns(LESSON_LENGTH), []);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [coachingLine, setCoachingLine] = useState<string | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const advancedForIndexRef = useRef(-1);

  const recognition = useSignRecognition();
  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });
  const target = targets[index] as string | undefined;
  const confirmed = useHoldToConfirm(recognition.current, target ?? "");

  useRecognitionLifecycle(recognition, true);

  useEffect(() => {
    if (!target) return;
    voiceRef.current.speak(`Sign ${target}`).catch(() => {});
  }, [target]);

  useEffect(() => {
    if (!confirmed || !target || advancedForIndexRef.current === index) return;
    advancedForIndexRef.current = index;

    setCorrect((c) => c + 1);
    setComboStreak((c) => c + 1);
    voiceRef.current.speak(target).catch(() => {});
    geminiCoach(`Signed ${target} correctly during an ASL lesson.`)
      .then(setCoachingLine)
      .catch(() => setCoachingLine(FALLBACK_COACHING));

    const timer = setTimeout(() => setIndex((i) => i + 1), ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [confirmed, index, target]);

  useEffect(() => {
    if (index < LESSON_LENGTH || !profile || result) return;
    const roundResult = scoreRound("lesson", correct, LESSON_LENGTH);
    setResult(roundResult);
    void completeRound(profile, roundResult).then(setProfile);
  }, [index, profile, result, correct]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-slate-300">
          <Link to="/onboarding" className="text-violet-400 underline">
            Tell us your name
          </Link>{" "}
          before starting a lesson.
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
            setIndex(0);
            setCorrect(0);
            setComboStreak(0);
            setCoachingLine(null);
            setResult(null);
            advancedForIndexRef.current = -1;
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <p className="text-sm font-medium text-slate-400">
        Sign {index + 1} of {LESSON_LENGTH}
      </p>
      <h1 className="mt-2 text-4xl font-bold">{target}</h1>
      <p className="mt-4 text-slate-300">
        Recognized: <span className="font-mono">{recognition.current?.label ?? "—"}</span>
      </p>
      <p className="mt-1 text-sm text-slate-400">Combo: {comboStreak}</p>

      {coachingLine && (
        <p className="mt-6 text-violet-300" role="status">
          {coachingLine}
        </p>
      )}

      <div className="mt-8 flex justify-center">
        <Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} />
      </div>
    </div>
  );
}
