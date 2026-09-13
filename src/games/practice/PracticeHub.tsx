// The Practice home at /lesson: the same "take a moment to get ready" card
// as before, now with the level map beside it. Start practice opens the
// first level the learner hasn't finished; the map opens any level they have
// already unlocked.
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { GameLayout } from "../GameLayout";
import { LevelMap } from "./LevelMap";
import { findLevel, LEVEL_COUNT, levelHref } from "./levels";
import { currentLevelNumber, highestCompletedLevel, unlockedCount } from "./practiceProgress";

export function PracticeHub() {
  const navigate = useNavigate();
  const completed = highestCompletedLevel();
  const current = findLevel(currentLevelNumber(completed));
  const unlocked = unlockedCount(completed);
  const finished = completed >= LEVEL_COUNT;

  return (
    <GameLayout
      mode="Guided practice"
      title="Learn to sign, level by level."
      description="Five levels, from your first five hand shapes to the whole alphabet and every digit. Follow the guide, sign to your camera, and hold steady to move forward."
      progress={unlocked / LEVEL_COUNT}
      progressLabel={`${unlocked} of ${LEVEL_COUNT} levels unlocked`}
    >
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border-2 border-line bg-surface p-8 text-center sm:p-14">
          <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="hand" size={32} />
          </span>
          <h2 className="mt-5 text-2xl font-bold">Take a moment to get ready.</h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
            Once you start, we'll speak each prompt aloud and turn on your camera. Find good
            lighting and make sure your whole hand will be in view.
          </p>

          {current && (
            <p className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl bg-soft px-4 py-2.5 text-sm font-bold text-brand">
              <Icon name="target" size={16} />
              {finished ? "Replay" : "Up next"} · Level {current.number}: {current.title}
              <span className="font-semibold text-muted">({current.poolLabel})</span>
            </p>
          )}

          <div className="mt-7">
            <Button
              className="inline-flex items-center gap-2"
              onClick={() => current && navigate(levelHref(current))}
            >
              {completed > 0 ? "Continue practising" : "Start practice"}
              <Icon name="arrowRight" size={18} />
            </Button>
          </div>

          <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-muted">
            {finished
              ? "You've cleared every level. Any of them stays open for another run whenever you want the practice."
              : "Finish a level to unlock the next one. Nothing is timed — the only thing that moves you forward is holding a shape steady."}
          </p>
        </div>

        <LevelMap activeLevel={current?.number} completed={completed} />
      </div>
    </GameLayout>
  );
}
