import { Button } from "../components/ui/Button";

// Sandbox-only "are you a real human" check, gating the public leaderboard.
// Loads Persona's embedded client from their CDN on demand — no bundled SDK,
// no auth system, just a one-time flag flip. Requires VITE_PERSONA_TEMPLATE_ID.
declare global {
  interface Window {
    Persona?: { Client: new (opts: Record<string, unknown>) => { open(): void } };
  }
}

const SDK_URL = "https://cdn.withpersona.com/dist/persona-v4.11.0.js";
const templateId = import.meta.env.VITE_PERSONA_TEMPLATE_ID;

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

export function PersonaGate({ onVerified }: { onVerified: () => void }) {
  if (!templateId) {
    return (
      <p className="text-sm text-amber-400">
        Persona sandbox not configured (missing VITE_PERSONA_TEMPLATE_ID).
      </p>
    );
  }

  async function verify() {
    await loadSdk();
    new window.Persona!.Client({
      templateId,
      environment: "sandbox",
      onComplete: () => onVerified(),
    }).open();
  }

  return <Button onClick={verify}>Verify to join the leaderboard</Button>;
}
