// The Duolingo-style unit path shown on Home. Units come from signCatalog's
// UNITS list; lock state is derived from the classifier's DEMO_LETTERS /
// DEMO_NUMBERS, so a unit unlocks itself the moment every sign in it is
// promoted in src/recognition/signClassifier.ts — nothing here needs to
// change when that happens.
import { Link } from "react-router-dom";
import { isUnitUnlocked, UNITS, type Unit } from "./signCatalog";

function unitHref(unit: Unit): string {
  return unit.vocabulary === "numbers" ? "/math" : `/lesson?unit=${unit.id}`;
}

export function Roadmap() {
  const unlockedCount = UNITS.filter(isUnitUnlocked).length;
  return (
    <ol className="relative mx-auto mt-8 max-w-[280px] space-y-8 pb-8" aria-label="Course roadmap">
      <li aria-hidden="true" className="absolute top-12 bottom-20 left-1/2 w-2 -translate-x-1/2 rounded-full bg-soft" />
      {UNITS.map((unit, i) => {
        const unlocked = isUnitUnlocked(unit);
        const offset = i % 2 === 0 ? "-translate-x-8" : "translate-x-8";
        const icon = unit.vocabulary === "numbers" ? "＋" : "✋";
        const detail = unit.signs.join(" · ");
        const inner = (
          <>
            <span className="mb-3 rounded-lg border-2 border-line bg-surface px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-brand">
              {unlocked ? `UNIT ${i + 1}` : "COMING SOON"}
            </span>
            <span
              aria-hidden="true"
              className={`flex h-20 w-20 items-center justify-center rounded-full border-b-8 text-3xl font-extrabold transition-transform motion-reduce:transition-none ${
                unlocked ? "border-brand-hover bg-brand text-white hover:-translate-y-1 active:translate-y-1" : "border-line bg-soft text-muted"
              }`}
            >
              {unlocked ? icon : "🔒"}
            </span>
            <h2 className="mt-3 rounded-lg bg-canvas px-2 text-center text-base font-extrabold">{unit.title}</h2>
            <p className="rounded-lg bg-canvas px-2 text-center text-xs text-muted">{detail}</p>
          </>
        );
        return (
          <li key={unit.id} className={`relative flex flex-col items-center ${offset}`}>
            {unlocked ? (
              <Link to={unitHref(unit)} aria-label={`${unit.title}: ${detail}`} className="flex flex-col items-center">
                {inner}
              </Link>
            ) : (
              <div aria-label={`${unit.title}: ${detail}, coming soon`} className="flex flex-col items-center opacity-70">
                {inner}
              </div>
            )}
          </li>
        );
      })}
      <li className="pt-2 text-center text-xs text-muted">
        {unlockedCount} of {UNITS.length} units unlocked. More unlock as recognition covers more signs.
      </li>
    </ol>
  );
}
