import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { getLocalProfile, saveLocalProfile } from '../lib/localProfile';
import { PersonaGate } from '../meta/PersonaGate';
import { XpBar } from '../meta/StreakXp';
import { Roadmap } from '../games/Roadmap';

export function Home() {
  const [profile, setProfile] = useState(getLocalProfile);
  if (!profile) return <Navigate to="/onboarding" replace />;
  const currentProfile = profile;
  function handleVerified() {
    const updated = { ...currentProfile, verified: true };
    saveLocalProfile(updated);
    setProfile(updated);
  }
  return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-5 text-sm font-bold">
      <span className="text-muted">AMERICAN SIGN LANGUAGE</span>
      <div className="flex gap-5"><span title="Current day streak">🔥 {profile.streak} days</span><span className="text-brand">★ {profile.xp} XP</span><span className="text-muted">Level {profile.level}</span></div>
    </div>
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section aria-label="Learning path">
        <div className="flex items-center justify-between gap-4 rounded-2xl border-b-4 border-brand-hover bg-brand p-5 text-white sm:p-6">
          <div><p className="text-xs font-extrabold tracking-widest uppercase">Unit 1 · Getting started</p><h1 className="mt-2 text-2xl font-extrabold">Let your hands do the talking</h1><p className="mt-2 text-sm">Build confidence with letters and numbers.</p></div>
          <span aria-hidden="true" className="hidden text-5xl sm:block">✋</span>
        </div>
        <p className="mt-5 text-center text-sm text-muted">Welcome back, {profile.name}. Pick a unit to begin.</p>
        <Roadmap />
        <div className="rounded-2xl border-2 border-dashed border-line p-5 text-center"><h2 className="font-bold">One step at a time</h2><p className="mt-2 text-sm leading-relaxed text-muted">Start with hand shapes. Movement and conversation lessons are still to come.</p></div>
      </section>
      <aside className="space-y-5" aria-label="Your learning progress">
        <section className="rounded-2xl border-2 border-line p-5"><h2 className="text-lg font-extrabold">Your progress</h2><p className="mt-2 mb-5 text-sm text-muted">Every confirmed sign earns 5 XP.</p><XpBar profile={profile} /><Link to="/lesson" className="mt-5 block rounded-xl border-2 border-b-4 border-line py-3 text-center text-sm font-extrabold tracking-wide text-brand uppercase hover:bg-soft">Keep learning</Link><Link to="/speed" className="mt-3 block rounded-xl border-2 border-b-4 border-line py-3 text-center text-sm font-extrabold tracking-wide text-brand uppercase hover:bg-soft">Speed practice</Link></section>
        <section className="rounded-2xl border-2 border-line p-5"><div aria-hidden="true" className="mb-3 text-3xl">🏆</div><h2 className="text-lg font-extrabold">Better together</h2><p className="mt-2 text-sm leading-relaxed text-muted">Practice, earn XP, and see your progress alongside other learners.</p><Link to="/leaderboard" className="mt-4 inline-block text-sm font-extrabold text-selected-ink uppercase">View leaderboard →</Link>{!profile.verified && import.meta.env.VITE_PERSONA_TEMPLATE_ID && <div className="mt-5 border-t-2 border-line pt-4"><PersonaGate onVerified={handleVerified} /></div>}</section>
        <section className="rounded-2xl bg-soft p-5"><h2 className="font-extrabold">Before you begin</h2><ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted"><li>☀ Face a window or a soft light.</li><li>✋ Keep your whole hand in view.</li><li>✓ Hold your sign for one second.</li></ul></section>
      </aside>
    </div>
  </div>;
}
