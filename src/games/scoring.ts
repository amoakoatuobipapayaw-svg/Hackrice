// Pure scoring rules shared by all three modes. No React, no browser APIs,
// so src/games/tests can exercise every rule in Node. gameLogic.ts re-exports
// this and adds the side-effecting completeRound().
import type { GameMode, RoundResult } from "../lib/contracts";

export const LESSON_LENGTH = 5;
export const MATH_ROUND_LENGTH = 5;
export const SPEED_CHALLENGE_SECONDS = 45;
/** Seconds a Math problem stays open before it counts as a miss. */
export const MATH_PROBLEM_SECONDS = 20;

export const BASE_POINTS = 10;
/** A rep confirmed within this window of the prompt appearing earns a speed bonus. */
export const SPEED_BONUS_WINDOW_MS = 6000;
export const SPEED_BONUS_MAX = 10;

/** Consecutive-correct thresholds → multiplier. Displayed as "x1.5" etc. */
export const COMBO_TIERS: readonly { atLeast: number; multiplier: number }[] = [
  { atLeast: 10, multiplier: 3 },
  { atLeast: 5, multiplier: 2 },
  { atLeast: 3, multiplier: 1.5 },
  { atLeast: 0, multiplier: 1 },
];

/** Multiplier for the NEXT rep given how many correct reps are already chained. */
export function comboMultiplier(combo: number): number {
  const tier = COMBO_TIERS.find((t) => combo >= t.atLeast);
  return tier ? tier.multiplier : 1;
}

/** Reps until the next multiplier tier, or null when maxed — drives the HUD nudge. */
export function repsToNextTier(combo: number): number | null {
  const next = [...COMBO_TIERS].reverse().find((t) => t.atLeast > combo);
  return next ? next.atLeast - combo : null;
}

/** Linear decay from SPEED_BONUS_MAX at 0 ms to 0 at the window edge. */
export function speedBonus(elapsedMs: number, windowMs = SPEED_BONUS_WINDOW_MS): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
  const remaining = Math.max(0, 1 - elapsedMs / windowMs);
  return Math.round(SPEED_BONUS_MAX * remaining);
}

export type RepInput = {
  /** Correct reps already chained before this one. */
  combo: number;
  /** Time from prompt shown to rep confirmed; omit in untimed modes. */
  elapsedMs?: number;
};

/** Points for one correct rep: (base + speed bonus) × combo multiplier. */
export function pointsForRep({ combo, elapsedMs }: RepInput): number {
  const bonus = elapsedMs === undefined ? 0 : speedBonus(elapsedMs);
  return Math.round((BASE_POINTS + bonus) * comboMultiplier(combo));
}

/** Everything a round tracks while it's running. Immutable — recordRep returns a copy. */
export type RoundStats = {
  correct: number;
  total: number;
  score: number;
  combo: number;
  bestCombo: number;
  lastPoints: number;
};

export function createRoundStats(): RoundStats {
  return { correct: 0, total: 0, score: 0, combo: 0, bestCombo: 0, lastPoints: 0 };
}

/** Apply one attempt. A miss (skip, timeout, wrong answer) breaks the combo. */
export function recordRep(stats: RoundStats, wasCorrect: boolean, elapsedMs?: number): RoundStats {
  if (!wasCorrect) {
    return { ...stats, total: stats.total + 1, combo: 0, lastPoints: 0 };
  }
  const points = pointsForRep({ combo: stats.combo, elapsedMs });
  const combo = stats.combo + 1;
  return {
    correct: stats.correct + 1,
    total: stats.total + 1,
    score: stats.score + points,
    combo,
    bestCombo: Math.max(stats.bestCombo, combo),
    lastPoints: points,
  };
}

export function accuracy(stats: Pick<RoundStats, "correct" | "total">): number {
  return stats.total === 0 ? 0 : stats.correct / stats.total;
}

/** XP is the cross-mode currency: 5 per correct rep, +10 for a perfect round,
 * and Speed Challenge also converts score so a long fast run outranks a
 * short perfect one. */
export function xpForRound(mode: GameMode, stats: RoundStats): number {
  let xp = stats.correct * 5;
  if (stats.total > 0 && stats.correct === stats.total) xp += 10;
  if (mode === "speed") xp += Math.floor(stats.score / 20);
  return xp;
}

/** The only place a RoundResult (contracts.ts) is assembled. */
export function buildRoundResult(mode: GameMode, stats: RoundStats): RoundResult {
  return {
    mode,
    score: stats.score,
    correct: stats.correct,
    total: stats.total,
    xp: xpForRound(mode, stats),
  };
}

/** Short verdict for the results screen. */
export function gradeForAccuracy(pct: number): string {
  if (pct >= 1) return "Perfect!";
  if (pct >= 0.8) return "Great job";
  if (pct >= 0.5) return "Getting there";
  return "Keep practicing";
}
