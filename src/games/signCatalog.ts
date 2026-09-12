// MVP sign catalog: what Lesson and Speed Challenge prompt for, plus a plain
// handshape description shown next to each target (we have no sign images
// yet — the description IS the "target sign" for now).
//
// Recognition's classifier (src/recognition/signClassifier.ts) only reliably
// confirms letters I, L, V, W, Y and digits 1-9 today; every other letter
// scores below its 0.8 threshold on purpose. Stick to what can confirm —
// a confident demo of 10 signs beats a flaky demo of 40 (PLAN.md risk #1).
export type SignKind = "letter" | "number";

export type SignInfo = {
  label: string;
  kind: SignKind;
  /** One-sentence handshape, in the order a beginner would form it. */
  description: string;
  /** The single most common mistake, phrased as what to do instead. */
  tip: string;
  /** Emoji only where one actually matches the handshape. */
  glyph?: string;
};

export const SIGNS: Record<string, SignInfo> = {
  I: { label: "I", kind: "letter", description: "Make a fist, then raise only your pinky.", tip: "Keep your thumb tucked across your folded fingers." },
  L: { label: "L", kind: "letter", description: "Point your index finger up and stick your thumb out to the side.", tip: "The index and thumb should form a clean right angle." },
  V: { label: "V", kind: "letter", description: "Raise your index and middle fingers, spread apart.", tip: "Fold ring and pinky down and hold them with your thumb.", glyph: "✌️" },
  W: { label: "W", kind: "letter", description: "Raise index, middle, and ring fingers, spread apart.", tip: "Pin your pinky down with your thumb." },
  Y: { label: "Y", kind: "letter", description: "Stick out your thumb and pinky; fold the middle three fingers.", tip: "Think 'hang loose' — keep the three middle fingers tight.", glyph: "🤙" },
  "1": { label: "1", kind: "number", description: "Point your index finger up; fold the rest.", tip: "Keep the thumb resting across your folded fingers, not out.", glyph: "☝️" },
  "2": { label: "2", kind: "number", description: "Raise index and middle fingers, spread apart.", tip: "Same shape as V — thumb stays tucked.", glyph: "✌️" },
  "3": { label: "3", kind: "number", description: "Raise index and middle fingers AND stick your thumb out.", tip: "Ring and pinky stay folded; the thumb is what makes it a 3." },
  "4": { label: "4", kind: "number", description: "Raise all four fingers, spread; tuck the thumb across the palm.", tip: "If the thumb pokes out it reads as 5." },
  "5": { label: "5", kind: "number", description: "Open hand, all five fingers spread wide.", tip: "Face your palm toward the camera.", glyph: "🖐️" },
  "6": { label: "6", kind: "number", description: "Touch your thumb to your pinky tip; keep the other three fingers up.", tip: "Only the pinky bends — index, middle, ring stay straight." },
  "7": { label: "7", kind: "number", description: "Touch your thumb to your ring finger tip; other fingers up.", tip: "Index, middle, and pinky stay straight and spread." },
  "8": { label: "8", kind: "number", description: "Touch your thumb to your middle finger tip; other fingers up.", tip: "Index, ring, and pinky stay straight." },
  "9": { label: "9", kind: "number", description: "Touch your thumb to your index finger tip; other fingers up.", tip: "Like an 'OK' sign with the three free fingers spread.", glyph: "👌" },
};

export const LETTER_CATALOG = ["I", "L", "V", "W", "Y"] as const;
export const NUMBER_CATALOG = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function describeSign(label: string): SignInfo {
  return (
    SIGNS[label] ?? {
      label,
      kind: /^\d$/.test(label) ? "number" : "letter",
      description: `Sign ${label}.`,
      tip: "Hold the shape steady for one second.",
    }
  );
}

/** Shuffled picks with no immediate repeats, cycling through fresh shuffles
 * when count exceeds the catalog. `random` is injectable for tests. */
export function pickSigns(count: number, catalog: readonly string[] = LETTER_CATALOG, random = Math.random): string[] {
  const picks: string[] = [];
  while (picks.length < count) {
    const bag = shuffle([...catalog], random);
    // Avoid the seam repeat where one bag ends with the sign the next starts with.
    if (bag.length > 1 && picks.length && bag[0] === picks[picks.length - 1]) bag.push(bag.shift() as string);
    picks.push(...bag);
  }
  return picks.slice(0, count);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
