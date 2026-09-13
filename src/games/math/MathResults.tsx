// End-of-round screen for Math Lab games. Same visual grammar as the team's
// RoundComplete, plus the tier, accuracy, best combo and personal best —
// the things a player wants to beat next time.
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import type { RoundResult, UserProfile } from "../../lib/contracts";
import { DifficultyBadge } from "./DifficultyBadge";
import { accuracy, verdict, type MathRoundStats } from "./scoring";
import type { MathGameDef } from "./types";

type MathResultsProps = {
  game: MathGameDef;
  result: RoundResult;
  stats: MathRoundStats;
  profile: UserProfile;
  isPersonalBest: boolean;
  saving: boolean;
  onRetry: () => void;
};

export function MathResults({ game, result, stats, profile, isPersonalBest, saving, onRetry }: MathResultsProps) {
  const pct = Math.round(accuracy(stats) * 100);
  return (
    <section className="mx-auto max-w-xl overflow-hidden rounded-2xl border-2 border-line bg-surface text-center" aria-labelledby="math-results-title">
      <div className="bg-soft px-6 pt-10 pb-8">
        <div aria-hidden="true" className="mx-auto flex h-20 w-20 -rotate-3 items-center justify-center rounded-2xl border-b-4 border-accent-ink/40 bg-accent text-accent-ink">
          <Icon name={pct === 100 ? "trophy" : "check"} size={40} strokeWidth={3} />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2">
          <p className="text-xs font-extrabold tracking-widest text-brand uppercase">{game.title}</p>
          <DifficultyBadge difficulty={game.difficulty} />
        </div>
        <h2 id="math-results-title" className="mt-3 text-3xl font-black tracking-tight">
          {verdict(stats)}
        </h2>
        <p className="mt-3 text-sm text-muted">
          {isPersonalBest ? "New personal best for this game." : stats.correct > 0 ? "You made progress. Keep that momentum going." : "Every attempt is practice. Try again at your own pace."}
        </p>
      </div>
      <div className="p-6 sm:p-8">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["XP earned", `+${result.xp}`],
            ["Score", `${result.score}`],
            ["Accuracy", `${pct}%`],
            ["Best combo", `${stats.bestCombo}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border-2 border-line py-4">
              <dt className="text-xs font-extrabold tracking-wide text-muted uppercase">{label}</dt>
              <dd className="mt-2 text-2xl font-black text-brand">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm text-muted" aria-live="polite">
          {saving ? "Saving your progress…" : `Level ${profile.level} · ${profile.xp} total XP · ${profile.streak} day streak`}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onRetry} autoFocus className="flex-1 rounded-xl border-2 border-b-4 border-brand-hover bg-brand px-5 py-3 font-extrabold text-white hover:bg-brand-hover active:translate-y-0.5 active:border-b-2">
            Play again
          </button>
          <Link to="/math" className="flex-1 rounded-xl border-2 border-b-4 border-line bg-surface px-5 py-3 font-extrabold hover:bg-soft active:translate-y-0.5 active:border-b-2">
            All games
          </Link>
          <Link to="/leaderboard" className="flex-1 rounded-xl border-2 border-b-4 border-line bg-surface px-5 py-3 font-extrabold hover:bg-soft active:translate-y-0.5 active:border-b-2">
            Leaderboard
          </Link>
        </div>
      </div>
    </section>
  );
}
