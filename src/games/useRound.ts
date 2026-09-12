// Round lifecycle shared by all modes: the local profile, live RoundStats,
// and finishing (build the RoundResult, award XP via completeRound).
// Stats are mirrored in a ref so an event handler can record a rep and
// immediately see the updated numbers to decide whether the round is over.
import { useCallback, useRef, useState } from "react";
import type { GameMode, RoundResult, UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { buildRoundResult, completeRound, createRoundStats, recordRep, type RoundStats } from "./gameLogic";

export function useRound(mode: GameMode) {
  const [profile, setProfile] = useState<UserProfile | null>(() => getLocalProfile());
  const [stats, setStats] = useState<RoundStats>(createRoundStats);
  const statsRef = useRef(stats);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [saving, setSaving] = useState(false);
  const finishedRef = useRef(false);

  /** Records one attempt and returns the new stats synchronously. */
  const record = useCallback((wasCorrect: boolean, elapsedMs?: number): RoundStats => {
    const next = recordRep(statsRef.current, wasCorrect, elapsedMs);
    statsRef.current = next;
    setStats(next);
    return next;
  }, []);

  /** Ends the round exactly once, even if called from a timer and a rep together. */
  const finish = useCallback(
    (finalStats: RoundStats = statsRef.current) => {
      if (finishedRef.current || !profile) return;
      finishedRef.current = true;
      const roundResult = buildRoundResult(mode, finalStats);
      setResult(roundResult);
      setSaving(true);
      void completeRound(profile, roundResult)
        .then(setProfile)
        .finally(() => setSaving(false));
    },
    [mode, profile],
  );

  const restart = useCallback(() => {
    finishedRef.current = false;
    statsRef.current = createRoundStats();
    setStats(statsRef.current);
    setResult(null);
  }, []);

  return { profile, stats, result, saving, record, finish, restart, isFinished: () => finishedRef.current };
}
