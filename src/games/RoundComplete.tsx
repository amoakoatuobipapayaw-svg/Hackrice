// Shared end-of-round summary for all three modes: grade, score, accuracy,
// best combo, XP earned, updated totals, and where to go next.
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import type { RoundResult, UserProfile } from "../lib/contracts";
import { accuracy, gradeForAccuracy, type RoundStats } from "./scoring";

type RoundCompleteProps = {
  result: RoundResult;
  stats: RoundStats;
  profile: UserProfile;
  onRetry: () => void;
  /** True while completeRound() is still syncing XP/streak. */
  saving?: boolean;
};

const MODE_TITLES: Record<RoundResult["mode"], string> = {
  lesson: "Lesson complete",
  speed: "Time's up",
  math: "Math round complete",
};

export function RoundComplete({ result, stats, profile, onRetry, saving = false }: RoundCompleteProps) {
  const pct = accuracy(result);
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{MODE_TITLES[result.mode]}</p>
      <h2 className="mt-1 text-3xl font-black">{gradeForAccuracy(pct)}</h2>

      <dl className="mt-6 grid grid-cols-3 gap-2">
        <Metric label="Score" value={result.score} />
        <Metric label="Accuracy" value={`${Math.round(pct * 100)}%`} hint={`${result.correct}/${result.total}`} />
        <Metric label="Best combo" value={stats.bestCombo} />
      </dl>

      <p className="mt-6 text-2xl font-bold text-violet-300" aria-live="polite">
        +{result.xp} XP
      </p>
      <p className="mt-1 text-sm text-slate-400">
        {saving ? (
          "Saving your progress…"
        ) : (
          <>
            Level {profile.level} · {profile.xp} XP total · 🔥 {profile.streak} day streak
          </>
        )}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onRetry} autoFocus>
          Play again
        </Button>
        <Link to="/">
          <Button variant="secondary">Choose a mode</Button>
        </Link>
        <Link to="/leaderboard">
          <Button variant="ghost">Leaderboard</Button>
        </Link>
      </div>
    </Card>
  );
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl bg-slate-800/60 px-2 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-xl font-bold tabular-nums">{value}</dd>
      {hint && <dd className="text-[11px] text-slate-500">{hint}</dd>}
    </div>
  );
}
