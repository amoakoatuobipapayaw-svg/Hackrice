import { useEffect, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/ui/Icon';
import { LogoMark } from '../components/ui/Logo';
import { signOutUser } from '../lib/auth';
import { getActivityDays } from '../lib/activityLog';
import type { UserProfile } from '../lib/contracts';
import { clearLocalProfile, saveLocalProfile } from '../lib/localProfile';
import { resolveProfile } from '../lib/profile';
import { syncProfile } from '../lib/supabase';
import { PersonaGate } from '../meta/PersonaGate';
import { StreakCalendar } from '../meta/StreakCalendar';
import { XpBar } from '../meta/StreakXp';
import { Roadmap } from '../games/Roadmap';

const TIPS: Array<{ icon: IconName; text: string }> = [
  { icon: 'sun', text: 'Face a window or a soft light.' },
  { icon: 'hand', text: 'Keep your whole hand in view.' },
  { icon: 'timer', text: 'Hold each sign for one second.' },
];

const TILE_TILT = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-2'];

/** Scrabble-style tiles spelling the user's name: ASL is fingerspelled
 * letter by letter, so the first thing a learner sees is their own name
 * broken into the shapes they're about to learn. */
function FingerspellName({ name }: { name: string }) {
  const letters = name.replace(/[^a-z]/gi, '').slice(0, 10).toUpperCase().split('');
  if (letters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <p className="text-xs font-extrabold tracking-widest text-muted uppercase">Your name, fingerspelled</p>
      <ol className="flex flex-wrap gap-1.5" aria-label={`${name}, one tile per letter`}>
        {letters.map((letter, i) => (
          <li key={i} className={`flex h-10 w-9 flex-col items-center justify-center rounded-lg border-b-4 text-lg font-black shadow-sm transition-transform hover:rotate-0 hover:-translate-y-1 motion-reduce:transition-none ${TILE_TILT[i % TILE_TILT.length]} ${i % 3 === 1 ? 'border-accent-ink/30 bg-accent text-accent-ink' : 'border-line bg-surface text-brand'}`}>
            {letter}
            <span className="-mt-1 text-[8px] font-bold tracking-widest text-current/60">ASL</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Home() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [activeDays] = useState(getActivityDays);
  const navigate = useNavigate();

  useEffect(() => {
    resolveProfile().then(setProfile);
  }, []);

  if (profile === undefined) return null; // resolving auth session — avoid an onboarding flash
  if (profile === null) return <Navigate to="/onboarding" replace />;
  const currentProfile = profile;

  async function handleVerified() {
    const updated = { ...currentProfile, verified: true };
    saveLocalProfile(updated);
    setProfile(updated);
    await syncProfile(updated);
  }

  async function handleLogout() {
    await signOutUser();
    clearLocalProfile();
    navigate('/onboarding', { replace: true });
  }

  const stats: Array<{ icon: IconName; label: string; value: string; title: string; tone: string }> = [
    { icon: 'flame', label: 'streak', value: `${profile.streak} day${profile.streak === 1 ? '' : 's'}`, title: 'Current day streak', tone: profile.streak > 0 ? 'text-accent-ink' : 'text-muted' },
    { icon: 'star', label: 'xp', value: `${profile.xp} XP`, title: 'Total XP earned', tone: 'text-brand' },
    { icon: 'shield', label: 'level', value: `Level ${profile.level}`, title: 'Current level', tone: 'text-success' },
  ];

  return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-5">
      <span className="text-xs font-extrabold tracking-widest text-muted uppercase">American Sign Language</span>
      <div className="flex flex-wrap items-center gap-3">
        <ul className="flex flex-wrap gap-2" aria-label="Your stats">
          {stats.map((s) => <li key={s.label} title={s.title} className="flex items-center gap-1.5 rounded-full border-2 border-line bg-surface px-3 py-1.5 text-sm font-extrabold"><Icon name={s.icon} size={16} className={s.tone} /><span>{s.value}</span></li>)}
        </ul>
        {profile.email && <button type="button" onClick={handleLogout} className="text-xs font-bold text-muted underline hover:text-ink">Log out</button>}
      </div>
    </div>

    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section aria-label="Learning path">
        <div className="relative overflow-hidden rounded-3xl border-b-8 border-brand-hover bg-brand p-6 text-white sm:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(#fff 1.4px, transparent 1.6px)', backgroundSize: '22px 22px' }} />
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-12 hidden opacity-20 sm:block animate-float"><LogoMark size={220} className="[&_rect]:fill-transparent" /></div>
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold tracking-widest uppercase"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Unit 1 · Getting started</p>
            <h1 className="mt-4 max-w-lg text-3xl leading-tight font-black tracking-tight sm:text-4xl">Let your hands do the <span className="marker-underline text-white">talking</span>.</h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/85">Welcome back, {profile.name}. Twenty-six letters, ten numbers, one camera. Let's pick up where you left off.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/lesson" className="inline-flex items-center gap-2 rounded-xl border-b-4 border-accent-ink/40 bg-accent px-5 py-3 text-sm font-black tracking-wide text-accent-ink uppercase hover:brightness-105 active:translate-y-0.5 active:border-b-2">Start practicing<Icon name="arrowRight" size={16} strokeWidth={2.5} /></Link>
              <Link to="/speed" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-5 py-3 text-sm font-extrabold tracking-wide text-white uppercase hover:bg-white/10">30-second round</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-line px-5 py-4">
          <FingerspellName name={profile.name} />
        </div>

        <Roadmap />

        <p className="mt-6 text-sm leading-relaxed text-muted">More units are on the way — movement, facial grammar and real conversations. For now, hand shapes are where everyone starts.</p>
      </section>

      <aside className="space-y-5" aria-label="Your learning progress">
        <StreakCalendar activeDays={activeDays} streak={profile.streak} />

        <section className="rounded-2xl border-2 border-line bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-extrabold">Your progress</h2>
            <span className="text-sm font-bold text-muted">{profile.xp} XP total</span>
          </div>
          <div className="mt-4"><XpBar profile={profile} /></div>
          <p className="mt-3 text-xs text-muted">Every confirmed sign earns 5 XP. {100 - (profile.xp % 100)} XP to the next level.</p>
          <Link to="/lesson" className="mt-5 flex items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-brand-hover bg-brand py-3 text-center text-sm font-extrabold tracking-wide text-white uppercase hover:bg-brand-hover active:translate-y-0.5 active:border-b-2">Keep learning<Icon name="arrowRight" size={16} /></Link>
          <Link to="/speed" className="mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-line py-3 text-center text-sm font-extrabold tracking-wide text-brand uppercase hover:bg-soft active:translate-y-0.5 active:border-b-2">Speed practice<Icon name="zap" size={16} /></Link>
        </section>

        <section className="rounded-2xl border-2 border-line bg-surface p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink" aria-hidden="true"><Icon name="trophy" size={20} /></span>
            <h2 className="text-lg font-extrabold">Better together</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {profile.verified
              ? 'Your streak and XP are saved to your account and count on the leaderboard.'
              : profile.email
                ? "Your account is real and your progress is saved — verify with Persona to also join the leaderboard."
                : "You're practicing as a guest. XP shows for this session, but nothing is saved. Sign in with Google to create an account."}
          </p>
          <Link to="/leaderboard" className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-brand uppercase hover:underline underline-offset-4">View leaderboard<Icon name="arrowRight" size={16} /></Link>
          {profile.email && !profile.verified && import.meta.env.VITE_PERSONA_TEMPLATE_ID && (
            <div className="mt-5 border-t-2 border-line pt-4"><PersonaGate onVerified={handleVerified} /></div>
          )}
          {!profile.email && (
            <Link to="/onboarding" className="mt-5 flex items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-line py-3 text-center text-sm font-extrabold tracking-wide text-brand uppercase hover:bg-soft">Sign in with Google</Link>
          )}
        </section>

        <section className="rounded-2xl bg-soft p-5">
          <h2 className="font-extrabold">Before you begin</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
            {TIPS.map((tip) => <li key={tip.text} className="flex items-center gap-3"><span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-brand"><Icon name={tip.icon} size={16} /></span>{tip.text}</li>)}
          </ul>
        </section>
      </aside>
    </div>
  </div>;
}
