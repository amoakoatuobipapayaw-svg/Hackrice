import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/ui/Icon';
import { getActivityDays } from '../lib/activityLog';
import { getLocalProfile, saveLocalProfile } from '../lib/localProfile';
import { syncProfile } from '../lib/supabase';
import { PersonaGate } from '../meta/PersonaGate';
import { StreakCalendar } from '../meta/StreakCalendar';
import { XpBar } from '../meta/StreakXp';

const ACTIVITIES: Array<{ to: string; icon: IconName; title: string; detail: string; tag: string; meta: string }> = [
  { to: '/lesson', icon: 'hand', title: 'Your first five signs', detail: 'Learn I, L, V, W and Y with a step-by-step guide and live camera feedback.', tag: 'Start here', meta: '5 signs · Guided' },
  { to: '/math', icon: 'plus', title: 'Count on your hands', detail: 'Solve five small puzzles and answer by signing the number or saying it out loud.', tag: 'Math practice', meta: '5 puzzles · Numbers 1–9' },
  { to: '/speed', icon: 'zap', title: 'Find your rhythm', detail: 'Thirty seconds on the clock. Chain confirmed signs together for combo points.', tag: 'Speed practice', meta: '30 seconds · Timed' },
];

const TIPS: Array<{ icon: IconName; text: string }> = [
  { icon: 'sun', text: 'Face a window or a soft light.' },
  { icon: 'hand', text: 'Keep your whole hand in view.' },
  { icon: 'timer', text: 'Hold each sign for one second.' },
];

export function Home() {
  const [profile, setProfile] = useState(getLocalProfile);
  const [activeDays] = useState(getActivityDays);
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
  const stats: Array<{ icon: IconName; label: string; value: string; title: string; tone: string }> = [
    { icon: 'flame', label: 'streak', value: `${profile.streak} day${profile.streak === 1 ? '' : 's'}`, title: 'Current day streak', tone: 'text-brand' },
    { icon: 'star', label: 'xp', value: `${profile.xp} XP`, title: 'Total XP earned', tone: 'text-brand' },
    { icon: 'shield', label: 'level', value: `Level ${profile.level}`, title: 'Current level', tone: 'text-muted' },
  ];

  return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-5">
      <span className="text-xs font-extrabold tracking-widest text-muted uppercase">American Sign Language</span>
      <ul className="flex flex-wrap gap-2" aria-label="Your stats">
        {stats.map((s) => <li key={s.label} title={s.title} className="flex items-center gap-1.5 rounded-full border-2 border-line bg-surface px-3 py-1.5 text-sm font-extrabold"><Icon name={s.icon} size={16} className={s.tone} /><span>{s.value}</span></li>)}
      </ul>
    </div>

    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section aria-label="Learning path">
        <div className="flex items-center justify-between gap-6 rounded-2xl border-b-4 border-brand-hover bg-brand p-6 text-white sm:p-8">
          <div>
            <p className="text-xs font-extrabold tracking-widest uppercase opacity-90">Unit 1 · Getting started</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Let your hands do the talking</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed opacity-90">Build confidence with letters and numbers. Welcome back, {profile.name}.</p>
          </div>
          <span aria-hidden="true" className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex"><Icon name="hand" size={40} strokeWidth={1.75} /></span>
        </div>

        <ol className="relative mt-8 space-y-4" aria-label="Practice modes">
          {ACTIVITIES.map((activity, i) => <li key={activity.to} className="relative flex gap-5">
            {i < ACTIVITIES.length - 1 && <span aria-hidden="true" className="absolute top-14 -bottom-4 left-[26px] w-1 rounded-full bg-line" />}
            <span aria-hidden="true" className={`relative z-10 mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-b-4 ${i === 0 ? 'border-brand-hover bg-brand text-white ring-4 ring-brand-soft' : 'border-line bg-surface text-brand ring-4 ring-canvas'}`}><Icon name={activity.icon} size={24} /></span>
            <Link to={activity.to} className="group flex min-w-0 flex-1 items-center justify-between gap-4 rounded-2xl border-2 border-b-4 border-line bg-surface p-5 transition-colors hover:border-selected-line hover:bg-selected active:translate-y-0.5 active:border-b-2">
              <span className="min-w-0">
                <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase ${i === 0 ? 'bg-brand-soft text-brand' : 'bg-soft text-muted'}`}>{activity.tag}</span>
                <span className="mt-2 block text-lg font-extrabold">{activity.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{activity.detail}</span>
                <span className="mt-2 block text-xs font-bold text-muted">{activity.meta}</span>
              </span>
              <Icon name="arrowRight" size={22} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand motion-reduce:transition-none" />
            </Link>
          </li>)}
        </ol>

        <div className="mt-6 flex items-start gap-4 rounded-2xl border-2 border-dashed border-line p-5">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft text-muted"><Icon name="sparkles" size={20} /></span>
          <div><h2 className="font-extrabold">One step at a time</h2><p className="mt-1 text-sm leading-relaxed text-muted">Start with hand shapes. Movement and conversation lessons are still to come.</p></div>
        </div>
      </section>

      <aside className="space-y-5" aria-label="Your learning progress">
        <StreakCalendar activeDays={activeDays} streak={profile.streak} />

        <section className="rounded-2xl border-2 border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-lg font-extrabold">Your progress</h2><p className="mt-1 text-sm text-muted">Every confirmed sign earns 5 XP.</p></div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand" aria-hidden="true"><Icon name="star" size={22} /></span>
          </div>
          <div className="mt-5"><XpBar profile={profile} /></div>
          <Link to="/lesson" className="mt-5 flex items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-brand-hover bg-brand py-3 text-center text-sm font-extrabold tracking-wide text-white uppercase hover:bg-brand-hover active:translate-y-0.5 active:border-b-2">Keep learning<Icon name="arrowRight" size={16} /></Link>
        </section>

        <section className="rounded-2xl border-2 border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-lg font-extrabold">Better together</h2></div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand" aria-hidden="true"><Icon name="trophy" size={22} /></span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{profile.verified ? 'Your streak and XP are saved to your account and count on the leaderboard.' : "You're practicing as a guest. XP shows for this session, but nothing is saved. Verify once to create your account, save your streak, and join the leaderboard."}</p>
          <Link to="/leaderboard" className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-brand uppercase hover:underline underline-offset-4">View leaderboard<Icon name="arrowRight" size={16} /></Link>
          {!profile.verified && import.meta.env.VITE_PERSONA_TEMPLATE_ID && <div className="mt-5 border-t-2 border-line pt-4"><PersonaGate onVerified={handleVerified} /></div>}
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
