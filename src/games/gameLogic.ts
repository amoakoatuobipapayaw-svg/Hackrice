// Public scoring surface for src/games/ plus completeRound(), the one place
// all three modes apply a finished round to the profile, streak, and (if
// verified) the leaderboard. The pure rules live in scoring.ts so they can
// be unit-tested in Node without React or Supabase.
import type { RoundResult, UserProfile } from "../lib/contracts";
import { bumpStreak, postScore } from "../lib/supabase";
import { saveLocalProfile } from "../lib/localProfile";
import { levelForXp } from "../meta/StreakXp";

export * from "./scoring";

/** Awards a finished round's XP, bumps the daily streak, saves the profile
 * locally, and (once verified) pushes the new total to the leaderboard.
 * Never throws: a flaky network must not eat the player's results screen. */
export async function completeRound(profile: UserProfile, result: RoundResult): Promise<UserProfile> {
  const xp = profile.xp + result.xp;
  let streak = profile.streak;
  try {
    streak = await bumpStreak(profile.id);
  } catch {
    // keep the local streak; the next successful round will resync
  }
  const updated: UserProfile = { ...profile, xp, streak, level: levelForXp(xp) };
  saveLocalProfile(updated);

  if (updated.verified) {
    try {
      await postScore({
        userId: updated.id,
        name: updated.name,
        xp: updated.xp,
        verified: updated.verified,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // leaderboard post failed; local progress is already saved
    }
  }

  return updated;
}
