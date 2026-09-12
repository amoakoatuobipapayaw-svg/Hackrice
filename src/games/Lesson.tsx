// Lesson mode: sign 5 targets in a row. Recognition owns hold-to-confirm and
// Gemini coaching internally (see src/recognition/README.md); this screen
// just supplies the target, speaks prompts/results aloud, and scores the
// round once all five are confirmed.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Caption } from "../voice/Caption";
import { useVoice } from "../voice/useVoice";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { RoundResult, SignResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, LESSON_LENGTH, scoreRound } from "./gameLogic";
import { RecognitionCamera } from "./RecognitionCamera";
import { RoundComplete } from "./RoundComplete";
import { LETTER_CATALOG, pickSigns } from "./signCatalog";

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
    voiceRef.current.speak(confirmedResult.label).catch(() => {});
    setIndex((i) => i + 1);
  }

  const recognition = useSignRecognition({ target, vocabulary: "letters", coaching: true, onConfirm: handleConfirm });

  useEffect(() => {
    if (!target) return;
    voiceRef.current.speak(`Sign ${target}`).catch(() => {});
  }, [target]);

  useEffect(() => {
    if (index < LESSON_LENGTH || !profile || result) return;
    const roundResult = scoreRound("lesson", index, LESSON_LENGTH);
    setResult(roundResult);
    void completeRound(profile, roundResult).then(setProfile);
  }, [index, profile, result]);

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
            recognition.reset();
            setIndex(0);
            setResult(null);
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

      <div className="mt-4">
        <RecognitionCamera videoRef={recognition.videoRef} canvasRef={recognition.canvasRef} />
      </div>

      {recognition.status === "idle" && (
        <Button className="mt-4" onClick={recognition.start}>
          Start camera
        </Button>
      )}
      {recognition.status === "loading" && <p className="mt-4 text-slate-400">Starting camera…</p>}
      {recognition.status === "error" && (
        <p className="mt-4 text-red-400" role="alert">
          {recognition.error}
        </p>
      )}

      <p className="mt-4 text-slate-300">
        Recognized: <span className="font-mono">{recognition.current?.label ?? "—"}</span>
      </p>
      <label className="mx-auto mt-2 block max-w-xs text-sm text-slate-400">
        Hold to confirm
        <progress className="mt-1 w-full" value={recognition.holdProgress} max={1} />
      </label>

      {recognition.coachingLine && (
        <p className="mt-6 text-violet-300" role="status">
          {recognition.coachingLine}
        </p>
      )}

      <div className="mt-8 flex justify-center">
        <Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} />
      </div>
    </div>
  );
}
