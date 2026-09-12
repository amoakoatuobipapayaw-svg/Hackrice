import { Icon } from "../components/ui/Icon";
import type { UserProfile } from "../lib/contracts";

const XP_PER_LEVEL = 100;

/** Small streak pill: flame icon + "N days". */
export function StreakBadge({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-soft px-4 py-2 text-sm font-bold">
      <Icon name="flame" size={16} className="text-brand" />
      <span>
        {profile.streak} day{profile.streak === 1 ? "" : "s"}
      </span>
    </div>
  );
}

/** XP progress bar for the current level. */
export function XpBar({ profile }: { profile: UserProfile }) {
  const xpIntoLevel = profile.xp % XP_PER_LEVEL;
  const pct = Math.min(100, (xpIntoLevel / XP_PER_LEVEL) * 100);

  return (
    <div className="w-full">
      <div className="mb-1.5 flex justify-between text-xs font-bold text-muted">
        <span>Level {profile.level}</span>
        <span>
          {xpIntoLevel} / {XP_PER_LEVEL} XP
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Level ${profile.level} progress`}
        aria-valuemin={0}
        aria-valuemax={XP_PER_LEVEL}
        aria-valuenow={xpIntoLevel}
        className="h-3 w-full overflow-hidden rounded-full bg-soft"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Given total XP, derive the level (100 XP per level, matches XpBar). */
export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
