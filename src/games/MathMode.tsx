// /math is the Math Lab. With no ?game= param it shows the hub (nine game
// panels); with ?game=<id> it plays that game. A query param rather than a
// nested route keeps every change inside src/games/ — App.tsx is untouched.
import { useSearchParams } from "react-router-dom";
import { findGame } from "./math/games";
import { MathGame } from "./math/MathGame";
import { MathHub } from "./math/MathHub";

export function MathMode() {
  const [searchParams] = useSearchParams();
  const game = findGame(searchParams.get("game"));
  // Keyed so switching games remounts the engine with fresh state.
  return game ? <MathGame key={game.id} game={game} /> : <MathHub />;
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [started, setStarted] = useState(false);
  const [problemIndex, setProblemIndex] = useState(0);
  const [problem, setProblem] = useState(generateMathProblem);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const advancedForIndexRef = useRef(-1);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const voice = useVoice();
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });

  useEffect(() => {
    if (!started || result) return;
    voiceRef.current.speak(`What is ${problem.prompt}?`).catch(() => {});
  }, [started, problem, result]);

  const advance = useCallback(
    (wasCorrect: boolean) => {
      if (advancedForIndexRef.current === problemIndex) return;
      advancedForIndexRef.current = problemIndex;
      if (wasCorrect) setCorrect((c) => c + 1);
      setFeedback(wasCorrect ? "Correct!" : `The answer was ${problem.answer}.`);
      advanceTimer.current = setTimeout(() => {
        setFeedback(null);
        setProblemIndex((i) => i + 1);
        setProblem(generateMathProblem());
      }, 1200);
    },
    [problemIndex, problem],
  );

  const recognition = useSignRecognition({
    target: started && !result ? String(problem.answer) : undefined,
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
    const spoken = parseSpokenNumber(transcript);
    if (spoken === null) {
      // Nothing number-shaped in the transcript — likely background noise
      // or an unrelated word. Don't burn the attempt; just ask them to
      // try again.
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      setFeedback("Didn't catch a number — try again.");
      advanceTimer.current = setTimeout(() => setFeedback(null), 1500);
      return;
    }
    advance(spoken === problem.answer);
  }

  if (!profile) return <ProfileGate />;

  if (!started) {
    return (
      <GameLayout
        mode="Math lab"
        title="Solve and sign."
        description="Solve a little puzzle, then answer with your hand or your voice. Every answer is a number from 1 to 9."
        progress={0}
        progressLabel="Ready when you are"
      >
        <div className="rounded-2xl border-2 border-line bg-surface p-8 text-center sm:p-14">
          <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="plus" size={32} />
          </span>
          <h2 className="mt-5 text-2xl font-bold">Take a moment to get ready.</h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
            Once you start, we'll read each puzzle aloud and turn on your camera. Have your hand
            or your voice ready to answer.
          </p>
          <Button className="mt-7 inline-flex items-center gap-2" onClick={() => setStarted(true)}>
            Start puzzles
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

  return <GameLayout mode="Math lab" title="Solve and sign." description="Solve a little puzzle, then answer with your hand or your voice. Every answer is a number from 1 to 9." progress={problemIndex / MATH_ROUND_LENGTH} progressLabel={`${Math.min(problemIndex + 1, MATH_ROUND_LENGTH)} / ${MATH_ROUND_LENGTH} puzzles`}>
    <div className="grid gap-5 md:grid-cols-2">
      <section className="flex flex-col rounded-2xl border-2 border-line bg-surface p-6 sm:p-8">
        <div className="flex justify-between text-xs font-extrabold tracking-widest uppercase"><span className="text-brand">Your puzzle</span><span className="text-muted">{correct} solved</span></div>
        <div className="my-8 rounded-2xl bg-soft px-4 py-10 text-center"><h2 className="text-5xl font-black tracking-tight sm:text-6xl">{problem.prompt}</h2><p className="mt-5 text-2xl font-bold text-ink">= <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-line">?</span></p></div>
        <h3 className="text-xl font-bold">Two ways to say it</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">Use one hand to sign your answer, then hold for a second. Prefer to speak? Press and hold the microphone below.</p>
        <div className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-line bg-canvas p-4"><MicButton isListening={voice.isListening} isTranscribing={voice.isTranscribing} startListening={voice.startListening} stopListening={voice.stopListening} onResult={handleVoiceAnswer} /><div><p className="text-sm font-extrabold">Answer by voice</p><p className="mt-1 text-xs text-muted">Press and hold, say a number, then release</p></div></div>
        <div className="mt-4"><Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} isTranscribing={voice.isTranscribing} /></div>
        <p className="mt-auto pt-6 text-xs leading-relaxed text-muted">For 6–9, touch your thumb to your little, ring, middle, or index finger respectively.</p>
      </section>
      <CameraPanel recognition={recognition} target={String(problem.answer)} feedback={feedback} />
    </div>
  </GameLayout>;
}
