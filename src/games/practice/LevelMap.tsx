// The level map beside the Practice home. Finished levels get a tick,
// the next one is highlighted, and a locked level is a button rather than a
// link: pressing it explains why it can't be opened yet instead of silently
// doing nothing.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { LEVEL_COUNT, LEVELS, levelHref, type PracticeLevel } from "./levels";
import { highestCompletedLevel, isLevelUnlocked } from "./practiceProgress";

const NOTICE_MS = 5000;

export function LevelMap({ activeLevel, completed = highestCompletedLevel() }: {
  activeLevel?: number;
  completed?: number;
}) {
  const navigate = useNavigate();
  const [locked, setLocked] = useState<PracticeLevel | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlocked = Math.min(completed + 1, LEVEL_COUNT);

  // One live notice at a time, and never one left behind after unmount.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function refuse(level: PracticeLevel) {
    if (timer.current) clearTimeout(timer.current);
    setLocked(level);
    timer.current = setTimeout(() => setLocked(null), NOTICE_MS);
  }

  return (
    <section className="rounded-2xl border-2 border-line bg-surface p-5" aria-labelledby="level-map-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="level-map-title" className="text-lg font-extrabold">Your level map</h2>
        <span className="text-sm font-bold text-muted">{unlocked} of {LEVEL_COUNT}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Levels unlocked"
        aria-valuemin={0}
        aria-valuemax={LEVEL_COUNT}
        aria-valuenow={unlocked}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-soft"
      >
        <div className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${(unlocked / LEVEL_COUNT) * 100}%` }} />
      </div>

      <ol className="relative mt-5 space-y-2.5" aria-label="Practice levels">
        {LEVELS.map((level, i) => {
          const open = isLevelUnlocked(level.number, completed);
          const done = completed >= level.number;
          const active = activeLevel === level.number;
          const shared = "group relative flex w-full items-center gap-3 rounded-xl border-2 border-b-4 p-3 text-left transition-[transform,border-color,background-color] active:translate-y-0.5 active:border-b-2 motion-reduce:transition-none";
          const node = done
            ? "border-success/60 bg-success text-white"
            : open
              ? "border-brand-hover bg-brand text-white"
              : "border-line bg-soft text-muted";

          return (
            <li key={level.number}>
              {i < LEVELS.length - 1 && <span aria-hidden="true" className="absolute left-[27px] -z-0 h-2.5 w-1 translate-y-[2px] border-l-4 border-dotted border-line" />}
              {open ? (
                <button
                  type="button"
                  onClick={() => { setLocked(null); navigate(levelHref(level)); }}
                  aria-current={active ? "step" : undefined}
                  className={`${shared} ${active ? "border-selected-line bg-selected" : "border-line bg-surface hover:-translate-y-0.5 hover:border-selected-line hover:bg-selected"}`}
                >
                  <LevelNode className={node}>{done ? <Icon name="check" size={18} strokeWidth={3} /> : level.number}</LevelNode>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold tracking-widest text-muted uppercase">
                      Level {level.number}{done ? " · complete" : active ? " · next up" : ""}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-extrabold">{level.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{level.poolLabel}</span>
                  </span>
                  <Icon name="arrowRight" size={18} className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand motion-reduce:transition-none" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => refuse(level)}
                  aria-describedby={locked?.number === level.number ? "level-locked-notice" : undefined}
                  className={`${shared} border-line bg-soft/70 hover:bg-soft`}
                >
                  <LevelNode className={node}><Icon name="lock" size={16} /></LevelNode>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold tracking-widest text-muted uppercase">Level {level.number} · locked</span>
                    <span className="mt-0.5 block truncate text-sm font-extrabold text-muted">{level.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{level.poolLabel}</span>
                  </span>
                  <Icon name="lock" size={16} className="text-muted" />
                </button>
              )}

              {locked?.number === level.number && (
                <p
                  id="level-locked-notice"
                  role="alert"
                  className="mt-2 flex items-start gap-2 rounded-xl border-2 border-accent bg-accent/20 px-3 py-2.5 text-xs leading-relaxed font-bold text-accent-ink"
                >
                  <Icon name="lock" size={14} className="mt-0.5" />
                  <span>
                    No access yet — finish Level {level.number - 1} to unlock {level.title}.
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Finish a level to open the next one. Levels you've cleared stay open — go back any time.
      </p>
    </section>
  );
}

function LevelNode({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span aria-hidden="true" className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-b-4 text-sm font-black ring-4 ring-surface ${className}`}>
      {children}
    </span>
  );
}
