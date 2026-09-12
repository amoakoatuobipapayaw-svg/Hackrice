import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
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

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Welcome to {NAME}</h1>
      <p className="text-muted">{TAGLINE}</p>
      <Card className="w-full text-left">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            What should we call you?
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-lg border border-line bg-canvas px-3 py-2 text-base text-ink outline-none focus:border-brand"
            />
          </label>
          <fieldset className="flex flex-col gap-2 text-sm font-medium text-muted">
            <legend className="mb-1">Speak prompts and answers aloud?</legend>
            <label className="flex items-center gap-2 font-normal text-ink">
              <input
                type="radio"
                name="tts-preference"
                checked={speakAloud}
                onChange={() => setSpeakAloud(true)}
              />
              Yes, read things aloud to me
            </label>
            <label className="flex items-center gap-2 font-normal text-ink">
              <input
                type="radio"
                name="tts-preference"
                checked={!speakAloud}
                onChange={() => setSpeakAloud(false)}
              />
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
