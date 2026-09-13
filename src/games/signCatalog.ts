// Sign catalogs Lesson/Speed Challenge draw prompts from, plus the unit
// roadmap (Roadmap.tsx) that groups the full alphabet and 0-9 into a
// Duolingo-style course. Catalogs and unit lock status are DERIVED from
// signClassifier's DEMO_LETTERS/DEMO_NUMBERS, not hardcoded here — promoting
// a sign there (see the CONFIDENCE_CAP table and its comment) is what
// surfaces it in lessons and unlocks its unit, with no edit needed in this
// file.
import {
  CONFIDENCE_CAP,
  CONFIRM_THRESHOLD,
  DEFAULT_CAP,
  DEMO_LETTERS,
  DEMO_NUMBERS,
  EXPERIMENTAL_LETTERS,
  EXPERIMENTAL_NUMBERS,
} from "../recognition/signClassifier";

export const LETTER_CATALOG: readonly string[] = DEMO_LETTERS;
export const NUMBER_CATALOG: readonly string[] = DEMO_NUMBERS;

// The full A-Z and 0-9 pools the levelled Practice mode and the Speed deck
// draw from. Still derived, never hardcoded: DEMO_* ∪ EXPERIMENTAL_* is by
// construction every sign the classifier has a rule for, so these stay
// correct when a sign is promoted in signClassifier's CONFIDENCE_CAP table.
export const ALPHABET: readonly string[] = [...DEMO_LETTERS, ...EXPERIMENTAL_LETTERS].sort();
export const DIGITS: readonly string[] = [...DEMO_NUMBERS, ...EXPERIMENTAL_NUMBERS].sort();

export function capFor(sign: string): number {
  return CONFIDENCE_CAP[sign] ?? DEFAULT_CAP;
}

/**
 * The minimum rule-match score that confirms `sign`, for a screen that wants
 * to practice the whole alphabet rather than only the demo-quality signs.
 *
 * A sign's score is `min(cap, 0.45 + 0.53 * weakest-evidence)`, so a sign
 * capped below CONFIRM_THRESHOLD can never reach the default 0.8 gate and
 * would hang a round forever. Gating on the sign's own cap instead keeps a
 * real evidence floor — a 0.65-capped letter still needs ~0.38 weakest
 * evidence, a 0.55-capped one ~0.19 — it is simply a lower bar, matching how
 * much the classifier is trusted for that shape today. Demo-quality signs are
 * unaffected: their cap is above CONFIRM_THRESHOLD, so they keep the 0.8 gate.
 *
 * Deliberately computed here in games/ rather than by raising the caps in
 * recognition/: the caps also drive Home's unit roadmap and Math, and those
 * should keep telling the truth about what has been validated on a webcam.
 */
export function confirmFloor(sign: string): number {
  return Math.min(CONFIRM_THRESHOLD, capFor(sign));
}

/** Which classifier vocabulary a target belongs to — a mixed pool needs this per sign. */
export function vocabularyFor(sign: string): "letters" | "numbers" {
  return /^[0-9]$/.test(sign) ? "numbers" : "letters";
}

/** Fisher-Yates. Returns a new array; never mutates the pool it was given. */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickSigns(count: number, catalog: readonly string[] = LETTER_CATALOG): string[] {
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(catalog[i % catalog.length]);
  }
  return picks;
}

/**
 * `count` distinct signs from `pool` in random order, falling back to
 * repeats only if the pool is smaller than the round (it never is today).
 */
export function sampleSigns(count: number, pool: readonly string[]): string[] {
  const picks: string[] = [];
  while (picks.length < count) {
    picks.push(...shuffle(pool).slice(0, count - picks.length));
  }
  return picks;
}

// A content unit is a non-camera lesson (grammar/vocabulary explanation) —
// always "unlocked" since it doesn't depend on recognition at all.
export type ContentUnit = { id: string; title: string; kind: "content"; signs: readonly string[] };
// A practice unit is a camera lesson scoped to one recognition vocabulary.
export type PracticeUnit = { id: string; title: string; kind?: "practice"; vocabulary: "letters" | "numbers"; signs: readonly string[] };
export type Unit = ContentUnit | PracticeUnit;

// Grouped by handshape family (a teaching heuristic, not a linguistic
// classification) so each unit builds on a motor pattern the learner just
// practiced. Every static letter and digit appears in exactly one practice
// unit. J and Z are motion signs (motionClassifier.ts) with no live-camera
// validation yet, so — like every other never-tested sign — they stay capped
// below the confirm threshold in signClassifier's CONFIDENCE_CAP table until
// promoted, which is what unlocks motion-letters below.
export const UNITS: readonly Unit[] = [
  { id: "welcome", title: "Welcome to ASL", kind: "content", signs: ["HELLO", "THANK YOU", "PLEASE", "SORRY", "MY NAME IS", "NICE TO MEET YOU"] },
  { id: "numbers-1-9", title: "Counting practice", vocabulary: "numbers", signs: ["1", "2", "3", "4", "5", "6", "7", "8", "9"] },
  { id: "core-five", title: "Getting started", vocabulary: "letters", signs: ["I", "L", "V", "W", "Y"] },
  { id: "fist-shapes", title: "Fist shapes", vocabulary: "letters", signs: ["A", "E", "M", "N", "S", "T"] },
  { id: "open-hand", title: "Open & rounded hand", vocabulary: "letters", signs: ["B", "C", "O", "U"] },
  { id: "pointing", title: "Pointing shapes", vocabulary: "letters", signs: ["D", "G", "Q", "R", "X"] },
  { id: "pinch-curl", title: "Pinch & curl", vocabulary: "letters", signs: ["F", "H", "K", "P"] },
  { id: "zero", title: "Zero", vocabulary: "numbers", signs: ["0"] },
  { id: "motion-letters", title: "Motion letters", vocabulary: "letters", signs: ["J", "Z"] },
];

function unitCatalog(unit: PracticeUnit): readonly string[] {
  return unit.vocabulary === "numbers" ? DEMO_NUMBERS : DEMO_LETTERS;
}

/** Whether `unit`'s own signs are recognition-ready, ignoring course order. */
function isUnitReady(unit: Unit): boolean {
  if (unit.kind === "content") return true;
  const demo = unitCatalog(unit);
  return unit.signs.every((sign) => demo.includes(sign));
}

/**
 * A real Duolingo-style progression: unit N only unlocks once every unit
 * before it is unlocked too, even if a later unit's own signs happen to get
 * promoted first (e.g. J/Z reaching demo tier before the fist-shapes unit
 * finishes promoting shouldn't let "Motion letters" jump ahead of it). Not
 * memoized: UNITS is tiny and this only runs while rendering the roadmap.
 */
export function isUnitUnlocked(unit: Unit): boolean {
  const index = UNITS.indexOf(unit);
  for (let i = 0; i <= index; i++) {
    if (!isUnitReady(UNITS[i])) return false;
  }
  return true;
}

export function findUnit(id: string | null | undefined): Unit | undefined {
  return UNITS.find((unit) => unit.id === id);
}

// ElevenLabs' TTS mispronounces a bare "V" (comes out closer to "vye" than
// "vee", audibly close to "phi") — verified via a TTS->STT round trip, where
// it also scored a much lower confidence than the other catalog letters.
// Spelling it phonetically fixes it; other catalog letters read correctly.
const SPOKEN_LETTER: Record<string, string> = { V: "vee" };

export function speakableLetter(letter: string): string {
  return SPOKEN_LETTER[letter] ?? letter;
}
