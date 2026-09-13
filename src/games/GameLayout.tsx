import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';

export function GameLayout({ mode, title, description, progress = 0, progressLabel, children, backTo = '/', backLabel = 'Back to your journey', progressClass = 'bg-brand', headerAside, footnote = 'No timers on your learning. Practice at your own pace.', hero }: {
  mode?: string; title?: string; description?: string; progress?: number; progressLabel?: string; children: ReactNode;
  /** Where the top-left link goes — a level page returns to its map, not all the way home. */
  backTo?: string; backLabel?: string;
  /** Lets a themed mode (Speed's easy/medium/hard) colour its own progress bar. */
  progressClass?: string;
  /** Optional block rendered under the description, above the progress bar. */
  headerAside?: ReactNode;
  /** The closing line. Speed overrides it — a countdown is the one place
   * "no timers on your learning" isn't true. */
  footnote?: ReactNode;
  /** A fully custom header (e.g. a colored banner) instead of the plain
   * mode/title/description/progress block — for a content page that isn't
   * really "in a round" and wants to look distinct, not generic. */
  hero?: ReactNode;
}) {
  return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <Link to={backTo} className="inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4"><Icon name="arrowLeft" size={16} />{backLabel}</Link>

    </div>
    {hero ?? (title && (
      <header className="mb-7">
        {mode && <p className="inline-flex items-center gap-2 text-xs font-extrabold tracking-widest text-brand uppercase"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />{mode}</p>}
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{description}</p>}
        {headerAside}
        {progressLabel && (
          <div className="mt-6 flex items-center gap-4">
            <div role="progressbar" aria-label={progressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} className="h-3 flex-1 overflow-hidden rounded-full bg-soft">
              <div className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${progressClass}`} style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
            </div>
            <span className="text-sm font-extrabold text-muted">{progressLabel}</span>
          </div>
        )}
      </header>
    ))}
    {children}
    <p className="mt-7 text-center text-xs leading-relaxed text-muted">{footnote}</p>
  </div>;
}

export function ProfileGate() {
  return <GameLayout mode="Welcome" title="Your next skill starts here." description="Learn five hand shapes, build a rhythm, and put your numbers into practice." progress={0} progressLabel="Ready when you are">
    <div className="rounded-2xl border-2 border-line bg-surface p-8 text-center sm:p-14">
      <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Icon name="sparkles" size={32} /></span>
      <h2 className="mt-5 text-2xl font-bold">Make this journey yours</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">Choose a name to keep your practice progress and XP together. You can set up your camera when you’re ready.</p>
      <Link to="/onboarding" className="mt-7 inline-flex items-center gap-2 rounded-xl border-2 border-b-4 border-brand-hover bg-brand px-7 py-3 font-extrabold text-white hover:bg-brand-hover active:translate-y-0.5 active:border-b-2">Choose your name<Icon name="arrowRight" size={18} /></Link>
    </div>
  </GameLayout>;
}
