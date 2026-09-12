import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import { LogoMark, Wordmark } from "../components/ui/Logo";
import { signInWithGoogle } from "../lib/auth";
import { createLocalProfile } from "../lib/localProfile";
import { setTtsEnabled } from "../voice/ttsPreference";

const TILT = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2"];

export function Onboarding() {
  const [name, setName] = useState("");
  const [speakAloud, setSpeakAloud] = useState(true);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setTtsEnabled(speakAloud);
    createLocalProfile(trimmed);
    navigate("/");
  }

  const optionClass = (active: boolean) =>
    `flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-colors ${
      active ? "border-selected-line bg-selected text-selected-ink" : "border-line text-ink hover:bg-soft"
    }`;

  const letters = name.replace(/[^a-z]/gi, "").slice(0, 10).toUpperCase().split("");

  async function handleGoogleSignIn() {
    setGoogleError(null);
    try {
      // Redirects the whole page to Google, then back to "/" on success —
      // Home.tsx resolves the signed-in profile from there (lib/profile.ts).
      await signInWithGoogle();
    } catch {
      setGoogleError("Google sign-in isn't set up yet. Continue as a guest below.");
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-20">
      <div className="text-center lg:text-left">
        <div className="inline-flex items-center gap-3">
          <LogoMark size={56} />
          <Wordmark className="text-4xl" />
        </div>
        <h1 className="mt-6 text-4xl leading-tight font-black tracking-tight sm:text-5xl">
          Say it with <span className="marker-underline">your hands</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted lg:mx-0">
          Learn American Sign Language by signing to your webcam and getting feedback on every shape. Lessons, speed rounds and math puzzles, all scored live.
        </p>
        <div className="mt-8 flex min-h-12 flex-wrap justify-center gap-1.5 lg:justify-start" aria-live="polite" aria-label={letters.length ? `${name} fingerspelled` : undefined}>
          {letters.length === 0 ? (
            <p className="text-sm font-bold text-muted">Type your name and watch it get fingerspelled.</p>
          ) : (
            letters.map((letter, i) => (
              <span key={i} className={`flex h-12 w-11 flex-col items-center justify-center rounded-lg border-b-4 text-xl font-black shadow-sm ${TILT[i % TILT.length]} ${i % 3 === 1 ? "border-accent-ink/30 bg-accent text-accent-ink" : "border-line bg-surface text-brand"}`}>
                {letter}
                <span className="-mt-1 text-[8px] font-bold tracking-widest text-current/60">ASL</span>
              </span>
            ))
          )}
        </div>
      </div>

      <Card className="w-full">
        <div className="flex flex-col gap-2 border-b-2 border-line pb-5 text-center">
          <Button type="button" variant="secondary" onClick={handleGoogleSignIn}>
            Sign in with Google
          </Button>
          {googleError && <p className="text-xs text-red-400">{googleError}</p>}
          <p className="text-xs text-muted">
            Creates a real account: your streak and XP follow you to any device, and
            you can verify with Persona to join the leaderboard.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-5">
          <p className="-mt-2 text-center text-xs font-bold text-muted">or continue as a guest</p>
          <label className="flex flex-col gap-2 text-sm font-extrabold">
            What should we call you?
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl border-2 border-line bg-canvas px-4 py-3 text-base font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted/70 focus:border-brand"
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-extrabold">Speak prompts and answers aloud?</legend>
            <label className={optionClass(speakAloud)}>
              <input type="radio" name="tts-preference" className="sr-only" checked={speakAloud} onChange={() => setSpeakAloud(true)} />
              <Icon name="volume" size={18} />
              Yes, read things aloud to me
            </label>
            <label className={optionClass(!speakAloud)}>
              <input type="radio" name="tts-preference" className="sr-only" checked={!speakAloud} onChange={() => setSpeakAloud(false)} />
              <Icon name="volumeOff" size={18} />
              No thanks, text only
            </label>
          </fieldset>
          <Button type="submit" disabled={!name.trim()}>
            Start learning
          </Button>
          <p className="text-center text-xs text-muted">
            Guest progress stays on this device only — nothing above is required
            to start practicing.
          </p>
        </form>
      </Card>
    </div>
  );
}
