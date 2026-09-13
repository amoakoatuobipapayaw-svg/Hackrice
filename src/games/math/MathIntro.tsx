// A game's start screen: what it's about, how you answer, what it pays.
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Icon, type IconName } from "../../components/ui/Icon";
import { getBest } from "./bestScores";
import { DifficultyBadge } from "./DifficultyBadge";
import { GameGlyph } from "./GameGlyph";
import { DIFFICULTY_WEIGHT, pointsFor } from "./scoring";
import type { MathGameDef } from "./types";

export function MathIntro({ game, onStart }: { game: MathGameDef; onStart: () => void }) {
  const best = getBest(game.id);
  const steps: { icon: IconName; title: string; text: string }[] = [
    { icon: "lightbulb", title: "Solve it", text: `${game.length} problems on ${game.topic.toLowerCase()}. No timer — think it through.` },
    { icon: "hand", title: "Sign it", text: game.maxDigits > 1 ? "Sign the answer one digit at a time, left to right, holding each for a second." : "Sign the digit to your camera and hold it steady for one second." },
    { icon: "mic", title: "Or say it", text: "Tap the mic and speak the number instead. Both paths score the same." },
    { icon: "star", title: "Earn XP", text: `${pointsFor(game.difficulty, 0)} points per answer, more on a combo.${DIFFICULTY_WEIGHT[game.difficulty] > 1 ? ` This tier pays ${DIFFICULTY_WEIGHT[game.difficulty]}× XP.` : " XP counts toward the leaderboard."}` },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <Link to="/math" className="inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4">
        <Icon name="arrowLeft" size={16} />
        All math games
      </Link>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border-2 border-line bg-surface p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <GameGlyph glyph={game.glyph} difficulty={game.difficulty} size="lg" />
            <DifficultyBadge difficulty={game.difficulty} size="md" />
            <span className="text-sm font-bold text-muted">{game.topic}</span>
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{game.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{game.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button onClick={onStart} className="inline-flex items-center gap-2 px-7 py-4 text-base">
              Start
              <Icon name="arrowRight" size={18} />
            </Button>
            <p className="text-xs text-muted">Starting turns on your camera. Hand tracking stays on your device.</p>
          </div>
          {best && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-soft px-3 py-1 text-xs font-bold text-muted">
              <Icon name="trophy" size={14} className="text-accent-ink" />
              Your best: {best.score} pts · {best.correct}/{best.total} correct · {best.plays} {best.plays === 1 ? "play" : "plays"}
            </p>
          )}
        </section>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1" aria-label="How to play">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-2xl border-2 border-line bg-surface p-5">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon name={s.icon} size={20} />
              </span>
              <div>
                <p className="text-sm font-extrabold">
                  <span className="mr-1.5 text-muted">{i + 1}.</span>
                  {s.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
