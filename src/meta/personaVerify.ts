// Sandbox-only "are you a real human" check, gating the public leaderboard.
// Loads Persona's embedded client from their CDN on demand — no bundled SDK,
// no auth system, just a one-time flag flip. Requires VITE_PERSONA_TEMPLATE_ID.
// Shared by PersonaGate.tsx (the explainer card on Home) and the nav's
// always-visible verify button — one place opens the actual widget so both
// stay wired the same way.
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

export async function openPersonaVerification(onVerified: () => void): Promise<void> {
  if (!personaTemplateId) return;
  await loadSdk();
  new window.Persona!.Client({
    templateId: personaTemplateId,
    environment: "sandbox",
    onComplete: () => onVerified(),
  }).open();
}
