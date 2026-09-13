// Each game is marked by its own math symbol rather than a generic stock
// icon — a Math Lab card should look like the maths it teaches, and the
// symbol tells you the topic before you read a word.
import { TIER_STYLE } from "./tierStyle";
import type { Difficulty } from "./types";

const SIZES = {
  sm: "h-12 w-12 rounded-xl text-2xl",
  md: "h-14 w-14 rounded-2xl text-3xl",
  lg: "h-16 w-16 rounded-2xl text-4xl",
} as const;

export function GameGlyph({ glyph, difficulty, size = "sm" }: { glyph: string; difficulty: Difficulty; size?: keyof typeof SIZES }) {
  // A bare variable reads as maths only in italic (x vs. the letter x).
  const italic = /^[a-z]$/.test(glyph) ? "italic" : "";
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center font-serif leading-none font-bold tracking-tight ${italic} ${SIZES[size]} ${TIER_STYLE[difficulty].tile}`}>
      {glyph}
    </span>
  );
}
