// Spoken-answer parsing for the Math Lab. The problem generators themselves
// live in src/games/math/; this file keeps the voice path in one place.
//
// Handles 0–99 as digits ("12"), words ("twelve", "twenty one",
// "twenty-one") and the homophones speech-to-text reliably returns for
// single digits ("for", "to", "ate"). Returns the FIRST number found.
const ONES: Record<string, number> = {
  zero: 0, oh: 0,
  one: 1, won: 1,
  two: 2, to: 2, too: 2,
  three: 3, tree: 3, free: 3,
  four: 4, for: 4, fore: 4,
  five: 5,
  six: 6, sex: 6,
  seven: 7,
  eight: 8, ate: 8,
  nine: 9,
};
const TEENS: Record<string, number> = {
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

export function parseSpokenNumber(transcript: string): number | null {
  const cleaned = transcript.toLowerCase().replace(/-/g, " ").replace(/[^a-z0-9\s]/g, " ");
  const digitMatch = cleaned.match(/\d+/);
  if (digitMatch) return Number(digitMatch[0]);

  const words = cleaned.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w in TEENS) return TEENS[w];
    if (w in TENS) {
      const next = words[i + 1];
      // "twenty one" → 21; a bare "twenty" → 20
      return TENS[w] + (next && next in ONES && ONES[next] > 0 ? ONES[next] : 0);
    }
    if (w in ONES) return ONES[w];
  }
  return null;
}
