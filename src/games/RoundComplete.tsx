import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import type { RoundResult, UserProfile } from '../lib/contracts';
import { unitHref, type Unit } from './signCatalog';

/** `nextUnit`, when passed, is a unit that just unlocked as a direct result
 * of this round finishing — offering a one-click path into it instead of
 * making the learner navigate back to the roadmap and find it themselves. */
export function RoundComplete({ result, profile, onRetry, nextUnit }: { result: RoundResult; profile: UserProfile; onRetry: () => void; nextUnit?: Unit }) {
  return <section className="mx-auto max-w-xl overflow-hidden rounded-2xl border-2 border-line bg-surface text-center" aria-labelledby="round-title">
    <div className="bg-soft px-6 pt-10 pb-8"><div aria-hidden="true" className="mx-auto flex h-20 w-20 -rotate-3 items-center justify-center rounded-2xl border-b-4 border-accent-ink/40 bg-accent text-accent-ink"><Icon name="check" size={40} strokeWidth={3} /></div><p className="mt-6 text-xs font-extrabold tracking-widest text-brand uppercase">Practice complete</p><h2 id="round-title" className="mt-3 text-3xl font-black tracking-tight">Look what your hands can do.</h2><p className="mt-3 text-sm text-muted">{result.correct > 0 ? 'You made progress. Keep that momentum going.' : 'Every attempt is practice. Try again at your own pace.'}</p></div>
    <div className="p-6 sm:p-8"><div className="grid grid-cols-3 gap-3">{[['XP earned', `+${result.xp}`], ['Confirmed', `${result.correct}`], ['Score', `${result.score}`]].map(([label, value]) => <div key={label} className="rounded-2xl border-2 border-line py-4"><p className="text-xs font-extrabold tracking-wide text-muted uppercase">{label}</p><p className="mt-2 text-2xl font-black text-brand">{value}</p></div>)}</div><p className="mt-5 text-sm text-muted">Level {profile.level} · {profile.xp} total XP · {profile.streak} day streak</p>
    {nextUnit && <Link to={unitHref(nextUnit)} className="mt-7 flex items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-success/60 bg-success px-5 py-3 font-extrabold text-white hover:brightness-105 active:translate-y-0.5 active:border-b-2">Continue to "{nextUnit.title}"<Icon name="arrowRight" size={18} /></Link>}
    <div className="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onRetry} className={`flex-1 rounded-xl border-2 border-b-4 px-5 py-3 font-extrabold active:translate-y-0.5 active:border-b-2 ${nextUnit ? 'border-line bg-surface hover:bg-soft' : 'border-brand-hover bg-brand text-white hover:bg-brand-hover'}`}>Practice again</button><Link to="/leaderboard" className="flex-1 rounded-xl border-2 border-b-4 border-line bg-surface px-5 py-3 font-extrabold hover:bg-soft active:translate-y-0.5 active:border-b-2">View leaderboard</Link></div><Link to="/" className="mt-5 inline-block text-sm text-muted underline underline-offset-4">Back to your journey</Link></div>
  </section>;
}
