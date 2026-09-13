// Shared shapes for the Math Lab games. Every game is a pure problem
// generator plus metadata; the single MathGame screen renders any of them.
//
// The one rule every generator must obey: the recognizer confirms digits
// 1–9 only, so an answer may never contain a 0. Single-digit answers are
// signed once; multi-digit answers (Hard tier) are signed one digit at a
// time, left to right.
export type Difficulty = "easy" | "medium" | "hard";

/** How the prompt is drawn. Kept as data (not JSX) so generators stay pure and testable. */
export type ProblemDisplay =
  | { kind: "expression"; text: string; sub?: string }
  | { kind: "dots"; count: number; shape?: "dot" | "square" | "star" }
  | { kind: "compare"; left: string; right: string; ask: string }
  | { kind: "sequence"; terms: string[]; missingIndex: number }
  | { kind: "options"; question: string; options: string[]; numbered?: boolean }
  | { kind: "calculus"; expression: string; instruction: string };

export type Problem = {
  /** Plain-language version for text-to-speech and captions. */
  spoken: string;
  display: ProblemDisplay;
  /** 1–99 with no zero digit — see the rule at the top of this file. */
  answer: number;
  /** Worked solution shown after the attempt (the "recommendation" beat). */
  explanation: string;
  /** Optional nudge shown before answering. */
  hint?: string;
};

export type Rng = () => number;

export type MathGameDef = {
  id: string;
  title: string;
  /** One line on the hub card. */
  tagline: string;
  /** Two or three sentences on the game's start screen. */
  description: string;
  difficulty: Difficulty;
  /** The area of math the game exercises — each of the nine is distinct. */
  topic: string;
  /** The math symbol that marks this game (see GameGlyph). */
  glyph: string;
  /** Problems per round. */
  length: number;
  /** Largest answer a round can ask for; drives the answer-slot UI. */
  maxDigits: 1 | 2;
  generate: (index: number, rng: Rng) => Problem;
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
export const DIFFICULTY_ORDER: readonly Difficulty[] = ["easy", "medium", "hard"];

/** Splits an answer into the digits the player must sign, in order. */
export function answerDigits(answer: number): number[] {
  return String(answer).split("").map(Number);
}

/** True when every digit of `n` is 1–9 — the only digits the camera confirms. */
export function isSignable(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 99 && !String(n).includes("0");
}
