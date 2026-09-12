// Step indicator for fixed-length rounds (Lesson, Math): one dot per item,
// coloured by outcome, with the current one pulsing.
export type StepOutcome = "correct" | "miss";

type ProgressDotsProps = {
  total: number;
  current: number;
  outcomes: readonly StepOutcome[];
};

export function ProgressDots({ total, current, outcomes }: ProgressDotsProps) {
  return (
    <ol className="flex items-center justify-center gap-2" aria-label={`Step ${Math.min(current + 1, total)} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const outcome = outcomes[i];
        const isCurrent = i === current;
        const cls =
          outcome === "correct"
            ? "bg-emerald-400"
            : outcome === "miss"
              ? "bg-red-400"
              : isCurrent
                ? "bg-violet-400 animate-pulse ring-4 ring-violet-500/30"
                : "bg-slate-700";
        return (
          <li
            key={i}
            className={`h-3 w-3 rounded-full transition-colors ${cls}`}
            aria-current={isCurrent ? "step" : undefined}
            aria-label={outcome ? `Step ${i + 1}: ${outcome}` : `Step ${i + 1}`}
          />
        );
      })}
    </ol>
  );
}
