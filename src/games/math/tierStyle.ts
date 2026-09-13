// Tier colours shared by the hub cards, game header, intro and results.
import type { Difficulty } from "./types";

export const TIER_STYLE: Record<Difficulty, { pill: string; dot: string; tile: string; ring: string }> = {
  easy: { pill: "bg-success-soft text-success", dot: "bg-success", tile: "bg-success-soft text-success", ring: "hover:border-success/60" },
  medium: { pill: "bg-accent/30 text-accent-ink", dot: "bg-accent", tile: "bg-accent/25 text-accent-ink", ring: "hover:border-accent" },
  hard: { pill: "bg-brand-soft text-brand", dot: "bg-brand", tile: "bg-brand-soft text-brand", ring: "hover:border-brand/60" },
};
