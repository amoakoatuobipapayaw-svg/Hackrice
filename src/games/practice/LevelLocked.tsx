// A locked level reached by URL rather than by clicking the map. The map
// refuses in place with a notice; a direct link needs a whole screen, but
// says the same thing and points at the same way forward.
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { GameLayout } from "../GameLayout";
import { LevelMap } from "./LevelMap";
import { findLevel, LEVEL_COUNT, levelHref, type PracticeLevel } from "./levels";
import { currentLevelNumber, highestCompletedLevel, unlockedCount } from "./practiceProgress";

export function LevelLocked({ level }: { level: PracticeLevel }) {
  const completed = highestCompletedLevel();
  const current = findLevel(currentLevelNumber(completed));

  return (
    <GameLayout
      mode="Guided practice"
      title="No access yet."
      description={`Level ${level.number} opens once you've finished Level ${level.number - 1}. Everything you've already unlocked is still here.`}
      progress={unlockedCount(completed) / LEVEL_COUNT}
      progressLabel={`${unlockedCount(completed)} of ${LEVEL_COUNT} levels unlocked`}
      backTo="/lesson"
      backLabel="Back to your level map"
    >
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border-2 border-line bg-surface p-8 text-center sm:p-14">
          <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-soft text-muted">
            <Icon name="lock" size={30} />
          </span>
          <h2 className="mt-5 text-2xl font-bold">Level {level.number}: {level.title} is locked</h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
            {level.poolLabel} are waiting behind it. Levels open in order so each one builds on hand shapes you've
            already held steady.
          </p>
          {current && (
            <Link
              to={levelHref(current)}
              className="mt-7 inline-flex items-center gap-2 rounded-xl border-2 border-b-4 border-brand-hover bg-brand px-7 py-3 font-extrabold text-white hover:bg-brand-hover active:translate-y-0.5 active:border-b-2"
            >
              Practice Level {current.number}: {current.title}
              <Icon name="arrowRight" size={18} />
            </Link>
          )}
        </div>
        <LevelMap activeLevel={current?.number} completed={completed} />
      </div>
    </GameLayout>
  );
}
