// Medium tier: multiplication, patterns, and fractions. Answers stay a
// single digit so the signing is still one hand shape — the math is what
// gets harder.
import { int, pick, signableProblem } from "./random";
import type { MathGameDef, Problem, Rng } from "./types";

// --- Times Tables ----------------------------------------------------------
function timesTables(index: number, rng: Rng): Problem {
  return signableProblem(() => {
    const mode = index < 2 ? "multiply" : pick(rng, ["multiply", "divide", "missing"] as const);
    if (mode === "divide") {
      const answer = int(rng, 2, 9);
      const divisor = int(rng, 2, 9);
      const dividend = answer * divisor;
      return {
        spoken: `What is ${dividend} divided by ${divisor}?`,
        display: { kind: "expression", text: `${dividend} ÷ ${divisor}` },
        answer,
        explanation: `Ask "${divisor} times what makes ${dividend}?" — ${divisor} × ${answer} = ${dividend}.`,
      };
    }
    if (mode === "missing") {
      const a = int(rng, 2, 9);
      const answer = int(rng, 2, 9);
      return {
        spoken: `${a} times what number equals ${a * answer}?`,
        display: { kind: "expression", text: `${a} × ? = ${a * answer}`, sub: "Sign the missing number" },
        answer,
        explanation: `${a * answer} ÷ ${a} = ${answer}, so ${a} × ${answer} = ${a * answer}.`,
      };
    }
    const a = int(rng, 1, 3);
    const b = int(rng, 1, Math.floor(9 / a));
    return {
      spoken: `What is ${a} times ${b}?`,
      display: { kind: "expression", text: `${a} × ${b}` },
      answer: a * b,
      explanation: `${a} groups of ${b}: ${Array.from({ length: a }, () => b).join(" + ")} = ${a * b}.`,
    };
  });
}

// --- Pattern Finder --------------------------------------------------------
function patterns(index: number, rng: Rng): Problem {
  return signableProblem(() => {
    type Rule = { name: string; terms: number[]; explain: string };
    const rules: (() => Rule)[] = [
      () => {
        const step = int(rng, 1, 3);
        const start = int(rng, 1, 3);
        const terms = Array.from({ length: 5 }, (_, i) => start + step * i);
        return { name: "add", terms, explain: `Each term goes up by ${step}.` };
      },
      () => {
        const step = int(rng, 1, 2);
        const start = int(rng, 8, 9);
        const terms = Array.from({ length: 5 }, (_, i) => start - step * i);
        return { name: "subtract", terms, explain: `Each term goes down by ${step}.` };
      },
      () => {
        const terms = [1, 2, 4, 8];
        return { name: "double", terms, explain: "Each term is double the one before." };
      },
      () => {
        const terms = [1, 1, 2, 3, 5, 8];
        return { name: "fibonacci", terms, explain: "Each term is the sum of the two before it." };
      },
      () => {
        const terms = [1, 4, 9];
        return { name: "squares", terms, explain: "These are the square numbers: 1², 2², 3²." };
      },
      () => {
        const a = int(rng, 1, 4);
        const b = int(rng, 5, 9);
        const terms = [a, b, a, b, a, b];
        return { name: "alternate", terms, explain: `The pattern alternates ${a}, ${b}, ${a}, ${b}…` };
      },
    ];
    // First two puzzles use the simplest rules so the mechanic is clear.
    const rule = (index < 2 ? rules[0] : pick(rng, rules))();
    const terms = rule.terms.filter((t) => t >= 1 && t <= 9);
    // Hide the last term most of the time; sometimes a middle one.
    const missingIndex = rng() < 0.7 || terms.length < 4 ? terms.length - 1 : int(rng, 1, terms.length - 2);
    const answer = terms[missingIndex];
    const shown = terms.map((t, i) => (i === missingIndex ? "?" : String(t)));
    return {
      spoken: `Find the missing number: ${shown.join(", ")}.`,
      display: { kind: "sequence", terms: shown, missingIndex },
      answer,
      explanation: `${rule.explain} The missing number is ${answer}.`,
      hint: "Look at how each term changes from the one before.",
    };
  });
}

