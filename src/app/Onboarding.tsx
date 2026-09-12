import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import { NAME, TAGLINE } from "../lib/constants";
import { createLocalProfile } from "../lib/localProfile";
import { setTtsEnabled } from "../voice/ttsPreference";

export function Onboarding() {
  const [name, setName] = useState("");
  const [speakAloud, setSpeakAloud] = useState(true);
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

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-12 text-center sm:py-16">
      <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl border-b-4 border-brand-hover bg-brand text-white">
        <Icon name="hand" size={32} />
      </span>
      <div>
        <h1 className="text-3xl font-black tracking-tight">Welcome to {NAME}</h1>
        <p className="mt-2 text-muted">{TAGLINE}</p>
      </div>
      <Card className="w-full text-left">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        </form>
      </Card>
      <p className="text-xs text-muted">
        You can verify your identity later to post scores to the public
        leaderboard.
      </p>
    </div>
  );
}
