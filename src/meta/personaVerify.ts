// Sandbox-only "are you a real human" check, gating the public leaderboard.
// Loads Persona's embedded client from their CDN on demand — no bundled SDK,
// no auth system, just a one-time flag flip. Requires VITE_PERSONA_TEMPLATE_ID.
// Shared by PersonaGate.tsx (the explainer card on Home) and the nav's
// always-visible verify button — one place opens the actual widget so both
// stay wired the same way.
// onComplete's args were confirmed live against the real widget: it fires
// with { inquiryId, status } where status is "completed" — Persona's own
// lifecycle docs define that as "end user reaches the Completed screen",
// distinct from "failed" ("end user reaches the Failed screen"). The
// sandbox's "Pass/Fail verifications" toggle turned out to work earlier in
// the flow than that: with Fail selected, the phone confirmation code is
// rejected outright ("This confirmation code is invalid") and the flow
// never reaches either terminal screen, so onComplete never fires at all —
// confirmed live, not assumed. Checking status here is defense in depth for
// whatever future template/flow might actually reach a "failed" onComplete,
// not a fix for a bug we could reproduce today.
import type { UserProfile } from "../lib/contracts";
import { saveLocalProfile } from "../lib/localProfile";
import { postScore, syncProfile } from "../lib/supabase";

declare global {
  interface Window {
    Persona?: { Client: new (opts: Record<string, unknown>) => { open(): void } };
  }
}

const SDK_URL = "https://cdn.withpersona.com/dist/persona-v4.11.0.js";
export const personaTemplateId = import.meta.env.VITE_PERSONA_TEMPLATE_ID;

async function loadSdk(): Promise<void> {
  if (window.Persona) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Persona SDK"));
    document.head.appendChild(script);
  });
}

/**
 * Flips `verified` and pushes it everywhere the leaderboard reads from —
 * previously this only synced the profile row, so a completed verification
 * didn't actually post a score; your current XP just sat there until the
 * next full completeRound(). Posting here too means verifying itself is
 * the moment you appear on the leaderboard, not "verify, then play again."
 */
export async function applyVerification(profile: UserProfile): Promise<UserProfile> {
  const updated: UserProfile = { ...profile, verified: true };
  saveLocalProfile(updated);
  await syncProfile(updated);
  await postScore({
    userId: updated.id,
    name: updated.name,
    xp: updated.xp,
    verified: updated.verified,
    updatedAt: new Date().toISOString(),
  });
  return updated;
}

export async function openPersonaVerification(profile: UserProfile, onVerified: (updated: UserProfile) => void): Promise<void> {
  if (!personaTemplateId) return;
  await loadSdk();
  new window.Persona!.Client({
    templateId: personaTemplateId,
    environment: "sandbox",
    onComplete: ({ status }: { status?: string }) => {
      if (status !== "completed") return;
      void applyVerification(profile).then(onVerified);
    },
  }).open();
}
