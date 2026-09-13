// Easy tier: number sense. Every answer is a single digit 1–9.
import { int, pick, signableProblem } from "./random";
import type { MathGameDef, Problem, Rng } from "./types";

// --- Add & Subtract (the original Math Lab game) ---------------------------
function addSubtract(index: number, rng: Rng): Problem {
  return signableProblem(() => {
    // Subtraction shows up from the third puzzle on so the round warms up.
    if (index >= 2 && rng() < 0.5) {
      const a = int(rng, 2, 9);
      const b = int(rng, 1, a - 1);
      return {
        spoken: `What is ${a} minus ${b}?`,
        display: { kind: "expression", text: `${a} − ${b}` },
        answer: a - b,
        explanation: `Start at ${a} and count back ${b}: you land on ${a - b}.`,
      };
    }
    const a = int(rng, 1, 8);
    const b = int(rng, 1, 9 - a);
    return {
      spoken: `What is ${a} plus ${b}?`,
      display: { kind: "expression", text: `${a} + ${b}` },
      answer: a + b,
      explanation: `Start at ${a} and count up ${b}: ${a} + ${b} = ${a + b}.`,
    };
  });
}

// --- Count the Dots --------------------------------------------------------
function countDots(_index: number, rng: Rng): Problem {
  const count = int(rng, 1, 9);
  const shape = pick(rng, ["dot", "square", "star"] as const);
  const noun = shape === "dot" ? "dots" : shape === "square" ? "squares" : "stars";
  return {
    spoken: `How many ${noun} do you see?`,
    display: { kind: "dots", count, shape },
    answer: count,
    explanation: `Touch each ${noun.slice(0, -1)} once as you count: there are ${count}.`,
    hint: "Count in rows, left to right.",
  };
}

// --- Bigger or Smaller -----------------------------------------------------
function compare(index: number, rng: Rng): Problem {
  return signableProblem(() => {
    const wantBigger = rng() < 0.5;
    // Later puzzles hide one side behind a tiny sum so it's a real comparison.
    const useExpr = index >= 2 && rng() < 0.6;
    let a = int(rng, 1, 9);
    let b = int(rng, 1, 9);
    while (b === a) b = int(rng, 1, 9);
    let left = String(a);
    let right = String(b);
    if (useExpr) {
      const side = rng() < 0.5 ? "left" : "right";
      const value = side === "left" ? a : b;
      const part = int(rng, 1, Math.max(1, value - 1));
      const expr = value - part > 0 ? `${part} + ${value - part}` : `${value}`;
      if (side === "left") left = expr;
      else right = expr;
    }
    const answer = wantBigger ? Math.max(a, b) : Math.min(a, b);
    const word = wantBigger ? "bigger" : "smaller";
    return {
      spoken: `Which is ${word}: ${left}, or ${right}? Sign the ${word} number.`,
      display: { kind: "compare", left, right, ask: `Sign the ${word} number` },
      answer,
      explanation: `${left} is ${a} and ${right} is ${b}. The ${word} one is ${answer}.`,
      hint: "Sign the number itself, not which side it's on.",
    };
  });
}

export const EASY_GAMES: readonly MathGameDef[] = [
  {
    id: "add-subtract",
    title: "Add & Subtract",
    tagline: "Small sums and differences, answered with one hand.",
    description:
      "Five quick arithmetic puzzles. Solve each one in your head, then sign the digit to the camera or say it out loud. This is the best place to warm up your number signs.",
    difficulty: "easy",
    topic: "Arithmetic",
    glyph: "+−",
    length: 5,
    maxDigits: 1,
    generate: addSubtract,
  },
  {
    id: "count-dots",
    title: "Count the Dots",
    tagline: "See a handful of shapes and sign how many there are.",
    description:
      "A cluster of shapes appears. Count them, then sign the total. Counting is the first math anyone learns in any language, and ASL numbers 1 to 9 are all one hand.",
    difficulty: "easy",
    topic: "Counting",
    glyph: "•••",
    length: 5,
    maxDigits: 1,
    generate: countDots,
  },
  {
    id: "compare",
    title: "Bigger or Smaller",
    tagline: "Two numbers face off. Sign the one the prompt asks for.",
    description:
      "Two values appear side by side, sometimes hidden behind a tiny sum. Read the instruction, decide which is bigger or smaller, and sign that number.",
    difficulty: "easy",
    topic: "Comparison",
    glyph: ">",
    length: 5,
    maxDigits: 1,
    generate: compare,
  },
];
