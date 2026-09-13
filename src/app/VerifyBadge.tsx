// A permanent, always-visible nav affordance mirroring GoogleSignInButton —
// Home.tsx's own Persona card only shows up if you scroll to the right
// sidebar, easy to miss. Shown only once signed in AND not yet verified;
// renders nothing for guests or already-verified accounts.
import { useEffect, useState } from "react";
import { Icon } from "../components/ui/Icon";
import { onAuthChange } from "../lib/auth";
import type { UserProfile } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { getProfile } from "../lib/supabase";
import { openPersonaVerification, personaTemplateId } from "../meta/personaVerify";

const TITLE = "Sandbox integration: no real text message is sent. Enter any phone number, then any 4-digit code to complete verification.";

export function VerifyBadge({ compact = false }: { compact?: boolean }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(
    () =>
      onAuthChange(async (user) => {
        if (!user) {
          setProfile(null);
          return;
        }
        // On a brand-new sign-in, Home.tsx's resolveProfile() is racing to
        // INSERT this user's row at the same time we're trying to read it —
        // a first-ever load can easily ask before that insert lands. A
        // couple of short retries covers that gap without needing to share
        // state with Home.tsx.
        for (let attempt = 0; attempt < 4; attempt++) {
          const existing = await getProfile(user.id).catch(() => null);
          if (existing) {
            setProfile(existing);
            return;
          }
          const cached = getLocalProfile();
          if (cached && cached.id === user.id) {
            setProfile(cached);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
        setProfile(null);
      }),
    [],
  );

  if (!profile || profile.verified || !personaTemplateId) return null;

  return (
    <button
      type="button"
      title={TITLE}
      onClick={() => openPersonaVerification(profile, setProfile)}
      className={
        compact
          ? "flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 border-brand bg-brand-soft px-3 text-xs font-extrabold text-brand"
          : "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-brand-hover bg-brand py-2.5 text-sm font-extrabold text-white uppercase hover:bg-brand-hover"
      }
    >
      <Icon name="badgeCheck" size={16} />
      Verify
    </button>
  );
}
