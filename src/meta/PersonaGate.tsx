import { Button } from "../components/ui/Button";
import { openPersonaVerification, personaTemplateId } from "./personaVerify";

export function PersonaGate({ onVerified }: { onVerified: () => void }) {
  if (!personaTemplateId) {
    return (
      <p className="text-sm text-ink">
        Persona sandbox not configured (missing VITE_PERSONA_TEMPLATE_ID).
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={() => openPersonaVerification(onVerified)}>Verify to join the leaderboard</Button>
      <p className="text-xs leading-relaxed text-muted">
        This is a sandbox integration: no real text message is sent. Enter any phone number, then
        any 4-digit code on the next screen — that's what completes verification here.
      </p>
    </div>
  );
}
