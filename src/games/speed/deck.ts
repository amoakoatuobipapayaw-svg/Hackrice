// The Speed prompt deck: every letter and every digit, shuffled, dealt one at
// a time. Nothing repeats until all thirty-six have been used — that's the
// whole point of a deck rather than a counter modulo a catalog, which is what
// Speed used to do (it cycled the same five letters forever).
//
// When the deck runs out it reshuffles, and the first card of the new deck is
// never the last card of the old one, so "no repeats" holds across the seam too.
import { ALPHABET, DIGITS, shuffle } from "../signCatalog";

/** All 36 signs a Speed round can ask for: A-Z and 0-9. */
export const SPEED_POOL: readonly string[] = [...ALPHABET, ...DIGITS];

export function createDeck(avoidFirst?: string): string[] {
  const deck = shuffle(SPEED_POOL);
  if (avoidFirst && deck.length > 1 && deck[0] === avoidFirst) {
    [deck[0], deck[1]] = [deck[1], deck[0]];
  }
  return deck;
}

/** How many unseen signs are left in this deck after the current one. */
export function signsLeft(deck: readonly string[], cursor: number): number {
  return Math.max(0, deck.length - cursor - 1);
}
