// Pure scoring for the Math Lab. No timers (Signly's rule: "no timers on
// your learning"), so points come from correctness, combo, and difficulty.
import type { RoundResult } from "../../lib/contracts";
import type { Difficulty } from "./types";

export const BASE_POINTS = 10;
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = { easy: 1, medium: 1.5, hard: 2 };

/** Consecutive correct answers → multiplier applied to the NEXT one. */
export function comboMultiplier(combo: number): number {
  if (combo >= 5) return 2;
  if (combo >= 3) return 1.5;
  return 1;
}

export type MathRoundStats = {
  correct: number;
  total: number;
  score: number;
  combo: number;
  bestCombo: number;
  lastPoints: number;
};

export function createStats(): MathRoundStats {
  return { correct: 0, total: 0, score: 0, combo: 0, bestCombo: 0, lastPoints: 0 };
}

export function pointsFor(difficulty: Difficulty, combo: number): number {
  return Math.round(BASE_POINTS * DIFFICULTY_WEIGHT[difficulty] * comboMultiplier(combo));
}

/** Immutable: returns the stats after one attempt. A miss breaks the combo. */
export function recordAttempt(stats: MathRoundStats, difficulty: Difficulty, wasCorrect: boolean): MathRoundStats {
  if (!wasCorrect) return { ...stats, total: stats.total + 1, combo: 0, lastPoints: 0 };
  const points = pointsFor(difficulty, stats.combo);
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

/** XP feeds the shared profile/leaderboard via completeRound(). Harder
 * tiers pay more per correct answer; a perfect round earns a bonus. */
export function xpFor(difficulty: Difficulty, stats: MathRoundStats): number {
  let xp = Math.round(stats.correct * 5 * DIFFICULTY_WEIGHT[difficulty]);
  if (stats.total > 0 && stats.correct === stats.total) xp += 10;
  return xp;
}

/** The only place a contracts.ts RoundResult is assembled for Math Lab. */
export function toRoundResult(difficulty: Difficulty, stats: MathRoundStats): RoundResult {
  return { mode: "math", score: stats.score, correct: stats.correct, total: stats.total, xp: xpFor(difficulty, stats) };
}

export function accuracy(stats: Pick<MathRoundStats, "correct" | "total">): number {
  return stats.total === 0 ? 0 : stats.correct / stats.total;
}

/** Headline for the results screen. */
export function verdict(stats: MathRoundStats): string {
  const pct = accuracy(stats);
  if (pct >= 1) return "Perfect round.";
  if (pct >= 0.8) return "Strong work.";
  if (pct >= 0.5) return "Good progress.";
  return "Every attempt counts.";
}
