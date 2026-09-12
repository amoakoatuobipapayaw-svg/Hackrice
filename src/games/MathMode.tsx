// Math mode: solve arithmetic by signing the number or speaking it. Reuses
// voice/MicButton.tsx + voice/Caption.tsx for the speech path and
// recognition/useSignRecognition() (numbers vocabulary) for the sign path;
// recognition owns hold-to-confirm internally.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Caption } from "../voice/Caption";
import { MicButton } from "../voice/MicButton";
import { useVoice } from "../voice/useVoice";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { RoundResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { completeRound, MATH_ROUND_LENGTH, scoreRound } from "./gameLogic";
import { generateMathProblem, parseSpokenNumber } from "./mathProblems";
import { RecognitionCamera } from "./RecognitionCamera";
import { RoundComplete } from "./RoundComplete";

export function MathMode() {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [problemIndex, setProblemIndex] = useState(0);
  const [problem, setProblem] = useState(generateMathProblem);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const advancedForIndexRef = useRef(-1);

  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });

  useEffect(() => {
    if (result) return;
    voiceRef.current.speak(`What is ${problem.prompt}?`).catch(() => {});
  }, [problem, result]);

  const advance = useCallback(
    (wasCorrect: boolean) => {
      if (advancedForIndexRef.current === problemIndex) return;
      advancedForIndexRef.current = problemIndex;
      if (wasCorrect) setCorrect((c) => c + 1);
      setFeedback(wasCorrect ? "Correct!" : `The answer was ${problem.answer}.`);
      setTimeout(() => {
        setFeedback(null);
        setProblemIndex((i) => i + 1);
        setProblem(generateMathProblem());
      }, 1200);
    },
    [problemIndex, problem],
  );

  const recognition = useSignRecognition({
    target: result ? undefined : String(problem.answer),
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

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-slate-300">
          <Link to="/onboarding" className="text-violet-400 underline">
            Tell us your name
          </Link>{" "}
          before starting Math mode.
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

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <p className="text-sm font-medium text-slate-400">
        Problem {problemIndex + 1} of {MATH_ROUND_LENGTH}
      </p>
      <h1 className="mt-2 text-4xl font-bold">{problem.prompt} = ?</h1>

      <div className="mt-4">
        <RecognitionCamera videoRef={recognition.videoRef} canvasRef={recognition.canvasRef} />
      </div>

      {recognition.status === "idle" && (
        <Button className="mt-4" onClick={recognition.start}>
          Start camera
        </Button>
      )}
      {recognition.status === "error" && (
        <p className="mt-4 text-red-400" role="alert">
          {recognition.error}
        </p>
      )}

      <p className="mt-4 text-slate-300">
        Sign the number, or tap the mic and say it. Recognized:{" "}
        <span className="font-mono">{recognition.current?.label ?? "—"}</span>
      </p>

      {feedback && (
        <p className="mt-4 text-violet-300" role="status">
          {feedback}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-4">
        <MicButton listen={voice.listen} isListening={voice.isListening} onResult={handleVoiceAnswer} />
        <Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} />
      </div>
    </div>
  );
}
