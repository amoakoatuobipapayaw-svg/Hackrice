// End of a Practice level. Same card language as RoundComplete (which Speed
// and Math still use) with the one thing a levelled mode needs: a Continue
// button straight into the level this round just unlocked.
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import type { RoundResult, UserProfile } from "../../lib/contracts";
import { levelHref, type PracticeLevel } from "./levels";

export function LevelResults({ level, next, result, profile, skipped, onRetry }: {
  level: PracticeLevel;
  next?: PracticeLevel;
  result: RoundResult;
  profile: UserProfile;
  skipped: number;
  onRetry: () => void;
}) {
  return (
    <section className="mx-auto max-w-xl overflow-hidden rounded-2xl border-2 border-line bg-surface text-center" aria-labelledby="level-result-title">
      <div className="bg-soft px-6 pt-10 pb-8">
        <div aria-hidden="true" className="mx-auto flex h-20 w-20 -rotate-3 items-center justify-center rounded-2xl border-b-4 border-accent-ink/40 bg-accent text-accent-ink">
          <Icon name="check" size={40} strokeWidth={3} />
        </div>
        <p className="mt-6 text-xs font-extrabold tracking-widest text-brand uppercase">Level {level.number} complete</p>
        <h2 id="level-result-title" className="mt-3 text-3xl font-black tracking-tight">{level.title}, done.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {skipped > 0
            ? `You confirmed ${result.correct} of ${result.total} and skipped ${skipped}. Skipped shapes come around again — replay the level whenever you want them.`
            : next
              ? `Every shape confirmed. Level ${next.number} is open: ${next.poolLabel} waiting for you.`
              : "Every shape confirmed, across the whole alphabet and every digit. That's the full map."}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-3 gap-3">
          {[["XP earned", `+${result.xp}`], ["Confirmed", `${result.correct}/${result.total}`], ["Score", `${result.score}`]].map(([label, value]) => (
            <div key={label} className="rounded-2xl border-2 border-line py-4">
              <p className="text-xs font-extrabold tracking-wide text-muted uppercase">{label}</p>
              <p className="mt-2 text-2xl font-black text-brand">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-muted">Level {profile.level} · {profile.xp} total XP · {profile.streak} day streak</p>

        <div className="mt-7 flex flex-col gap-3">
          {next ? (
            <Link
              to={levelHref(next)}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-brand-hover bg-brand px-5 py-3.5 font-extrabold text-white hover:bg-brand-hover active:translate-y-0.5 active:border-b-2"
            >
              Continue to Level {next.number}: {next.title}
              <Icon name="arrowRight" size={18} />
            </Link>
          ) : (
            <Link
              to="/speed"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-brand-hover bg-brand px-5 py-3.5 font-extrabold text-white hover:bg-brand-hover active:translate-y-0.5 active:border-b-2"
            >
              Put it to the test in Speed
              <Icon name="zap" size={18} />
            </Link>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onRetry} className="flex-1 rounded-xl border-2 border-b-4 border-line bg-surface px-5 py-3 font-extrabold hover:bg-soft active:translate-y-0.5 active:border-b-2">
              Practice this level again
            </button>
            <Link to="/lesson" className="flex-1 rounded-xl border-2 border-b-4 border-line bg-surface px-5 py-3 font-extrabold hover:bg-soft active:translate-y-0.5 active:border-b-2">
              Back to your level map
            </Link>
          </div>
        </div>
        <Link to="/" className="mt-5 inline-block text-sm text-muted underline underline-offset-4">Back to your journey</Link>
      </div>
    </section>
  );
}
