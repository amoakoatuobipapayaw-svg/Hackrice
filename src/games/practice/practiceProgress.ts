// How far through the five Practice levels the learner has got. Local-only
// and deliberately outside UserProfile/contracts.ts — same reasoning as
// welcomeProgress.ts: this is a "furthest level finished" marker, not
// XP/streak state, and XP still flows through gameLogic's completeRound().
import { LEVEL_COUNT, type LevelNumber } from "./levels";

const KEY = "signly:practice:level";

/** The highest level finished; 0 before the first round is completed. */
export function highestCompletedLevel(): number {
  try {
    const value = Number(localStorage.getItem(KEY));
    return Number.isInteger(value) ? Math.min(Math.max(value, 0), LEVEL_COUNT) : 0;
  } catch {
    return 0;
  }
}

/** Records a finished level. Never moves the marker backwards on a replay. */
export function markLevelComplete(level: LevelNumber): void {
  try {
    if (level > highestCompletedLevel()) localStorage.setItem(KEY, String(level));
  } catch {
    // Private browsing or a blocked store — the round still counts, it just won't be remembered.
  }
}

/** Level 1 is always open; every other level needs the one before it finished. */
export function isLevelUnlocked(level: number, completed = highestCompletedLevel()): boolean {
  return level <= 1 || completed >= level - 1;
}

/** The level the "Start practice" button should open: the first unfinished one. */
export function currentLevelNumber(completed = highestCompletedLevel()): LevelNumber {
  return Math.min(completed + 1, LEVEL_COUNT) as LevelNumber;
}

export function unlockedCount(completed = highestCompletedLevel()): number {
  return Math.min(completed + 1, LEVEL_COUNT);
}
