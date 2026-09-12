// TODO(B): scoring, in-round streak/combo, and XP awarded per mode.
import type { GameMode, RoundResult } from "../lib/contracts";

export function scoreRound(mode: GameMode, correct: number, total: number): RoundResult {
  const score = correct * 10;
  const xp = correct * 5;
  return { mode, score, correct, total, xp };
}
