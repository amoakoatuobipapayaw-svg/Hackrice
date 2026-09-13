// The Math Lab catalog: nine games, three per difficulty tier, each on a
// different area of math. MathHub lists them; MathGame plays any of them.
import { EASY_GAMES } from "./easyGames";
import { HARD_GAMES } from "./hardGames";
import { MEDIUM_GAMES } from "./mediumGames";
import { DIFFICULTY_ORDER, type Difficulty, type MathGameDef } from "./types";

export const MATH_GAMES: readonly MathGameDef[] = [...EASY_GAMES, ...MEDIUM_GAMES, ...HARD_GAMES];

export function findGame(id: string | null | undefined): MathGameDef | undefined {
  return MATH_GAMES.find((g) => g.id === id);
}

export function gamesByDifficulty(): { difficulty: Difficulty; games: MathGameDef[] }[] {
  return DIFFICULTY_ORDER.map((difficulty) => ({ difficulty, games: MATH_GAMES.filter((g) => g.difficulty === difficulty) }));
}

/** Hub link for a game — a query param so no route outside src/games changes. */
export function gameHref(game: MathGameDef): string {
  return `/math?game=${game.id}`;
}
