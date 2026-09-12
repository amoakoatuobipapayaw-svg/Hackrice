import { useState } from "react";
import { Icon } from "../components/ui/Icon";
import { toDayKey } from "../lib/activityLog";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type DayState = "active" | "missed" | "future" | "idle";

/**
 * Month grid in the LeetCode style: a check on every day the app was used,
 * an X on every day it wasn't (only once the user has a first active day —
 * we don't punish the days before they joined), and plain numbers for the
 * future. Reads the day set from lib/activityLog.ts.
 */
export function StreakCalendar({ activeDays, streak, today = new Date() }: {
  activeDays: Set<string>;
  streak: number;
  today?: Date;
}) {
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const todayKey = toDayKey(today);
  const firstActive = [...activeDays].sort()[0] ?? todayKey;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function stateFor(key: string): DayState {
    if (activeDays.has(key)) return "active";
    if (key > todayKey) return "future";
    if (key < firstActive) return "idle";
    return "missed";
  }

  const cells: Array<{ key: string; day: number; state: DayState } | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const key = toDayKey(new Date(year, month, i + 1));
      return { key, day: i + 1, state: stateFor(key) };
    }),
  ];

  const activeThisMonth = cells.filter((c) => c?.state === "active").length;

  return (
    <section className="rounded-2xl border-2 border-line bg-surface p-5" aria-labelledby="streak-calendar-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="streak-calendar-title" className="text-lg font-extrabold">Your streak</h2>
          <p className="mt-1 text-sm text-muted">
            {streak > 0 ? `${streak} day${streak === 1 ? "" : "s"} in a row. Keep it going.` : "Practice today to start a streak."}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand" aria-hidden="true">
          <Icon name="flame" size={22} />
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink"
          aria-label="Previous month"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <p className="text-sm font-extrabold" aria-live="polite">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          disabled={isCurrentMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next month"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`Activity for ${monthLabel}`}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-1 text-[11px] font-extrabold tracking-wide text-muted" aria-hidden="true">{d}</span>
        ))}
        {cells.map((cell, i) =>
          cell === null ? (
            <span key={`blank-${i}`} aria-hidden="true" />
          ) : (
            <span
              key={cell.key}
              role="gridcell"
              aria-label={`${cell.day}: ${labelFor(cell.state)}`}
              title={`${cell.key} · ${labelFor(cell.state)}`}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${classFor(cell.state, cell.key === todayKey)}`}
            >
              {cell.state === "active" ? <Icon name="check" size={16} strokeWidth={3} /> : cell.state === "missed" ? <Icon name="x" size={14} strokeWidth={3} /> : cell.day}
            </span>
          ),
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-line pt-4 text-xs text-muted">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-success" aria-hidden="true" />Practiced</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-danger" aria-hidden="true" />Missed</span>
        </span>
        <span className="font-bold">{activeThisMonth} day{activeThisMonth === 1 ? "" : "s"} this month</span>
      </div>
    </section>
  );
}

function labelFor(state: DayState): string {
  return state === "active" ? "practiced" : state === "missed" ? "missed" : state === "future" ? "upcoming" : "before you joined";
}

function classFor(state: DayState, isToday: boolean): string {
  const ring = isToday ? " ring-2 ring-brand ring-offset-2 ring-offset-surface" : "";
  switch (state) {
    case "active":
      return `bg-success text-white${ring}`;
    case "missed":
      return `bg-danger-soft text-danger${ring}`;
    case "future":
      return `text-muted/60${ring}`;
    default:
      return `text-muted/40${ring}`;
  }
}
