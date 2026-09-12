// The "3 + 4 = ?" prompt for Math mode, tinted by the last outcome and
// carrying the feedback / hint line so screen readers hear it in context.
import type { MathProblem } from "./mathProblems";

export type MathFeedback = { kind: "success" | "miss"; text: string };

type MathProblemCardProps = {
  problem: MathProblem;
  index: number;
  total: number;
  feedback: MathFeedback | null;
  hint: string | null;
};

export function MathProblemCard({ problem, index, total, feedback, hint }: MathProblemCardProps) {
  const tone =
    feedback?.kind === "success"
      ? "border-emerald-400 bg-emerald-500/10"
      : feedback?.kind === "miss"
        ? "border-red-400 bg-red-500/10"
        : "border-slate-800 bg-slate-900/60";
  return (
    <section aria-live="polite" className={`rounded-2xl border px-6 py-5 text-center transition-colors ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Problem {index + 1} of {total}
      </p>
      <h1 className="mt-1 text-6xl font-black tracking-tight">{problem.prompt} = ?</h1>
      <p className="mt-3 min-h-6 text-base text-slate-200" role="status">
        {feedback ? feedback.text : (hint ?? "Sign the digit, or tap the mic and say it.")}
      </p>
    </section>
  );
}
