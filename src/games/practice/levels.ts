// The five Practice levels. Each one widens the pool of shapes a round can
// ask for: five letters, thirteen, the whole alphabet, the digits, then
// everything together. Pools are DERIVED from the classifier's sign list
// (see signCatalog.ts) so nothing here needs editing when a sign is promoted.
import { ALPHABET, capFor, DIGITS, sampleSigns } from "../signCatalog";

export type LevelNumber = 1 | 2 | 3 | 4 | 5;

export type PracticeLevel = {
  number: LevelNumber;
  title: string;
  /** One line under the title on the level map. */
  blurb: string;
  /** Page header copy, matching the tone of the original practice screen. */
  description: string;
  /** Short pool summary, e.g. "26 letters". */
  poolLabel: string;
  pool: readonly string[];
  /** Signs asked for in one round of this level. */
  length: number;
  /** Level 1 keeps its taught order; every other level samples at random. */
  ordered?: true;
};

/**
 * Level 2's thirteen: the five demo letters plus the eight the classifier
 * scores next-highest today. Taken by confidence rather than alphabetically
 * so the step up from Level 1 stays as recognisable as possible, and derived
 * (not listed) so promoting a sign re-sorts this set instead of stranding it.
 */
export const THIRTEEN_LETTERS: readonly string[] = [...ALPHABET]
  .sort((a, b) => capFor(b) - capFor(a) || a.localeCompare(b))
  .slice(0, 13)
  .sort();

export const LEVELS: readonly PracticeLevel[] = [
  {
    number: 1,
    title: "Your first five",
    blurb: "I · L · V · W · Y",
    description:
      "Learn five shapes at your own pace. Follow the guide, sign to your camera, and hold steady to move forward.",
    poolLabel: "5 letters",
    pool: ["I", "L", "V", "W", "Y"],
    length: 5,
    ordered: true,
  },
  {
    number: 2,
    title: "Thirteen shapes",
    blurb: "Your first five, plus eight more letters",
    description:
      "The same five you know, with eight new letters mixed in. Eight prompts, drawn at random — take them one shape at a time.",
    poolLabel: "13 letters",
    pool: THIRTEEN_LETTERS,
    length: 8,
  },
  {
    number: 3,
    title: "The whole alphabet",
    blurb: "All 26 letters, including the motion letters J and Z",
    description:
      "Every letter is in play now, J and Z included. Ten prompts from the full alphabet — the guide is there for the ones you haven't met yet.",
    poolLabel: "26 letters",
    pool: ALPHABET,
    length: 10,
  },
  {
    number: 4,
    title: "Counting 0 to 9",
    blurb: "Every digit, zero included",
    description:
      "Ten prompts, ten digits: each number appears exactly once. Numbers use a different hand-shape family from letters, so give them their own run.",
    poolLabel: "10 digits",
    pool: DIGITS,
    length: 10,
  },
  {
    number: 5,
    title: "Everything together",
    blurb: "All 26 letters and all 10 digits, shuffled",
    description:
      "Letters and numbers in the same round, in any order — the way fingerspelling actually turns up in conversation. Twelve prompts from all thirty-six shapes.",
    poolLabel: "36 signs",
    pool: [...ALPHABET, ...DIGITS],
    length: 12,
  },
];

export const LEVEL_COUNT = LEVELS.length;

export function findLevel(value: string | number | null | undefined): PracticeLevel | undefined {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) ? LEVELS.find((level) => level.number === number) : undefined;
}

export function levelHref(level: PracticeLevel | LevelNumber): string {
  return `/lesson?level=${typeof level === "number" ? level : level.number}`;
}

export function nextLevel(level: PracticeLevel): PracticeLevel | undefined {
  return LEVELS.find((candidate) => candidate.number === level.number + 1);
}

/**
 * The smallest level whose pool covers every sign in `signs` — how a
 * Roadmap unit link (`/lesson?unit=<id>`) resolves to a level now that
 * Practice is levelled. `core-five` lands exactly on Level 1; a unit that
 * unlocks later (fist shapes, pinch & curl) lands on Level 3, which contains it.
 */
export function levelForSigns(signs: readonly string[]): PracticeLevel | undefined {
  return LEVELS.find((level) => signs.every((sign) => level.pool.includes(sign)));
}

/** The prompts for one attempt at a level. Level 1 keeps its taught order. */
export function levelTargets(level: PracticeLevel): string[] {
  return level.ordered ? [...level.pool].slice(0, level.length) : sampleSigns(level.length, level.pool);
}
