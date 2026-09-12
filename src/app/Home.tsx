import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { NAME } from "../lib/constants";
import { getLocalProfile, saveLocalProfile } from "../lib/localProfile";
import type { UserProfile } from "../lib/contracts";
import { PersonaGate } from "../meta/PersonaGate";
import { StreakBadge, XpBar } from "../meta/StreakXp";

const MODES: { to: string; title: string; blurb: string }[] = [
  { to: "/lesson", title: "Lesson", blurb: "Learn 5 signs at a time." },
  { to: "/speed", title: "Speed Challenge", blurb: "Race the clock for combo points." },
  { to: "/math", title: "Math Mode", blurb: "Answer by signing or speaking." },
];

export function Home() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    setProfile(getLocalProfile());
  }, []);

  if (profile === undefined) return null; // avoid onboarding flash while reading localStorage
  if (profile === null) return <Navigate to="/onboarding" replace />;

  function handleVerified() {
    if (!profile) return;
    const updated = { ...profile, verified: true };
    saveLocalProfile(updated);
    setProfile(updated);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {profile.name}</h1>
          <p className="text-slate-400">Ready to sign with {NAME} today?</p>
        </div>
        <StreakBadge profile={profile} />
      </div>

      <Card className="mb-8">
        <XpBar profile={profile} />
        {!profile.verified && (
          <div className="mt-4 border-t border-slate-800 pt-4">
            <PersonaGate onVerified={handleVerified} />
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {MODES.map((mode) => (
          <Link key={mode.to} to={mode.to}>
            <Card className="h-full transition-colors hover:border-violet-500">
              <h2 className="font-semibold">{mode.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{mode.blurb}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
