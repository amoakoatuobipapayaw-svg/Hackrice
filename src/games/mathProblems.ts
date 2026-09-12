// Arithmetic whose answer is always a single digit 0-9, so it can be signed
// with the recognition MVP's number vocabulary or spoken as one word.
export type MathOp = "+" | "−" | "×";
export type MathProblem = { prompt: string; answer: number; op: MathOp };

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Problems get harder as the round goes on: + first, then −, then ×.
 * Answers are kept in 1-9 because 0 is the least reliable digit to recognize. */
export function generateMathProblem(index = 0, random = Math.random): MathProblem {
  const pick = random();
  const op: MathOp = index < 2 ? "+" : index < 4 ? (pick < 0.5 ? "+" : "−") : pick < 0.4 ? "×" : "−";

  if (op === "×") {
    const a = randomInt(1, 3);
    const b = randomInt(1, Math.floor(9 / a));
    return { prompt: `${a} × ${b}`, answer: a * b, op };
  }
  if (op === "−") {
    const a = randomInt(2, 9);
    const b = randomInt(1, a - 1);
    return { prompt: `${a} − ${b}`, answer: a - b, op };
  }
  const a = randomInt(1, 8);
  const b = randomInt(1, 9 - a);
  return { prompt: `${a} + ${b}`, answer: a + b, op };
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, oh: 0,
  one: 1, won: 1,
  two: 2, to: 2, too: 2,
  three: 3, tree: 3,
  four: 4, for: 4, fore: 4,
  five: 5,
  six: 6, sex: 6,
  seven: 7,
  eight: 8, ate: 8,
  nine: 9,
};

/** Pulls a single digit out of a spoken transcript ("five", "It's 5",
 * "the answer is four") or returns null if none is found. Homophones are
 * accepted because STT frequently returns "to"/"for" for two/four. */
export function parseSpokenNumber(transcript: string): number | null {
  const cleaned = transcript.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const digitMatch = cleaned.match(/\d+/);
  if (digitMatch) return Number(digitMatch[0]);
  for (const word of cleaned.split(/\s+/)) {
    if (word in NUMBER_WORDS) return NUMBER_WORDS[word];
  }
  return null;
}
