// Hard tier: algebra, logic, and calculus. Answers may be two digits here,
// signed one digit at a time (still never a 0 — see types.ts).
import { int, pick, shuffle, signableProblem } from "./random";
import type { MathGameDef, Problem, Rng } from "./types";

const SUP: Record<string, string> = { "2": "²", "3": "³" };
const SUB: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };

// --- Solve for x -----------------------------------------------------------
function algebra(index: number, rng: Rng): Problem {
  return signableProblem(() => {
    const mode = index < 2 ? pick(rng, ["plus", "times"] as const) : pick(rng, ["plus", "times", "twoStep", "minus", "divide"] as const);
    if (mode === "plus") {
      const x = int(rng, 1, 9);
      const a = int(rng, 1, 9);
      return {
        spoken: `Solve for x: x plus ${a} equals ${x + a}.`,
        display: { kind: "expression", text: `x + ${a} = ${x + a}`, sub: "Solve for x" },
        answer: x,
        explanation: `Subtract ${a} from both sides: x = ${x + a} − ${a} = ${x}.`,
      };
    }
    if (mode === "times") {
      const x = int(rng, 1, 9);
      const a = int(rng, 2, 9);
      return {
        spoken: `Solve for x: ${a} x equals ${a * x}.`,
        display: { kind: "expression", text: `${a}x = ${a * x}`, sub: "Solve for x" },
        answer: x,
        explanation: `Divide both sides by ${a}: x = ${a * x} ÷ ${a} = ${x}.`,
      };
    }
    if (mode === "minus") {
      const a = int(rng, 1, 9);
      const b = int(rng, 1, 9);
      return {
        spoken: `Solve for x: x minus ${a} equals ${b}.`,
        display: { kind: "expression", text: `x − ${a} = ${b}`, sub: "Solve for x" },
        answer: a + b,
        explanation: `Add ${a} to both sides: x = ${b} + ${a} = ${a + b}.`,
      };
    }
    if (mode === "divide") {
      const a = int(rng, 2, 9);
      const b = int(rng, 2, 9);
      return {
        spoken: `Solve for x: x divided by ${a} equals ${b}.`,
        display: { kind: "expression", text: `x ÷ ${a} = ${b}`, sub: "Solve for x" },
        answer: a * b,
        explanation: `Multiply both sides by ${a}: x = ${b} × ${a} = ${a * b}.`,
      };
    }
    const x = int(rng, 1, 9);
    const a = int(rng, 2, 5);
    const b = int(rng, 1, 9);
    return {
      spoken: `Solve for x: ${a} x plus ${b} equals ${a * x + b}.`,
      display: { kind: "expression", text: `${a}x + ${b} = ${a * x + b}`, sub: "Solve for x" },
      answer: x,
      explanation: `Subtract ${b}: ${a}x = ${a * x}. Then divide by ${a}: x = ${x}.`,
    };
  });
}

// --- Logic Gate ------------------------------------------------------------
type Bool = { text: string; value: boolean };
function boolExpr(rng: Rng): Bool {
  const T: Bool = { text: "TRUE", value: true };
  const F: Bool = { text: "FALSE", value: false };
  const lit = () => (rng() < 0.5 ? T : F);
  const a = lit();
  const b = lit();
  const c = lit();
  const op1 = pick(rng, ["AND", "OR"] as const);
  const op2 = pick(rng, ["AND", "OR"] as const);
  const inner = op2 === "AND" ? b.value && c.value : b.value || c.value;
  const negate = rng() < 0.4;
  const innerText = `(${b.text} ${op2} ${c.text})`;
  const value = op1 === "AND" ? a.value && (negate ? !inner : inner) : a.value || (negate ? !inner : inner);
  return { text: `${a.text} ${op1} ${negate ? "NOT " : ""}${innerText}`, value };
}

const RIDDLES: readonly { question: string; options: string[]; answer: number; why: string }[] = [
  {
    question: "All squares are rectangles. Shape S is a square. Which statement must be true?",
    options: ["S is a rectangle", "S is a circle", "S is not a rectangle", "Nothing can be concluded"],
    answer: 1,
    why: "If every square is a rectangle and S is a square, S must be a rectangle.",
  },
  {
    question: "If it rains, the ground gets wet. The ground is dry. What can you conclude?",
    options: ["It rained", "It did not rain", "The ground is wet", "Nothing"],
    answer: 2,
    why: "Dry ground rules out rain — this is the contrapositive of the rule.",
  },
  {
    question: "Every even number greater than 2 is the sum of two primes (assume true). Which number is NOT even?",
    options: ["8", "4", "7", "6"],
    answer: 3,
    why: "7 is odd; 4, 6, and 8 are even.",
  },
  {
    question: "Ana is taller than Ben. Ben is taller than Cy. Who is shortest?",
    options: ["Ana", "Ben", "Cy", "Cannot tell"],
    answer: 3,
    why: "Ana > Ben > Cy, so Cy is the shortest.",
  },
  {
    question: "A statement and its negation: exactly how many of them can be true at once?",
    options: ["One", "Both", "Neither", "It depends"],
    answer: 1,
    why: "A statement and its negation always have opposite truth values — exactly one is true.",
  },
  {
    question: "Which one is a valid deduction? Premises: all cats purr; Milo is a cat.",
    options: ["Milo purrs", "All purring things are cats", "Milo is not a cat", "Cats do not purr"],
    answer: 1,
    why: "Applying the general rule to the specific case: Milo is a cat, so Milo purrs.",
  },
];

