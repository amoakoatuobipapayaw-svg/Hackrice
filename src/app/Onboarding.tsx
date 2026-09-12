import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { NAME, TAGLINE } from "../lib/constants";
import { createLocalProfile } from "../lib/localProfile";

export function Onboarding() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createLocalProfile(trimmed);
    navigate("/");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Welcome to {NAME}</h1>
      <p className="text-slate-400">{TAGLINE}</p>
      <Card className="w-full text-left">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            What should we call you?
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 outline-none focus:border-violet-400"
            />
          </label>
          <Button type="submit" disabled={!name.trim()}>
            Start learning
          </Button>
        </form>
      </Card>
      <p className="text-xs text-slate-500">
        You can verify your identity later to post scores to the public
        leaderboard.
      </p>
    </div>
  );
}
