// Minimal local stand-in for a signed-in profile, used before Supabase auth
// is wired up. Onboarding writes here; meta/PersonaGate flips `verified`
// once Persona sandbox verification succeeds. Swap for real Supabase-backed
// profiles in supabase.ts without changing the UserProfile shape.
import type { UserProfile } from "./contracts";

const STORAGE_KEY = "signly:profile";

export function getLocalProfile(): UserProfile | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** Called on logout so a signed-out session doesn't keep showing the
 * previous Google account's cached data. */
export function clearLocalProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createLocalProfile(name: string): UserProfile {
  const profile: UserProfile = {
    id: crypto.randomUUID(),
    name,
    streak: 0,
    xp: 0,
    level: 1,
    verified: false,
  };
  saveLocalProfile(profile);
  return profile;
}
