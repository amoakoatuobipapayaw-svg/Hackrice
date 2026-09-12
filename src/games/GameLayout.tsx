import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';

export function GameLayout({ mode, title, description, progress, progressLabel, children }: {
  mode: string; title: string; description: string; progress: number; progressLabel: string; children: ReactNode;
}) {
  return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <Link to="/" className="rounded-lg text-sm font-semibold text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4">← Back to your journey</Link>
      <nav aria-label="Practice modes" className="flex gap-1 rounded-2xl border border-slate-800 bg-slate-900 p-1">
        {([['/lesson', 'Learn'], ['/speed', 'Speed'], ['/math', 'Math']] as const).map(([to, name]) => <NavLink key={to} to={to} className={({ isActive }) => `rounded-xl px-4 py-2.5 text-sm font-bold ${isActive ? 'bg-violet-500 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}>{name}</NavLink>)}
      </nav>
    </div>
    <header className="mb-7">
      <p className="text-xs font-bold tracking-[0.2em] text-emerald-300 uppercase">SignQuest studio / {mode}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">{description}</p>
      <div className="mt-6 flex items-center gap-4">
        <div role="progressbar" aria-label={progressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-emerald-400 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
        </div>
        <span className="text-sm font-bold text-slate-300">{progressLabel}</span>
      </div>
    </header>
    {children}
    <p className="mt-7 text-center text-xs leading-relaxed text-slate-400">A little practice. A new way to connect. · One hand at a time.</p>
  </div>;
}

export function ProfileGate() {
  return <GameLayout mode="Welcome" title="Your next skill starts here." description="Learn five hand shapes, build a rhythm, and put your numbers into practice." progress={0} progressLabel="Ready when you are">
    <div className="rounded-3xl border border-slate-700 bg-slate-900 p-8 text-center sm:p-14">
      <span aria-hidden="true" className="text-5xl">✦</span>
      <h2 className="mt-5 text-2xl font-bold">Make this journey yours</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-300">Choose a name to keep your practice progress and XP together. You can set up your camera when you’re ready.</p>
      <Link to="/onboarding" className="mt-7 inline-block rounded-2xl border-b-4 border-violet-800 bg-violet-500 px-7 py-3 font-bold text-white hover:bg-violet-400">Choose your name →</Link>
    </div>
  </GameLayout>;
}
