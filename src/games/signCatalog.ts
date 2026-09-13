// Sign catalogs Lesson/Speed Challenge draw prompts from, plus the unit
// roadmap (Roadmap.tsx) that groups the full alphabet and 0-9 into a
// Duolingo-style course. Practice catalogs (LETTER_CATALOG/NUMBER_CATALOG)
// are still DERIVED from signClassifier's DEMO_LETTERS/DEMO_NUMBERS — a
// sign only appears as a prompt once its recognition is promoted. Unit
// UNLOCKING, however, is sequential: finishing unit N unlocks unit N+1,
// tracked in UserProfile.completedUnits (contracts.ts), independent of
// whether that next unit's own signs happen to be promoted yet.
import { DEMO_LETTERS, DEMO_NUMBERS } from "../recognition/signClassifier";
import type { UserProfile } from "../lib/contracts";
import { hasSeenWelcome } from "./welcomeProgress";

export const LETTER_CATALOG: readonly string[] = DEMO_LETTERS;
export const NUMBER_CATALOG: readonly string[] = DEMO_NUMBERS;

export function pickSigns(count: number, catalog: readonly string[] = LETTER_CATALOG): string[] {
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(catalog[i % catalog.length]);
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

/** Whether `unit` has been finished — the welcome content unit uses its own
 * localStorage flag (Welcome.tsx already sets it); every practice unit
 * checks the profile's completedUnits, written by markUnitComplete below. */
function isUnitDone(unit: Unit, profile: UserProfile | null): boolean {
  if (unit.kind === "content") return hasSeenWelcome();
  return profile?.completedUnits?.includes(unit.id) ?? false;
}

/** Sequential unlock: the first unit is always open, and each later unit
 * unlocks once the one immediately before it (in UNITS order) is done —
 * independent of whether the new unit's own signs are recognition-promoted
 * yet, so finishing a unit is always what opens the next one. */
export function isUnitUnlocked(unit: Unit, profile: UserProfile | null = null): boolean {
  const index = UNITS.findIndex((candidate) => candidate.id === unit.id);
  if (index <= 0) return true;
  return isUnitDone(UNITS[index - 1], profile);
}

/** Call once a unit-scoped round finishes (see Lesson.tsx/MathMode.tsx).
 * Idempotent — replaying a finished unit doesn't duplicate its entry. */
export function markUnitComplete(profile: UserProfile, unitId: string): UserProfile {
  if (profile.completedUnits?.includes(unitId)) return profile;
  return { ...profile, completedUnits: [...(profile.completedUnits ?? []), unitId] };
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
