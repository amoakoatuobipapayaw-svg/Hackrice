// The unit path shown on Home, styled to match the tone-based Icon list
// pattern introduced alongside it (see Home.tsx's stats/activity styling).
// Units come from signCatalog's UNITS list; lock state is sequential —
// finishing one unit (profile.completedUnits) unlocks the next.
import { Link } from "react-router-dom";
import { Icon, type IconName } from "../components/ui/Icon";
import { getLocalProfile } from "../lib/localProfile";
import { isUnitUnlocked, unitHref, UNITS, type Unit } from "./signCatalog";
import { hasSeenWelcome } from "./welcomeProgress";

type Tone = "brand" | "accent" | "success";
const TONES: readonly Tone[] = ["brand", "accent", "success"];
const NODE: Record<Tone, string> = {
  brand: "border-brand-hover bg-brand text-white",
  accent: "border-accent-ink/40 bg-accent text-accent-ink",
  success: "border-success/60 bg-success text-white",
};
const TAG: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  accent: "bg-accent/30 text-accent-ink",
  success: "bg-success-soft text-success",
};

function unitIcon(unit: Unit): IconName {
  if (unit.kind === "content") return "bookOpen";
  return unit.vocabulary === "numbers" ? "plus" : "hand";
}

export function Roadmap() {
  const profile = getLocalProfile();
  const unlockedCount = UNITS.filter((unit) => isUnitUnlocked(unit, profile)).length;
  return (
    <>
      <ol className="relative mt-8 space-y-4" aria-label="Course roadmap">
        {UNITS.map((unit, i) => {
          const unlocked = isUnitUnlocked(unit, profile);
          const tone = TONES[i % TONES.length];
          const seen = unit.kind === "content" && hasSeenWelcome();
          const tag = seen ? "Read" : unlocked ? `Unit ${i + 1}` : "Locked";
          const detail = unlocked ? unit.signs.join(" · ") : `Finish "${UNITS[i - 1].title}" to unlock`;
          return (
            <li key={unit.id} className="relative flex gap-5">
              {i < UNITS.length - 1 && <span aria-hidden="true" className="absolute top-14 -bottom-4 left-[26px] w-1 rounded-full border-l-4 border-dotted border-line" />}
              <span aria-hidden="true" className={`relative z-10 mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-b-4 ring-4 ring-canvas ${unlocked ? NODE[tone] : "border-line bg-surface text-muted"}`}>
                <Icon name={unlocked ? unitIcon(unit) : "lock"} size={unlocked ? 24 : 20} strokeWidth={unlocked ? 2.5 : 2} />
              </span>
              {unlocked ? (
                <Link to={unitHref(unit)} aria-label={`${unit.title}: ${detail}`} className="group flex min-w-0 flex-1 items-center justify-between gap-4 rounded-2xl border-2 border-b-4 border-line bg-surface p-5 transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-selected-line hover:bg-selected active:translate-y-0.5 active:border-b-2 motion-reduce:transition-none">
                  <span className="min-w-0">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase ${TAG[tone]}`}>{tag}</span>
                    <span className="mt-2 block text-lg font-extrabold">{unit.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{detail}</span>
                  </span>
                  <Icon name="arrowRight" size={22} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand motion-reduce:transition-none" />
                </Link>
              ) : (
                <div aria-label={`${unit.title}: locked. ${detail}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl border-2 border-line bg-soft p-5 opacity-70">
                  <span className="min-w-0">
                    <span className="inline-block rounded-md bg-surface px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-muted uppercase">{tag}</span>
                    <span className="mt-2 block text-lg font-extrabold text-muted">{unit.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{detail}</span>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-center text-xs text-muted">{unlockedCount} of {UNITS.length} units unlocked. Finish a unit to unlock the next.</p>
    </>
  );
}
