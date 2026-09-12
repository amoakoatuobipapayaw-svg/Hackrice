// Live in-round numbers: score, combo/multiplier, optional countdown, and a
// floating "+N" whenever a rep lands. One component so all modes feel alike.
import { useEffect, useState, type ReactNode } from "react";
import { comboMultiplier, repsToNextTier, type RoundStats } from "./scoring";

type ScoreHudProps = {
  stats: RoundStats;
  /** Seconds left; omit for untimed modes. */
  secondsLeft?: number;
  /** Tints the timer once it drops to this many seconds. */
  urgentAt?: number;
};

export function ScoreHud({ stats, secondsLeft, urgentAt = 5 }: ScoreHudProps) {
  const multiplier = comboMultiplier(stats.combo);
  const toNext = repsToNextTier(stats.combo);
  // Each rep produces a new (total, score) pair; show its gain until dismissed.
  const popupKey = `${stats.total}:${stats.score}`;
  const [dismissedKey, setDismissedKey] = useState("");
  const popup = stats.lastPoints > 0 && popupKey !== dismissedKey ? { points: stats.lastPoints, key: popupKey } : null;
  const visibleKey = popup?.key ?? null;
  useEffect(() => {
    if (visibleKey === null) return;
    const id = setTimeout(() => setDismissedKey(visibleKey), 900);
    return () => clearTimeout(id);
  }, [visibleKey]);

  return (
    <div className="grid grid-cols-3 gap-2 text-center" aria-label="Score">
      <Stat label="Score">
        <span className="relative inline-block">
          {stats.score}
          {popup && (
            <span
              key={popup.key}
              className="absolute -right-10 top-1 animate-bounce text-sm font-bold text-emerald-300"
              aria-live="polite"
            >
              +{popup.points}
            </span>
          )}
        </span>
      </Stat>
      <Stat label="Combo" hint={toNext ? `${toNext} more for x${comboMultiplier(stats.combo + toNext)}` : "max!"}>
        <span className={stats.combo >= 3 ? "text-amber-300" : ""}>
          {stats.combo}
          <span className="ml-1 text-sm font-semibold text-slate-400">x{multiplier}</span>
        </span>
      </Stat>
      {secondsLeft === undefined ? (
        <Stat label="Correct">
          {stats.correct}/{stats.total}
        </Stat>
      ) : (
        <Stat label="Time">
          <span className={secondsLeft <= urgentAt ? "text-red-400" : ""} role="timer" aria-live="off">
            {secondsLeft}s
          </span>
        </Stat>
      )}
    </div>
  );
}

function Stat({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{children}</p>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
