// MVP sign catalogs Lesson/Speed Challenge draw prompts from. Recognition's
// real classifier (src/recognition/signClassifier.ts) only reliably confirms
// the letters I, L, V, W, Y and digits 1-9 today — other letters exist but
// score below the confirmation threshold on purpose, and word signs like
// "THANK YOU" exist in the mock only (see src/recognition/README.md).
// CLAUDE.md's golden demo line ("sign THANK YOU") isn't achievable with the
// real recognizer yet; these catalogs stick to what can actually confirm.
export const LETTER_CATALOG = ["I", "L", "V", "W", "Y"] as const;
export const NUMBER_CATALOG = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function pickSigns(count: number, catalog: readonly string[] = LETTER_CATALOG): string[] {
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(catalog[i % catalog.length]);
  }
  return picks;
}

// ElevenLabs' TTS mispronounces a bare "V" (comes out closer to "vye" than
// "vee", audibly close to "phi") — verified via a TTS->STT round trip, where
// it also scored a much lower confidence than the other catalog letters.
// Spelling it phonetically fixes it; other catalog letters read correctly.
const SPOKEN_LETTER: Record<string, string> = { V: "vee" };

export function speakableLetter(letter: string): string {
  return SPOKEN_LETTER[letter] ?? letter;
}
