// Single-digit arithmetic so the answer is always signable (0-9) or
// speakable as one word — matches the recognition MVP's number scope.
export type MathProblem = { prompt: string; answer: number };

export function generateMathProblem(): MathProblem {
  const a = Math.floor(Math.random() * 6) + 1; // 1..6
  const b = Math.floor(Math.random() * (10 - a)); // a+b stays <= 9
  if (Math.random() < 0.5 && a >= b) {
    return { prompt: `${a} − ${b}`, answer: a - b };
  }
  return { prompt: `${a} + ${b}`, answer: a + b };
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

/** Pulls a single digit out of a spoken transcript ("five", "It's 5") or
 * returns null if none is found. */
export function parseSpokenNumber(transcript: string): number | null {
  const cleaned = transcript.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const digitMatch = cleaned.match(/\d+/);
  if (digitMatch) return Number(digitMatch[0]);
  for (const word of cleaned.split(/\s+/)) {
    if (word in NUMBER_WORDS) return NUMBER_WORDS[word];
  }
  return null;
}