function logic(index: number, rng: Rng): Problem {
  return signableProblem(() => {
    const mode = index < 1 ? "boolean" : pick(rng, ["boolean", "countTrue", "riddle", "sets"] as const);
    if (mode === "boolean") {
      const e = boolExpr(rng);
      return {
        spoken: `Is this true or false: ${e.text.replace(/[()]/g, "")}? Sign 1 for true, 2 for false.`,
        display: { kind: "options", question: `Evaluate: ${e.text}`, options: ["True", "False"] },
        answer: e.value ? 1 : 2,
        explanation: `AND needs both sides true; OR needs at least one; NOT flips the value. This evaluates to ${e.value ? "TRUE" : "FALSE"}.`,
        hint: "Sign the number of the option.",
      };
    }
    if (mode === "countTrue") {
      const a = int(rng, 1, 9);
      const b = int(rng, 1, 9);
      const c = int(rng, 1, 9);
      const sumOff = rng() < 0.5 ? 0 : 1; // sometimes the sum is deliberately wrong
      const evenClaim = rng() < 0.5; // sometimes we claim the wrong parity
      const stmts: Bool[] = shuffle(rng, [
        { text: `${a} + ${b} = ${a + b + sumOff}`, value: sumOff === 0 },
        { text: `${c} is ${evenClaim ? "even" : "odd"}`, value: (c % 2 === 0) === evenClaim },
        { text: `${a} > ${b}`, value: a > b },
        { text: `${b} × 2 = ${b * 2}`, value: true },
      ]);
      const count = stmts.filter((s) => s.value).length;
      return {
        spoken: `How many of these statements are true? ${stmts.map((s) => s.text).join(". ")}.`,
        display: { kind: "options", question: "How many of these statements are true? Sign the count.", options: stmts.map((s) => s.text), numbered: false },
        answer: count,
        explanation: `True: ${stmts.filter((s) => s.value).map((s) => s.text).join("; ")}. That's ${count}.`,
        hint: "Sign how many are true, not which one.",
      };
    }
    if (mode === "sets") {
      const both = int(rng, 1, 4);
      const onlyA = int(rng, 1, 4);
      const onlyB = int(rng, 1, 4);
      const total = both + onlyA + onlyB;
      const a = onlyA + both;
      const b = onlyB + both;
      return {
        spoken: `In a club of ${total} people, ${a} play chess and ${b} play soccer. Everyone plays at least one. How many play both?`,
        display: {
          kind: "options",
          question: `A club has ${total} members. ${a} play chess, ${b} play soccer, and everyone plays at least one. How many play both?`,
          options: [],
        },
        answer: both,
        explanation: `Inclusion–exclusion: ${a} + ${b} − ${total} = ${both} people are counted twice, so ${both} play both.`,
      };
    }
    const r = pick(rng, RIDDLES);
    return {
      spoken: `${r.question} Options: ${r.options.map((o, i) => `${i + 1}, ${o}`).join(". ")}. Sign the number of the correct option.`,
      display: { kind: "options", question: r.question, options: r.options },
      answer: r.answer,
      explanation: r.why,
      hint: "Sign the number of the option.",
    };
  });
}

