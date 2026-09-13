// State machine for one Math Lab round: problems, the digits signed so far,
// the current attempt's outcome, round stats, and the finished result.
// Stats live in a ref as well as state so an event handler can record an
// attempt and immediately know whether the round is over.
import { useCallback, useMemo, useRef, useState } from "react";
import type { RoundResult, UserProfile } from "../../lib/contracts";
import { getLocalProfile } from "../../lib/localProfile";
import { completeRound } from "../gameLogic";
import { getBest, recordBest } from "./bestScores";
import type { Attempt } from "./CoachCard";
import { createStats, pointsFor, recordAttempt, toRoundResult, type MathRoundStats } from "./scoring";
import { answerDigits, type MathGameDef, type Problem } from "./types";

export type Phase = "intro" | "playing" | "done";

export function useMathRound(game: MathGameDef) {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [phase, setPhase] = useState<Phase>("intro");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState<number[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [outcomes, setOutcomes] = useState<("correct" | "miss")[]>([]);
  const [stats, setStats] = useState<MathRoundStats>(createStats);
  const statsRef = useRef(stats);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [session, setSession] = useState(0);

  const problem = problems[index] as Problem | undefined;
  const digits = useMemo(() => (problem ? answerDigits(problem.answer) : []), [problem]);
  const expectedDigit = attempt ? undefined : digits[entered.length];

  const begin = useCallback(() => {
    setProblems(Array.from({ length: game.length }, (_, i) => game.generate(i, Math.random)));
    setIndex(0);
    setEntered([]);
    setAttempt(null);
    setOutcomes([]);
    statsRef.current = createStats();
    setStats(statsRef.current);
    setResult(null);
    setIsPersonalBest(false);
    setSession((n) => n + 1);
    setPhase("playing");
  }, [game]);

  /** Ends the current problem with an outcome; the CoachCard then waits for Continue. */
  const settle = useCallback(
    (outcome: "correct" | "miss", via: Attempt["via"]) => {
      if (attempt || !problem) return;
      const points = outcome === "correct" ? pointsFor(game.difficulty, statsRef.current.combo) : 0;
      statsRef.current = recordAttempt(statsRef.current, game.difficulty, outcome === "correct");
      setStats(statsRef.current);
      setOutcomes((o) => [...o, outcome]);
      if (outcome === "correct") setEntered(digits);
      setAttempt({ outcome, via, points });
    },
    [attempt, problem, game.difficulty, digits],
  );

  /** Camera confirmed one digit of the answer. */
  const acceptDigit = useCallback(
    (digit: number) => {
      if (attempt || digit !== expectedDigit) return;
      const next = [...entered, digit];
      if (next.length >= digits.length) settle("correct", "sign");
      else setEntered(next);
    },
    [attempt, expectedDigit, entered, digits.length, settle],
  );

  /** Voice gave a whole number. */
  const acceptSpoken = useCallback(
    (value: number) => {
      if (attempt || !problem) return;
      settle(value === problem.answer ? "correct" : "miss", "voice");
    },
    [attempt, problem, settle],
  );

  const finish = useCallback(() => {
    if (!profile) return;
    const finalStats = statsRef.current;
    const roundResult = toRoundResult(game.difficulty, finalStats);
    const prevBest = getBest(game.id)?.score ?? 0;
    setIsPersonalBest(finalStats.score > prevBest);
    recordBest(game.id, finalStats.score, finalStats.correct, finalStats.total);
    setResult(roundResult);
    setPhase("done");
    setSaving(true);
    void completeRound(profile, roundResult)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setSaving(false));
  }, [profile, game.difficulty, game.id]);

  const next = useCallback(() => {
    if (index + 1 >= problems.length) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
    setEntered([]);
    setAttempt(null);
  }, [index, problems.length, finish]);

  return {
    profile,
    phase,
    session,
    problem,
    index,
    digits,
    entered,
    expectedDigit,
    attempt,
    outcomes,
    stats,
    result,
    saving,
    isPersonalBest,
    isLast: index + 1 >= problems.length,
    begin,
    acceptDigit,
    acceptSpoken,
    reveal: () => settle("miss", "reveal"),
    next,
  };
}
