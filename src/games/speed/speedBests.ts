// Per-mode personal bests for Speed, so the switcher can show what you have
// to beat. Local-only, exactly like the Math Lab's bestScores.ts — the
// leaderboard stays XP-based through gameLogic's completeRound().
import type { SpeedModeId } from "./modes";

const KEY = "signly:speed:best";

type BestMap = Partial<Record<SpeedModeId, { score: number; signs: number }>>;

function read(): BestMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as BestMap;
  } catch {
    return {};
  }
}

export function getSpeedBest(mode: SpeedModeId): { score: number; signs: number } | undefined {
  return read()[mode];
}

/** Returns true when this run beat the stored best (a fresh best counts). */
export function recordSpeedBest(mode: SpeedModeId, score: number, signs: number): boolean {
  const previous = read()[mode];
  const isBest = score > (previous?.score ?? -1);
  try {
    if (isBest) localStorage.setItem(KEY, JSON.stringify({ ...read(), [mode]: { score, signs } }));
  } catch {
    // Private browsing or a blocked store — the run still scored, it just won't be remembered.
  }
  return isBest;
}
