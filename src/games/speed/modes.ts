// The three Speed modes. Same game, three clocks — and one colour each, so
// which mode you're in is legible before you read a word of it.
//
// Colours are the existing semantic tokens (success / accent / danger), which
// means the high-contrast palette in globals.css swaps them automatically;
// no new colour is introduced here. The tier idea matches the Math Lab's
// TIER_STYLE, with danger standing in for Hard so Speed reads as its own mode.
//
// The clocks live here rather than in gameLogic.ts: a mode's duration is mode
// data now that there are three of them. Medium keeps the 30 seconds Speed has
// always run at (gameLogic's SPEED_CHALLENGE_SECONDS), so the default round is
// unchanged. Kept free of React and of gameLogic's Supabase import chain so it
// stays unit-testable under plain Node (see tests/practiceSpeed.test.ts).

export type SpeedModeId = "easy" | "medium" | "hard";

export type SpeedTheme = {
  /** Timer bar fill. */
  bar: string;
  /** Mode badge in the header and on the switcher. */
  pill: string;
  dot: string;
  /** Big numbers on the score tiles. */
  value: string;
  /** The selected switcher chip. */
  chip: string;
  /** Tint behind the deck line. */
  soft: string;
  border: string;
};

export type SpeedMode = {
  id: SpeedModeId;
  label: string;
  seconds: number;
  /** Points multiplier, so a shorter clock is still worth playing. */
  multiplier: number;
  /** One line on the switcher chip. */
  tagline: string;
  /** The page description under the title. */
  description: string;
  theme: SpeedTheme;
};

export const SPEED_MODES: readonly SpeedMode[] = [
  {
    id: "easy",
    label: "Easy",
    seconds: 60,
    multiplier: 1,
    tagline: "A full minute",
    description:
      "Sixty seconds, no rush. Sign each letter or number as it appears and hold it steady. Your timer only runs while the camera is ready — pause whenever you need.",
    theme: {
      bar: "bg-success",
      pill: "bg-success-soft text-success",
      dot: "bg-success",
      value: "text-success",
      chip: "border-success bg-success-soft text-success",
      soft: "bg-success-soft",
      border: "border-success/50",
    },
  },
  {
    id: "medium",
    label: "Medium",
    seconds: 30,
    multiplier: 1.5,
    tagline: "Thirty seconds",
    description:
      "Thirty seconds of focused practice, and every sign is worth half again as much. Your timer only runs while the camera is ready. Pause whenever you need.",
    theme: {
      bar: "bg-accent",
      pill: "bg-accent/30 text-accent-ink",
      dot: "bg-accent",
      value: "text-accent-ink",
      chip: "border-accent bg-accent/25 text-accent-ink",
      soft: "bg-accent/20",
      border: "border-accent/60",
    },
  },
  {
    id: "hard",
    label: "Hard",
    seconds: 15,
    multiplier: 2,
    tagline: "Fifteen seconds",
    description:
      "Fifteen seconds. Double points per sign, and no time to second-guess a hand shape. Your timer only runs while the camera is ready.",
    theme: {
      bar: "bg-danger",
      pill: "bg-danger-soft text-danger",
      dot: "bg-danger",
      value: "text-danger",
      chip: "border-danger bg-danger-soft text-danger",
      soft: "bg-danger-soft",
      border: "border-danger/50",
    },
  },
];

export const DEFAULT_SPEED_MODE: SpeedModeId = "medium";

export function findSpeedMode(id: string | null | undefined): SpeedMode {
  return SPEED_MODES.find((mode) => mode.id === id) ?? SPEED_MODES.find((mode) => mode.id === DEFAULT_SPEED_MODE)!;
}

export function speedHref(mode: SpeedMode | SpeedModeId): string {
  return `/speed?mode=${typeof mode === "string" ? mode : mode.id}`;
}

/** Points for one confirmed sign at this mode's difficulty. */
export function speedPoints(basePoints: number, mode: SpeedMode): number {
  return Math.round(basePoints * mode.multiplier);
}
