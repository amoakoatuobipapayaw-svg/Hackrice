// profile.ts — resolves "who is the current user" across guest and
// Google-authenticated states. Signed-in users are backed by a real
// Supabase profiles row (created here on first sign-in); guests stay
// entirely in localStorage (see localProfile.ts).
import type { UserProfile } from "./contracts";
import { getAuthedUser } from "./auth";
import { getProfile, syncProfile } from "./supabase";
import { getLocalProfile, saveLocalProfile } from "./localProfile";

/**
 * Resolves the active profile: a signed-in Google account if a session
 * exists (fetching their Supabase row, or creating it on first sign-in),
 * otherwise the local guest profile. Returns null only when there's
 * neither — first visit, send them to onboarding.
 */
export async function resolveProfile(): Promise<UserProfile | null> {
  const authed = await getAuthedUser();
  if (!authed) return getLocalProfile();

  const existing = await getProfile(authed.id);
  const profile: UserProfile = existing ?? {
    id: authed.id,
    name: authed.name,
    email: authed.email,
    streak: 0,
    xp: 0,
    level: 1,
    verified: false,
  };
  if (!existing) await syncProfile(profile);

  saveLocalProfile(profile); // cache for a snappy reload before the next fetch
  return profile;
}
