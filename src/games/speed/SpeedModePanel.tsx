// The mode switcher at the top of the Speed page. Three chips, one per
// clock, each its own URL (/speed?mode=…) so a mode can be linked to and
// so switching remounts the round cleanly.
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { getSpeedBest } from "./speedBests";
import { SPEED_MODES, speedHref, type SpeedMode } from "./modes";

export function SpeedModePanel({ active, disabled = false }: { active: SpeedMode; disabled?: boolean }) {
  return (
    <section className="mt-6 rounded-2xl border-2 border-line bg-surface p-4" aria-labelledby="speed-mode-title">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="speed-mode-title" className="text-sm font-extrabold">Choose your clock</h2>
        <p className="text-xs font-bold text-muted">Shorter rounds are worth more per sign</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-3" aria-label="Speed modes">
        {SPEED_MODES.map((mode) => {
          const selected = mode.id === active.id;
          const best = getSpeedBest(mode.id);
          const body = (
            <>
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-black tracking-wide uppercase">
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${mode.theme.dot}`} />
                  {mode.label}
                </span>
                <span className="text-sm font-black">{mode.seconds}s</span>
              </span>
              <span className="mt-1 flex items-center justify-between gap-2 text-xs font-bold">
                <span className={selected ? "" : "text-muted"}>{mode.tagline}</span>
                <span className={selected ? "" : "text-muted"}>×{mode.multiplier}</span>
              </span>
              <span className="mt-2 flex items-center gap-1 text-[11px] font-bold text-muted">
                <Icon name="star" size={12} />
                {best ? `Best ${best.score} · ${best.signs} signs` : "No run yet"}
              </span>
            </>
          );

          const shared = "flex w-full flex-col rounded-xl border-2 border-b-4 px-3.5 py-3 text-left transition-[transform,border-color,background-color] motion-reduce:transition-none";

          return (
            <li key={mode.id}>
              {disabled ? (
                <span aria-current={selected ? "true" : undefined} className={`${shared} ${selected ? mode.theme.chip : "border-line bg-surface opacity-60"}`}>
                  {body}
                </span>
              ) : (
                <Link
                  to={speedHref(mode)}
                  aria-current={selected ? "true" : undefined}
                  aria-label={`${mode.label} mode, ${mode.seconds} seconds, ${mode.multiplier} times points`}
                  className={`${shared} ${selected ? mode.theme.chip : "border-line bg-surface hover:-translate-y-0.5 hover:bg-soft"} active:translate-y-0.5 active:border-b-2`}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
