// Small pill for a game's tier. One place for the tier colours so the hub
// cards, game header and results all agree.
import { TIER_STYLE } from "./tierStyle";
import { DIFFICULTY_LABEL, type Difficulty } from "./types";


export function DifficultyBadge({ difficulty, size = "sm" }: { difficulty: Difficulty; size?: "sm" | "md" }) {
  const s = TIER_STYLE[difficulty];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-extrabold tracking-wide uppercase ${s.pill} ${size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]"}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}
