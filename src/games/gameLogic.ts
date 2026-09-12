// Scoring, in-round combo, and XP awarded per mode — plus completeRound(),
// the one place all three modes apply a finished round to the profile,
// streak, and (if verified) the leaderboard, so that logic isn't
// duplicated three times.
import type { GameMode, RoundResult, UserProfile } from "../lib/contracts";
import { bumpStreak, postScore, syncProfile } from "../lib/supabase";
import { saveLocalProfile } from "../lib/localProfile";
import { levelForXp } from "../meta/StreakXp";

export const LESSON_LENGTH = 5;
export const MATH_ROUND_LENGTH = 5;
export const SPEED_CHALLENGE_SECONDS = 30;

/** Points for one correct rep; a combo streak of 3+ pays more. */
export function pointsForRep(comboStreak: number): number {
  if (comboStreak >= 5) return 30;
  if (comboStreak >= 3) return 20;
  return 10;
}

export function scoreRound(mode: GameMode, correct: number, total: number, score?: number): RoundResult {
  return { mode, score: score ?? correct * 10, correct, total, xp: correct * 5 };
}

/**
 * Awards a finished round's XP and saves the profile locally. Guests (no
 * Google account — see lib/auth.ts) only get that local feedback: no
 * streak, no server persistence, not leaderboard-eligible. Signed-in
 * accounts additionally bump the real streak and sync XP/level to
 * Supabase. Posting to the public leaderboard is gated a level further,
 * on Persona verification — an account can be real without being
 * leaderboard-eligible yet.
 */
export async function completeRound(profile: UserProfile, result: RoundResult): Promise<UserProfile> {
  const xp = profile.xp + result.xp;

  if (!profile.email) {
    const updated: UserProfile = { ...profile, xp, level: levelForXp(xp) };
    saveLocalProfile(updated);
    return updated;
  }

  const streak = await bumpStreak(profile.id);
  const updated: UserProfile = { ...profile, xp, streak, level: levelForXp(xp) };
  saveLocalProfile(updated);
  await syncProfile(updated);

  if (updated.verified) {
    await postScore({
      userId: updated.id,
      name: updated.name,
      xp: updated.xp,
      verified: updated.verified,
      updatedAt: new Date().toISOString(),
    });
  }

  return updated;
}
