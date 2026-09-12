import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { getLocalProfile, saveLocalProfile } from '../lib/localProfile';
import { syncProfile } from '../lib/supabase';
import { PersonaGate } from '../meta/PersonaGate';
import { XpBar } from '../meta/StreakXp';

const ACTIVITIES = [
  { to: '/lesson', icon: '★', title: 'Your first five signs', detail: 'I · L · V · W · Y', offset: '-translate-x-8', tag: 'START HERE' },
  { to: '/math', icon: '＋', title: 'Count on your hands', detail: 'Five puzzles · Numbers 1–9', offset: 'translate-x-8', tag: 'MATH PRACTICE' },
  { to: '/speed', icon: 'ϟ', title: 'Find your rhythm', detail: '30 seconds · Sign and score', offset: '-translate-x-4', tag: 'SPEED PRACTICE' },
];

export function Home() {
  const [profile, setProfile] = useState(getLocalProfile);
  if (!profile) return <Navigate to="/onboarding" replace />;
  const currentProfile = profile;
  async function handleVerified() {
    const updated = { ...currentProfile, verified: true };
    saveLocalProfile(updated);
    setProfile(updated);
    // Persona verification IS account creation: this is the first time
    // this profile gets a real row in Supabase, unlocking streak
    // persistence and leaderboard eligibility in gameLogic.ts.
    await syncProfile(updated);
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
        <p className="mt-5 text-center text-sm text-muted">Welcome back, {profile.name}. Pick a practice to begin.</p>
        <ol className="relative mx-auto mt-8 max-w-[260px] space-y-8 pb-8">
          <li aria-hidden="true" className="absolute top-12 bottom-20 left-1/2 w-2 -translate-x-1/2 rounded-full bg-soft" />
          {ACTIVITIES.map((activity, i) => <li key={activity.to} className={`relative flex flex-col items-center ${activity.offset}`}>
            <span className="mb-3 rounded-lg border-2 border-line bg-surface px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-brand">{activity.tag}</span>
            <Link to={activity.to} aria-label={activity.title} className={`flex h-20 w-20 items-center justify-center rounded-full border-b-8 text-4xl font-extrabold transition-transform hover:-translate-y-1 active:translate-y-1 motion-reduce:transition-none ${i === 0 ? 'border-brand-hover bg-brand text-white ring-8 ring-soft' : 'border-line bg-soft text-brand'}`}>{activity.icon}</Link>
            <h2 className="mt-3 rounded-lg bg-canvas px-2 text-base font-extrabold">{activity.title}</h2><p className="rounded-lg bg-canvas px-2 text-xs text-muted">{activity.detail}</p>
          </li>)}
        </ol>
        <div className="rounded-2xl border-2 border-dashed border-line p-5 text-center"><h2 className="font-bold">One step at a time</h2><p className="mt-2 text-sm leading-relaxed text-muted">Start with hand shapes. Movement and conversation lessons are still to come.</p></div>
      </section>
      <aside className="space-y-5" aria-label="Your learning progress">
        <section className="rounded-2xl border-2 border-line p-5"><h2 className="text-lg font-extrabold">Your progress</h2><p className="mt-2 mb-5 text-sm text-muted">Every confirmed sign earns 5 XP.</p><XpBar profile={profile} /><Link to="/lesson" className="mt-5 block rounded-xl border-2 border-b-4 border-line py-3 text-center text-sm font-extrabold tracking-wide text-brand uppercase hover:bg-soft">Keep learning</Link></section>
        <section className="rounded-2xl border-2 border-line p-5"><div aria-hidden="true" className="mb-3 text-3xl">🏆</div><h2 className="text-lg font-extrabold">Better together</h2><p className="mt-2 text-sm leading-relaxed text-muted">{profile.verified ? 'Your streak and XP are saved to your account and count on the leaderboard.' : "You're practicing as a guest — XP shows for this session, but nothing is saved. Verify once to create your account: save your streak and join the leaderboard."}</p><Link to="/leaderboard" className="mt-4 inline-block text-sm font-extrabold text-selected-ink uppercase">View leaderboard →</Link>{!profile.verified && import.meta.env.VITE_PERSONA_TEMPLATE_ID && <div className="mt-5 border-t-2 border-line pt-4"><PersonaGate onVerified={handleVerified} /></div>}</section>
        <section className="rounded-2xl bg-soft p-5"><h2 className="font-extrabold">Before you begin</h2><ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted"><li>☀ Face a window or a soft light.</li><li>✋ Keep your whole hand in view.</li><li>✓ Hold your sign for one second.</li></ul></section>
      </aside>
    </div>
  </div>;
}
