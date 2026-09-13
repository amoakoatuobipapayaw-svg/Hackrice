// Tiny RNG helpers. Every generator takes an injectable `rng` so tests can
// drive thousands of deterministic problems through them.
import { isSignable, type Problem, type Rng } from "./types";

export function int(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Keeps drawing until the answer has only digits 1–9 (the camera can't
 * confirm 0). Generators are written so this almost always passes first try;
 * the cap is a safety net, and the last draw is returned regardless so a
 * pathological RNG can't hang the UI — tests assert it never happens. */
export function signableProblem(make: () => Problem, attempts = 50): Problem {
  let problem = make();
  for (let i = 1; i < attempts && !isSignable(problem.answer); i++) problem = make();
  return problem;
}

/** Deterministic RNG for tests (mulberry32). */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