// --- Calculus Corner -------------------------------------------------------
function calculus(index: number, rng: Rng): Problem {
  return signableProblem(() => {
    const mode = index < 2 ? pick(rng, ["linear", "power"] as const) : pick(rng, ["linear", "power", "quadratic", "integral", "limit", "cubic"] as const);
    if (mode === "linear") {
      const a = int(rng, 1, 9);
      const b = int(rng, 1, 9);
      return {
        spoken: `f of x equals ${a} x plus ${b}. What is f prime of x?`,
        display: { kind: "calculus", expression: `f(x) = ${a}x + ${b}`, instruction: "Find f′(x)" },
        answer: a,
        explanation: `The derivative of ${a}x is ${a}; the constant ${b} vanishes. f′(x) = ${a}.`,
      };
    }
    if (mode === "power") {
      const c = int(rng, 1, 4);
      return {
        spoken: `f of x equals x squared. What is f prime of ${c}?`,
        display: { kind: "calculus", expression: `f(x) = x${SUP["2"]}`, instruction: `Find f′(${c})` },
        answer: 2 * c,
        explanation: `Power rule: f′(x) = 2x, so f′(${c}) = 2 × ${c} = ${2 * c}.`,
      };
    }
    if (mode === "cubic") {
      const c = int(rng, 1, 3);
      return {
        spoken: `f of x equals x cubed. What is f prime of ${c}?`,
        display: { kind: "calculus", expression: `f(x) = x${SUP["3"]}`, instruction: `Find f′(${c})` },
        answer: 3 * c * c,
        explanation: `Power rule: f′(x) = 3x², so f′(${c}) = 3 × ${c * c} = ${3 * c * c}.`,
      };
    }
    if (mode === "quadratic") {
      const a = int(rng, 1, 4);
      const b = int(rng, 1, 9);
      const c = int(rng, 1, 3);
      return {
        spoken: `f of x equals ${a} x squared plus ${b} x. What is f prime of ${c}?`,
        display: { kind: "calculus", expression: `f(x) = ${a}x${SUP["2"]} + ${b}x`, instruction: `Find f′(${c})` },
        answer: 2 * a * c + b,
        explanation: `f′(x) = ${2 * a}x + ${b}, so f′(${c}) = ${2 * a * c} + ${b} = ${2 * a * c + b}.`,
      };
    }
    if (mode === "integral") {
      if (rng() < 0.5) {
        const c = int(rng, 1, 9);
        return {
          spoken: `What is the integral from 0 to ${c} of 2 x d x?`,
          display: { kind: "calculus", expression: `∫${SUB["0"]}${SUB[String(c)]} 2x dx`, instruction: "Evaluate the definite integral" },
          answer: c * c,
          explanation: `An antiderivative of 2x is x². Evaluate: ${c}² − 0² = ${c * c}.`,
        };
      }
      const a = int(rng, 1, 9);
      const c = int(rng, 1, 9);
      return {
        spoken: `What is the integral from 0 to ${c} of ${a} d x?`,
        display: { kind: "calculus", expression: `∫${SUB["0"]}${SUB[String(c)]} ${a} dx`, instruction: "Evaluate the definite integral" },
        answer: a * c,
        explanation: `Integrating a constant gives a rectangle: height ${a} × width ${c} = ${a * c}.`,
      };
    }
    const c = int(rng, 1, 9);
    return {
      spoken: `What is the limit as x approaches ${c} of x squared minus ${c * c}, over x minus ${c}?`,
      display: { kind: "calculus", expression: `lim x→${c}  (x${SUP["2"]} − ${c * c}) ⁄ (x − ${c})`, instruction: "Evaluate the limit" },
      answer: 2 * c,
      explanation: `Factor: (x − ${c})(x + ${c}) ⁄ (x − ${c}) = x + ${c}. As x → ${c}, that's ${2 * c}.`,
    };
  });
}

export const HARD_GAMES: readonly MathGameDef[] = [
  {
    id: "algebra",
    title: "Solve for x",
    tagline: "One-step and two-step equations. Sign each digit of x.",
    description:
      "Linear equations from x + 3 = 8 up to 4x + 5 = 21. Isolate x, then sign the answer — when it has two digits, sign them one at a time, left to right.",
    difficulty: "hard",
    topic: "Algebra",
    glyph: "x",
    length: 5,
    maxDigits: 2,
    generate: algebra,
  },
  {
    id: "logic",
    title: "Logic Gate",
    tagline: "Boolean expressions, deductions, and set puzzles.",
    description:
      "Evaluate TRUE/FALSE expressions, count true statements, reason through a deduction, or solve a two-set overlap. Your answer is always a number — often the option you'd pick.",
    difficulty: "hard",
    topic: "Logic & sets",
    glyph: "∴",
    length: 5,
    maxDigits: 1,
    generate: logic,
  },
  {
    id: "calculus",
    title: "Calculus Corner",
    tagline: "Derivatives, definite integrals, and limits with clean answers.",
    description:
      "Differentiate and evaluate at a point, integrate over a simple interval, or take a limit. Every problem is chosen so the answer is a whole number you can sign digit by digit.",
    difficulty: "hard",
    topic: "Differential & integral calculus",
    glyph: "∫",
    length: 5,
    maxDigits: 2,
    generate: calculus,
  },
];
