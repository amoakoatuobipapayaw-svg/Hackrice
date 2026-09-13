import { Button } from "../components/ui/Button";
import type { UserProfile } from "../lib/contracts";
import { openPersonaVerification, personaTemplateId } from "./personaVerify";

export function PersonaGate({ profile, onVerified }: { profile: UserProfile; onVerified: (updated: UserProfile) => void }) {
  if (!personaTemplateId) {
    return (
      <p className="text-sm text-ink">
        Persona sandbox not configured (missing VITE_PERSONA_TEMPLATE_ID).
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={() => openPersonaVerification(profile, onVerified)}>Verify to join the leaderboard</Button>
      <p className="text-xs leading-relaxed text-muted">
        This is a sandbox integration: no real text message is sent. Enter any phone number, then
        any 4-digit code on the next screen — that's what completes verification here.
      </p>
    </div>
  );
}
