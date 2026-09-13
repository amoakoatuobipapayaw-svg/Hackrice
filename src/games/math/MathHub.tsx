// The Math Lab landing page: nine games as clickable panels, grouped by
// tier, with a "more in development" note underneath. Rendered by
// MathMode.tsx at /math when no ?game= param is present.
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { getBest } from "./bestScores";
import { DifficultyBadge } from "./DifficultyBadge";
import { GameGlyph } from "./GameGlyph";
import { TIER_STYLE } from "./tierStyle";
import { gameHref, gamesByDifficulty, MATH_GAMES } from "./games";
import { DIFFICULTY_LABEL, type Difficulty, type MathGameDef } from "./types";

const TIER_BLURB: Record<Difficulty, string> = {
  easy: "Number sense with one hand shape per answer. Start here.",
  medium: "Same hand shapes, bigger ideas: multiplication, patterns, fractions.",
  hard: "Two-digit answers signed one digit at a time. Algebra, logic, calculus.",
};

export function MathHub() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4">
        <Icon name="arrowLeft" size={16} />
        Back to your journey
      </Link>

      <header className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold tracking-widest text-brand uppercase">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
            Math Lab
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Nine ways to <span className="marker-underline">think in numbers</span> — and sign them.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Every game ends the same way: you sign your answer to the camera (or say it), get coached, and earn XP toward the
            leaderboard. Pick a tier and jump in.
          </p>
        </div>
        <LabProgress />
      </header>

      {gamesByDifficulty().map(({ difficulty, games }) => (
        <section key={difficulty} className="mt-10" aria-labelledby={`tier-${difficulty}`}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={difficulty} size="md" />
            <h2 id={`tier-${difficulty}`} className="sr-only">
              {DIFFICULTY_LABEL[difficulty]} games
            </h2>
            <p className="text-sm text-muted">{TIER_BLURB[difficulty]}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <li key={game.id}>
                <GameCard game={game} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <aside className="mt-12 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-soft/60 px-6 py-8 text-center sm:flex-row sm:text-left" aria-label="More games coming">
        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand shadow-sm">
          <Icon name="sparkles" size={24} />
        </span>
        <div>
          <p className="font-extrabold">More games are in development.</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Geometry, probability, and word problems are on the bench right now. You won't need to wait long to see more to come —
            they'll appear here as soon as they're ready.
          </p>
        </div>
      </aside>
      <p className="mt-6 text-center text-xs text-muted">
        {MATH_GAMES.length} games · answers use ASL numbers 1–9 · no timers on your learning
      </p>
    </div>
  );
}

function GameCard({ game }: { game: MathGameDef }) {
  const best = getBest(game.id);
  return (
    <Link
      to={gameHref(game)}
      aria-label={`${game.title}, ${DIFFICULTY_LABEL[game.difficulty]}: ${game.tagline}`}
      className={`group flex h-full flex-col rounded-2xl border-2 border-b-4 border-line bg-surface p-5 transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0.5 active:border-b-2 motion-reduce:transition-none ${TIER_STYLE[game.difficulty].ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <GameGlyph glyph={game.glyph} difficulty={game.difficulty} />
        <DifficultyBadge difficulty={game.difficulty} />
      </div>
      <h3 className="mt-4 text-lg font-extrabold leading-tight">{game.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{game.tagline}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs font-bold text-muted">
        <span className="truncate">
          {game.topic}
          {best ? ` · Best ${best.score}` : ""}
        </span>
        <span className="inline-flex items-center gap-1 text-brand">
          Play
          <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
        </span>
      </div>
    </Link>
  );
}

/** How much of the lab you've explored — more motivating than a game count. */
function LabProgress() {
  const played = MATH_GAMES.filter((g) => getBest(g.id)).length;
  const total = MATH_GAMES.reduce((sum, g) => sum + (getBest(g.id)?.score ?? 0), 0);
  const pct = Math.round((played / MATH_GAMES.length) * 100);
  return (
    <div className="min-w-56 rounded-2xl border-2 border-line bg-surface p-5">
      <p className="text-xs font-extrabold tracking-widest text-muted uppercase">Your lab progress</p>
      <p className="mt-2 text-2xl font-black">
        {played} <span className="text-base font-bold text-muted">of {MATH_GAMES.length} games played</span>
      </p>
      <div role="progressbar" aria-label="Games played" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-3 h-2.5 overflow-hidden rounded-full bg-soft">
        <div className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-xs font-bold text-muted">
        {played === 0 ? "Pick any card to start — Easy first is a good idea." : `${total} points banked across your best runs.`}
      </p>
    </div>
  );
}