// --- Fraction Bites --------------------------------------------------------
function fractions(index: number, rng: Rng): Problem {
  return signableProblem(() => {
    const mode = index < 2 ? "half" : pick(rng, ["half", "unit", "percent", "ofPart"] as const);
    if (mode === "half") {
      const answer = int(rng, 1, 9);
      return {
        spoken: `What is one half of ${answer * 2}?`,
        display: { kind: "expression", text: `½ of ${answer * 2}` },
        answer,
        explanation: `Half means split into two equal parts: ${answer * 2} ÷ 2 = ${answer}.`,
      };
    }
    if (mode === "unit") {
      const d = int(rng, 3, 5);
      const answer = int(rng, 1, 9);
      const fracGlyph = d === 3 ? "⅓" : d === 4 ? "¼" : "⅕";
      return {
        spoken: `What is one ${d === 3 ? "third" : d === 4 ? "quarter" : "fifth"} of ${answer * d}?`,
        display: { kind: "expression", text: `${fracGlyph} of ${answer * d}` },
        answer,
        explanation: `One ${d === 3 ? "third" : d === 4 ? "quarter" : "fifth"} means divide by ${d}: ${answer * d} ÷ ${d} = ${answer}.`,
      };
    }
    if (mode === "percent") {
      const pct = pick(rng, [10, 25, 50] as const);
      const answer = int(rng, 1, 9);
      const whole = (answer * 100) / pct;
      return {
        spoken: `What is ${pct} percent of ${whole}?`,
        display: { kind: "expression", text: `${pct}% of ${whole}` },
        answer,
        explanation: `${pct}% is ${pct === 50 ? "one half" : pct === 25 ? "one quarter" : "one tenth"}: ${whole} ÷ ${100 / pct} = ${answer}.`,
      };
    }
    // Non-unit fraction of a number: e.g. ¾ of 12 = 9.
    const [n, d] = pick(rng, [
      [2, 3],
      [3, 4],
      [2, 5],
      [3, 5],
    ] as const);
    const k = int(rng, 1, Math.floor(9 / n));
    const whole = d * k;
    const answer = n * k;
    return {
      spoken: `What is ${n} over ${d} of ${whole}?`,
      display: { kind: "expression", text: `${n}⁄${d} of ${whole}` },
      answer,
      explanation: `Divide ${whole} by ${d} to get ${k}, then multiply by ${n}: ${answer}.`,
    };
  });
}

export const MEDIUM_GAMES: readonly MathGameDef[] = [
  {
    id: "times-tables",
    title: "Times Tables",
    tagline: "Multiply, divide, and find the missing factor.",
    description:
      "Products, quotients, and missing-factor puzzles drawn from the times tables. Every answer is still one digit, so your hand shapes stay familiar while the mental math steps up.",
    difficulty: "medium",
    topic: "Multiplication & division",
    glyph: "×",
    length: 5,
    maxDigits: 1,
    generate: timesTables,
  },
  {
    id: "patterns",
    title: "Pattern Finder",
    tagline: "Spot the rule in a sequence and sign the missing term.",
    description:
      "A short number sequence with one term hidden. Work out the rule — adding, doubling, Fibonacci, squares — and sign the number that belongs in the gap.",
    difficulty: "medium",
    topic: "Sequences & patterns",
    glyph: "→",
    length: 5,
    maxDigits: 1,
    generate: patterns,
  },
  {
    id: "fractions",
    title: "Fraction Bites",
    tagline: "Halves, quarters, and percentages of everyday numbers.",
    description:
      "Find a fraction or a percentage of a whole number. Start with halves, then thirds, quarters, fifths, and percent — the answer is always a clean single digit.",
    difficulty: "medium",
    topic: "Fractions & percentages",
    glyph: "½",
    length: 5,
    maxDigits: 1,
    generate: fractions,
  },
];
