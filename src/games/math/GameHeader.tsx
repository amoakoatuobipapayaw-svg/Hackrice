// Top of a Math Lab game: back link, title + tier, segmented progress
// (one segment per problem, coloured by outcome) and live score/combo chips.
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { DifficultyBadge } from "./DifficultyBadge";
import { GameGlyph } from "./GameGlyph";
import { comboMultiplier, type MathRoundStats } from "./scoring";
import type { MathGameDef } from "./types";

type GameHeaderProps = {
  game: MathGameDef;
  outcomes: readonly ("correct" | "miss")[];
  current: number;
  stats: MathRoundStats;
};

export function GameHeader({ game, outcomes, current, stats }: GameHeaderProps) {
  const multiplier = comboMultiplier(stats.combo);
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/math" className="inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4">
          <Icon name="arrowLeft" size={16} />
          All math games
        </Link>
        <div className="flex items-center gap-2" aria-label="Round stats">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-surface px-3 py-1 text-sm font-extrabold tabular-nums">
            <Icon name="star" size={14} className="text-accent-ink" />
            {stats.score}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-extrabold tabular-nums ${stats.combo >= 3 ? "border-accent bg-accent/25 text-accent-ink" : "border-line bg-surface text-muted"}`} title="Combo">
            <Icon name="flame" size={14} />
            {stats.combo}
            <span className="text-xs">×{multiplier}</span>
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <GameGlyph glyph={game.glyph} difficulty={game.difficulty} />
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{game.title}</h1>
        <DifficultyBadge difficulty={game.difficulty} />
        <span className="text-sm font-bold text-muted">· {game.topic}</span>
      </div>

      <ol className="mt-5 flex gap-1.5" aria-label={`Problem ${Math.min(current + 1, game.length)} of ${game.length}`}>
        {Array.from({ length: game.length }, (_, i) => {
          const outcome = outcomes[i];
          const cls = outcome === "correct" ? "bg-success" : outcome === "miss" ? "bg-danger" : i === current ? "bg-brand" : "bg-soft";
          return <li key={i} aria-current={i === current ? "step" : undefined} className={`h-2.5 flex-1 rounded-full transition-colors ${cls}`} />;
        })}
      </ol>
    </header>
  );
}
